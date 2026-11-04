#!/usr/bin/env node
// Offline-Prüfung der PWA mit Chromium über das DevTools-Protokoll (CDP).
//
// Ablauf:
//   1. Online aufwärmen: Seite laden, neu laden (Service-Worker übernimmt), keinen Test öffnen.
//   2. Fall A „Verbindung schlägt fehl“: Frontend-Container stoppen (Port geschlossen).
//   3. Fall B „Verbindung hängt“: Auf dem Port nimmt ein Node-net-Server Verbindungen an
//      und antwortet nie (wie ein nicht erreichbarer Server oder „Lie-Fi“).
//   4. Online-Gegenprobe: Container wieder starten, App lädt normal, kein Offline-Banner.
// In Fall A und B wird jeweils gemessen bzw. geprüft:
//   Startzeit bis zur Testliste, Testdetails eines online nie geöffneten Tests
//   (Referenzwerte, Versandinfos), Tab „Grafiken“, Offline-Banner, Konsolenfehler.
//
// Voraussetzungen: Node >= 22 (eingebautes WebSocket/fetch), Chromium, Docker.
// Die App muss als Container laufen, dessen Port 80 auf OFFLINE_URL zeigt, z.B.:
//   docker network create so-test
//   docker run -d --name so-test-api --network so-test --network-alias api \
//     -e PGHOST=192.168.178.64 -e PGPASSWORD=… <api-image>
//   docker run -d --name so-test-web --network so-test -p 8199:80 <frontend-image>
//   node scripts/offline-check.mjs
//
// Umgebungsvariablen (alle optional):
//   OFFLINE_URL        Basis-URL der App            (Default http://localhost:8199/)
//   OFFLINE_CONTAINER  Name des Frontend-Containers (Default so-test-web)
//   CHROMIUM           Chromium-Binary              (Default chromium)
//   SCREENSHOT_DIR     Ziel der Screenshots         (Default docs/screenshots)
//   TEST_ID / TEST_NAME           Test aus der Liste (Default T0008 „Glucose im Urin“)
//   VERSAND_TEST_ID               Test mit Versandinfos (Default T0567)
//   EXPECT_TESTS       erwartete Anzahl Tests       (Default 1497)
//   MAX_START_MS       erlaubte Startzeit offline   (Default 1000)
//
// Exit-Code 0, wenn alle Erwartungen erfüllt sind, sonst 1.
// Screenshots (aus Fall B): SCREENSHOT_DIR/offline-start.png (Liste mit Banner) und
// SCREENSHOT_DIR/offline-detail.png (Details von VERSAND_TEST_ID); weitere Bilder
// (Detail aus der Liste, Grafiken, Dark Mode) landen in $TMPDIR.

import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.OFFLINE_URL || 'http://localhost:8199/';
const CONTAINER = process.env.OFFLINE_CONTAINER || 'so-test-web';
const CHROMIUM = process.env.CHROMIUM || 'chromium';
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'docs', 'screenshots');
const TEST_ID = process.env.TEST_ID || 'T0008';
const TEST_NAME = process.env.TEST_NAME || 'Glucose im Urin';
const VERSAND_TEST_ID = process.env.VERSAND_TEST_ID || 'T0567';
const EXPECT_TESTS = Number(process.env.EXPECT_TESTS || 1497);
const MAX_START_MS = Number(process.env.MAX_START_MS || 1000);
const PORT = Number(new URL(BASE).port || 80);
const DEBUG_PORT = 9333;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profileDir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'so-offline-prof-'));
const results = { url: BASE, cases: {} };
const failures = [];
const expect = (ok, label) => { if (!ok) failures.push(label); return ok; };

// ---------------------------------------------------------------------------
// Chromium + CDP
// ---------------------------------------------------------------------------
async function openBrowser() {
  const ch = spawn(CHROMIUM, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profileDir}`,
    '--window-size=1440,1000', 'about:blank',
  ], { stdio: 'ignore' });
  let tabs;
  for (let i = 0; i < 50 && !tabs; i++) {
    await sleep(200);
    try { tabs = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json(); } catch { /* startet noch */ }
  }
  if (!tabs) throw new Error('Chromium-DevTools nicht erreichbar');
  const page = tabs.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = {};
  const S = { consoleErrors: [], exceptions: [], failed: [] };
  const reqUrl = {};
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending[m.id]) { pending[m.id](m.result ?? m); delete pending[m.id]; return; }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      const text = m.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
      const src = m.params.stackTrace?.callFrames?.[0]?.url || '';
      S.consoleErrors.push({ text: text.slice(0, 200), src });
    }
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      S.exceptions.push({ text: (d.exception?.description || d.text || '').slice(0, 200), src: d.url || '' });
    }
    if (m.method === 'Network.requestWillBeSent') reqUrl[m.params.requestId] = m.params.request.url;
    if (m.method === 'Network.loadingFailed') S.failed.push(`${m.params.errorText} ${reqUrl[m.params.requestId] || ''}`);
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;
  await send('Network.enable');
  await send('Page.enable');
  await send('Runtime.enable');
  const close = async () => { try { ws.close(); } catch { /* egal */ } ch.kill(); await sleep(800); };
  const resetLogs = () => { S.consoleErrors.length = 0; S.exceptions.length = 0; S.failed.length = 0; };
  return { send, ev, S, close, resetLogs };
}

async function waitFor(b, expr, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await b.ev(expr)) return Date.now() - t0;
    await sleep(50);
  }
  return null;
}

async function screenshot(b, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const r = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  return file;
}

// Detailansicht mit höherem Fenster, Versandinfos und Referenzwerte im Bild
async function detailShot(b, file) {
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1500, deviceScaleFactor: 1, mobile: false });
  await sleep(300);
  await b.ev(`(() => { const h = [...document.querySelectorAll('.test-details-container h3')]
    .find((e) => e.textContent.trim() === 'Probenanforderungen'); if (!h) return false;
    // nur den Dialog scrollen, die Seite (mit Banner) bleibt oben
    const c = document.querySelector('.test-details-container');
    c.scrollTop = h.offsetTop - 24; window.scrollTo(0, 0); return true })()`);
  await sleep(300);
  await screenshot(b, file);
  await b.send('Emulation.clearDeviceMetricsOverride');
  return file;
}

// ---------------------------------------------------------------------------
// Ausdrücke im Seitenkontext
// ---------------------------------------------------------------------------
const LIST_RE = String.raw`/Zeige \d+ - \d+ von (\d+) Tests/`;
const listCount = `(() => { const m = (document.body?.innerText || '').match(${LIST_RE}); return m ? Number(m[1]) : 0 })()`;
const bannerText = `(document.querySelector('[data-testid="offline-banner"]')?.innerText || '').trim()`;
const clickText = (txt) => `(() => { const el = [...document.querySelectorAll('button, [role=button], li, div, span, p, h3, h4')]
  .filter((e) => e.textContent.trim() === ${JSON.stringify(txt)}).pop(); if (el) el.click(); return !!el })()`;
// Abschnitte der Detailansicht: Überschrift → Tabellenzeilen
const detailInfo = `(() => {
  const c = document.querySelector('.test-details-container'); if (!c) return null;
  const sec = {};
  for (const s of c.querySelectorAll('.details-section')) {
    const h = s.querySelector('h3')?.textContent.trim(); if (!h) continue;
    sec[h] = [...s.querySelectorAll('tbody tr')].map((tr) => tr.innerText.replace(/\\s+/g, ' ').trim());
  }
  return { titel: c.querySelector('h2')?.textContent.trim(), sec };
})()`;

// ---------------------------------------------------------------------------
// Prüfschritte
// ---------------------------------------------------------------------------
async function measureStart(b, runs = 3) {
  const times = [];
  for (let i = 0; i < runs; i++) {
    await b.send('Page.navigate', { url: 'about:blank' });
    await sleep(300);
    const t0 = Date.now();
    await b.send('Page.navigate', { url: BASE });
    let t = null;
    while (Date.now() - t0 < 30000) {
      if ((await b.ev(listCount)) > 0) { t = Date.now() - t0; break; }
      await sleep(25);
    }
    times.push(t);
  }
  return times;
}

async function offlineChecks(b, name, shots) {
  const r = {};
  b.resetLogs();
  r.startMs = await measureStart(b);
  r.tests = await b.ev(listCount);
  expect(r.tests === EXPECT_TESTS, `${name}: ${EXPECT_TESTS} Tests in der Liste (ist ${r.tests})`);
  expect(r.startMs.every((t) => t !== null && t < MAX_START_MS), `${name}: Liste in < ${MAX_START_MS} ms (ist ${r.startMs.join('/')})`);

  // Banner: online/offline-Event bzw. Erreichbarkeitsprüfung braucht in Fall B einige Sekunden
  r.bannerNachMs = await waitFor(b, `${bannerText}.startsWith('Offline')`, 8000);
  r.banner = await b.ev(bannerText);
  expect(!!r.banner, `${name}: Offline-Banner sichtbar`);
  if (shots) await screenshot(b, path.join(SHOT_DIR, 'offline-start.png'));

  // Test aus der Liste öffnen (online nie geöffnet)
  r.klickTest = await b.ev(clickText(TEST_NAME));
  await waitFor(b, `!!document.querySelector('.test-details-container')`, 3000);
  await sleep(500);
  r.detail = await b.ev(detailInfo);
  expect((r.detail?.sec?.Referenzwerte || []).length > 0, `${name}: Referenzwerte für ${TEST_ID} (${TEST_NAME})`);
  if (shots) await screenshot(b, path.join(process.env.TMPDIR || os.tmpdir(), 'offline-detail-liste.png'));

  // Test mit Versandinfos direkt über ?test= öffnen
  await b.send('Page.navigate', { url: `${BASE}?test=${VERSAND_TEST_ID}` });
  await waitFor(b, `!!document.querySelector('.test-details-container')`, 5000);
  await sleep(500);
  r.versandDetail = await b.ev(detailInfo);
  expect((r.versandDetail?.sec?.Versandinformationen || []).length > 0, `${name}: Versandinfos für ${VERSAND_TEST_ID}`);
  expect((r.versandDetail?.sec?.Referenzwerte || []).length > 0, `${name}: Referenzwerte für ${VERSAND_TEST_ID}`);
  if (shots) await detailShot(b, path.join(SHOT_DIR, 'offline-detail.png'));

  // Grafiken
  await b.send('Page.navigate', { url: BASE });
  await waitFor(b, `${listCount} > 0`, 5000);
  r.klickGrafiken = await b.ev(clickText('Grafiken'));
  // Grafik-Ansicht geladen (Tab „Kategorien-Treemap“ gehört zu TimelineView) und
  // mindestens ein großes nivo-Diagramm gezeichnet (Icons sind nur wenige Pixel breit)
  r.grafikenMs = await waitFor(b, `(document.querySelector('main')?.innerText || '').includes('Kategorien-Treemap')
    && [...document.querySelectorAll('main svg')].some((s) => s.getBoundingClientRect().width > 300)`, 8000);
  r.grafiken = await b.ev(`(document.querySelector('main')?.innerText || '').replace(/\\s+/g, ' ').slice(0, 160)`);
  expect(r.grafikenMs !== null, `${name}: Tab „Grafiken“ zeigt Diagramme`);
  if (shots) await screenshot(b, path.join(process.env.TMPDIR || os.tmpdir(), 'offline-grafiken.png'));

  // Manifest aus dem Precache
  r.manifest = await b.ev(`fetch('/manifest.webmanifest').then((x) => x.status + ' ' + (x.headers.get('content-type') || '')).catch((e) => 'Fehler ' + e.message)`);

  // Konsole: nur Fehler aus App-Code (eigene Origin), keine Beacon/Extension-Meldungen
  const fremd = /cloudflareinsights|chrome-extension:/;
  r.konsole = [...b.S.consoleErrors, ...b.S.exceptions].filter((e) => !fremd.test(e.text + ' ' + e.src));
  r.failedToFetch = r.konsole.filter((e) => /Failed to fetch/i.test(e.text));
  expect(r.failedToFetch.length === 0, `${name}: keine „Failed to fetch“-Fehler aus App-Code (${r.failedToFetch.length})`);
  return r;
}

function docker(...args) {
  return execFileSync('docker', args, { encoding: 'utf8' }).trim();
}

async function waitHttp(url, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(1000) }); if (r.ok) return true; } catch { /* noch nicht */ }
    await sleep(300);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Ablauf
// ---------------------------------------------------------------------------
let blackhole;
try {
  docker('start', CONTAINER);
  if (!await waitHttp(BASE, 20000)) throw new Error(`${BASE} antwortet nicht`);

  // 1) online aufwärmen (keinen Test öffnen)
  let b = await openBrowser();
  await b.send('Page.navigate', { url: BASE });
  await waitFor(b, `${listCount} > 0`, 20000);
  await waitFor(b, `navigator.serviceWorker.ready.then(() => true)`, 15000);
  await sleep(2000);
  await b.send('Page.reload', {});
  await waitFor(b, `${listCount} > 0 && !!navigator.serviceWorker.controller`, 20000);
  await sleep(3000); // Hintergrund-Revalidierung und Precache abwarten
  results.warmup = {
    tests: await b.ev(listCount),
    banner: await b.ev(bannerText),
    precache: await b.ev(`caches.keys().then(async (ks) => { const k = ks.find((x) => x.includes('precache')); if (!k) return 0; return (await (await caches.open(k)).keys()).length })`),
    timelineChunkPrecached: await b.ev(`caches.keys().then(async (ks) => { for (const k of ks) { const keys = await (await caches.open(k)).keys(); if (keys.some((r) => /TimelineView-/.test(r.url))) return k } return false })`),
    apiCache: await b.ev(`caches.open('api-cache').then(async (c) => (await c.keys()).map((r) => { const u = new URL(r.url); return u.pathname + u.search }))`),
    lastSync: await b.ev(`localStorage.getItem('specimenOne.lastOnlineSync')`),
  };
  expect(!results.warmup.banner, 'online: kein Offline-Banner beim Aufwärmen');
  await b.close();

  // 2) Fall A: Port geschlossen → Verbindung schlägt sofort fehl
  docker('stop', '-t', '2', CONTAINER);
  b = await openBrowser();
  results.cases.A = await offlineChecks(b, 'Fall A', false);
  await b.close();

  // 3) Fall B: Server nimmt Verbindungen an und antwortet nie
  const sockets = new Set();
  blackhole = net.createServer((s) => { sockets.add(s); s.on('error', () => {}); s.on('close', () => sockets.delete(s)); });
  await new Promise((r, j) => blackhole.once('error', j).listen(PORT, r));
  b = await openBrowser();
  results.cases.B = await offlineChecks(b, 'Fall B', true);
  // Dark-Mode-Ansicht des Banners (nur zur Sichtprüfung, landet im TMPDIR)
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await b.send('Page.navigate', { url: BASE });
  await waitFor(b, `${bannerText}.startsWith('Offline')`, 8000);
  results.cases.B.darkShot = await screenshot(b, path.join(process.env.TMPDIR || os.tmpdir(), 'offline-start-dark.png'));
  await b.close();
  for (const s of sockets) s.destroy();
  await new Promise((r) => blackhole.close(r));
  blackhole = null;

  // 4) Online-Gegenprobe
  docker('start', CONTAINER);
  if (!await waitHttp(BASE, 20000)) throw new Error(`${BASE} antwortet nach dem Neustart nicht`);
  b = await openBrowser();
  b.resetLogs();
  const t0 = Date.now();
  await b.send('Page.navigate', { url: BASE });
  const listMs = await waitFor(b, `${listCount} > 0`, 20000);
  await sleep(4000); // Erreichbarkeitsprüfung abwarten
  const online = {
    startMs: listMs ?? (Date.now() - t0),
    tests: await b.ev(listCount),
    banner: await b.ev(bannerText),
    lastSync: await b.ev(`localStorage.getItem('specimenOne.lastOnlineSync')`),
  };
  // offline/online-Events des Browsers: Banner erscheint sofort und verschwindet wieder
  await b.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  online.bannerNachOfflineEventMs = await waitFor(b, `${bannerText}.startsWith('Offline')`, 3000);
  await b.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  online.bannerWegNachOnlineEventMs = await waitFor(b, `${bannerText} === ''`, 6000);
  online.konsole = [...b.S.consoleErrors, ...b.S.exceptions].filter((e) => !/cloudflareinsights|chrome-extension:/.test(e.text + ' ' + e.src));
  results.online = online;
  expect(online.tests === EXPECT_TESTS, `online: ${EXPECT_TESTS} Tests (ist ${online.tests})`);
  expect(!online.banner, 'online: Banner nach Neustart verschwunden');
  expect(online.bannerNachOfflineEventMs !== null, 'online: offline-Event zeigt das Banner');
  expect(online.bannerWegNachOnlineEventMs !== null, 'online: online-Event blendet das Banner aus');
  await b.close();
} catch (err) {
  failures.push(`Abbruch: ${err.message}`);
} finally {
  if (blackhole) blackhole.close();
  try { docker('start', CONTAINER); } catch { /* Container fehlt evtl. */ }
  fs.rmSync(profileDir, { recursive: true, force: true });
}

console.log(JSON.stringify(results, null, 2));
if (failures.length) {
  console.log('\nNICHT ERFÜLLT:');
  for (const f of failures) console.log(' ✗ ' + f);
  process.exit(1);
}
console.log('\nAlle Erwartungen erfüllt.');
