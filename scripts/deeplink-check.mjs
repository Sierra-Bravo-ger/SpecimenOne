#!/usr/bin/env node
// Prüfung „Eigene URL pro Test, Zurück-Geste, Teilen, Profile per Link“ (Karte 9) mit Chromium über CDP.
//
// Läuft gegen eine laufende App (Default http://localhost:8199/, Aufbau wie in scripts/offline-check.mjs).
// Mobil (390×844, mobile:true) und Desktop (1440×1000):
//   - /test/T0003 direkt: Digoxin-Detail, Titel „Digoxin – SpecimenOne“; Zurück schließt nur den Dialog (URL „/“, App offen)
//   - Karte anklicken → /test/<id>; Schließen per ×, Escape, Klick daneben und Zurück-Geste → URL wieder „/“
//   - /test/T9999: Hinweis „Test T9999 nicht gefunden“, „Zur Testliste“
//   - alter Link /?test=T0003 wird zu /test/T0003
//   - Link teilen (Test und persönliches Profil): navigator.share (mobil) bzw. Zwischenablage (Desktop) wird abgefangen
//   - /profil?tests=T0003,T0008,T9999&name=Test: 2 Tests, Hinweis auf T9999, Speichern → unter „Persönliche Profile“
//   - /api/docs/ (Swagger UI) und /datenschutz.html unverändert
// Danach (nur mit OFFLINE_DIRECT=1 und Docker): Service Worker aufwärmen, Container stoppen,
// /test/T0008 offline direkt aufrufen, Container wieder starten.
// Screenshots: SCREENSHOT_DIR/deeplink-*.png (Default docs/screenshots). Exit-Code 1 bei Fehlern.

import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = (process.env.UX_URL || 'http://localhost:8199/').replace(/\/$/, '');
const CHROMIUM = process.env.CHROMIUM || 'chromium';
const CONTAINER = process.env.OFFLINE_CONTAINER || 'so-test-web';
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'docs', 'screenshots');
const DEBUG_PORT = 9336;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profileDir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'so-deeplink-prof-'));
const failures = [];
const expect = (ok, label, extra = '') => { console.log(`${ok ? 'OK  ' : 'FEHL'} ${label}${extra ? ` (${extra})` : ''}`); if (!ok) failures.push(label); return ok; };

const ch = spawn(CHROMIUM, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profileDir}`, 'about:blank',
], { stdio: 'ignore' });
let tabs;
for (let i = 0; i < 50 && !tabs; i++) {
  await sleep(200);
  try { tabs = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json(); } catch { /* startet noch */ }
}
if (!tabs) throw new Error('Chromium-DevTools nicht erreichbar');
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0;
const pending = {};
const consoleErrors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending[m.id]) { pending[m.id](m.result ?? m); delete pending[m.id]; return; }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    consoleErrors.push(m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200));
  }
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;
await send('Page.enable'); await send('Runtime.enable');

async function waitFor(expr, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await ev(expr)) return true; await sleep(100); }
  return false;
}
async function shot(name) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const f = path.join(SHOT_DIR, `deeplink-${name}.png`);
  fs.writeFileSync(f, Buffer.from(r.data, 'base64'));
  console.log('     Screenshot', f);
}
let stubId;
async function viewport(kind) {
  const mobil = kind === 'mobil';
  await send('Emulation.setDeviceMetricsOverride', mobil
    ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
    : { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  if (stubId) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: stubId });
  // Teilen abfangen: mobil gibt es navigator.share, am Desktop nur die Zwischenablage
  const source = mobil
    ? `window.__geteilt = []; navigator.share = async (d) => { window.__geteilt.push({ art: 'share', ...d }); };`
    : `window.__geteilt = []; Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
       Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (t) => { window.__geteilt.push({ art: 'zwischenablage', url: t }); } }, configurable: true });`;
  stubId = (await send('Page.addScriptToEvaluateOnNewDocument', { source })).identifier;
}
const gehe = async (pfad) => { await send('Page.navigate', { url: BASE + pfad }); await sleep(400); };
const pfad = () => ev('location.pathname + location.search');
const dialogTitel = () => ev(`document.querySelector('[role=dialog] h2, [role=alertdialog] h2')?.textContent || ''`);
const dialogOffen = () => ev(`!!document.querySelector('[role=dialog], [role=alertdialog]')`);
const karten = () => ev(`document.querySelectorAll('div.test-card').length`);
async function key(k, code, vk, text) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, ...(text ? { text } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  await sleep(150);
}

async function lauf(kind) {
  console.log(`\n=== ${kind} ===`);
  await viewport(kind);
  await gehe('/');
  await waitFor(`document.querySelectorAll('div.test-card').length > 0`);
  await ev(`localStorage.clear()`);
  await ev(`localStorage.setItem('specimenOne.willkommenAusgeblendet', 'true')`);

  // 1. Direkter Aufruf
  await gehe('/test/T0003');
  expect(await waitFor(`document.querySelector('[role=dialog] h2')?.textContent === 'Digoxin'`), 'Direktaufruf /test/T0003 zeigt das Detail von Digoxin');
  expect(await ev('document.title') === 'Digoxin – SpecimenOne', 'Titel „Digoxin – SpecimenOne“', await ev('document.title'));
  expect(await pfad() === '/test/T0003', 'URL bleibt /test/T0003');
  expect(await karten() > 0, 'Liste liegt unter dem Dialog');
  await shot(`direkt-${kind}`);
  await ev('history.back()'); await sleep(500);
  expect(!(await dialogOffen()), 'Zurück schließt den Dialog');
  expect(await pfad() === '/', 'URL wieder /', await pfad());
  expect(await ev(`location.origin`) === BASE && await karten() > 0, 'App bleibt offen (Liste sichtbar)');
  expect(await ev('document.title') === 'SpecimenOne', 'Titel wieder „SpecimenOne“', await ev('document.title'));
  await ev('history.forward()'); await sleep(500);
  expect(await dialogTitel() === 'Digoxin', 'Vorwärts öffnet den Dialog wieder');
  await ev('history.back()'); await sleep(400);

  // 2. Aus der Liste öffnen, auf vier Arten schließen
  const schliessArten = [
    ['Zurück-Geste', () => ev('history.back()')],
    ['×-Knopf', () => ev(`document.querySelector('button.close-button').click()`)],
    ['Escape', () => key('Escape', 'Escape', 27)],
    ['Klick daneben', () => ev(`document.querySelector('.test-details-overlay').dispatchEvent(new MouseEvent('click', { bubbles: true }))`)],
  ];
  for (const [name, schliessen] of schliessArten) {
    await gehe('/');
    await waitFor(`document.querySelectorAll('div.test-card').length > 0`);
    const nameTest = await ev(`document.querySelector('div.test-card .test-open')?.textContent.trim()`);
    await ev(`document.querySelector('div.test-card .test-open').click()`); await sleep(500);
    const p = await pfad();
    expect(/^\/test\/T\d+$/.test(p) && await dialogOffen(), `Klick auf „${nameTest}“ öffnet ${p}`);
    expect(await ev('document.title') === `${nameTest} – SpecimenOne`, 'Titel passt zum Test', await ev('document.title'));
    if (name === 'Zurück-Geste') await shot(`liste-detail-${kind}`);
    await schliessen(); await sleep(600);
    expect(!(await dialogOffen()) && await pfad() === '/' && await karten() > 0, `${name}: Dialog zu, URL „/“, App offen`, await pfad());
  }

  // 3. Teilen im Detail (Maus und Tastatur)
  await gehe('/test/T0003');
  await waitFor(`!!document.querySelector('button.teilen-knopf')`);
  await ev(`document.querySelector('button.teilen-knopf').scrollIntoView()`);
  expect(await ev(`document.querySelector('button.teilen-knopf').getAttribute('aria-label')`) === 'Link zu Digoxin teilen', 'Teilen-Knopf hat aria-label');
  await ev(`document.querySelector('button.teilen-knopf').click()`); await sleep(400);
  let geteilt = JSON.parse(await ev('JSON.stringify(window.__geteilt)'));
  const erwartet = `${BASE}/test/T0003`;
  const url1 = geteilt[0]?.url;
  expect(url1 === erwartet && geteilt[0].art === (kind === 'mobil' ? 'share' : 'zwischenablage'), `Teilen per ${geteilt[0]?.art} mit ${url1}`);
  if (kind === 'desktop') expect((await ev(`document.querySelector('.teilen-meldung').textContent`)) === 'Link kopiert', 'Bestätigung „Link kopiert“');
  await shot(`teilen-${kind}`);
  await ev(`window.__geteilt = []; document.querySelector('button.teilen-knopf').focus()`);
  await key('Enter', 'Enter', 13, '\r');
  geteilt = JSON.parse(await ev('JSON.stringify(window.__geteilt)'));
  expect(geteilt.length === 1 && geteilt[0].url === erwartet, 'Teilen-Knopf per Tastatur (Enter) bedienbar');
  await ev('history.back()'); await sleep(400);

  // 4. Ungültige ID
  await gehe('/test/T9999');
  expect(await waitFor(`document.querySelector('[role=alertdialog] h2')?.textContent === 'Test T9999 nicht gefunden'`), 'Hinweis „Test T9999 nicht gefunden“', await dialogTitel());
  await shot(`nicht-gefunden-${kind}`);
  await ev(`[...document.querySelectorAll('[role=alertdialog] md-filled-button')].find((b) => b.textContent.includes('Testliste')).click()`); await sleep(400);
  expect(!(await dialogOffen()) && await pfad() === '/' && await karten() > 0, '„Zur Testliste“ führt zurück auf „/“');

  // 5. Alter Link /?test=
  await gehe('/?test=T0003');
  expect(await waitFor(`document.querySelector('[role=dialog] h2')?.textContent === 'Digoxin'`) && await pfad() === '/test/T0003', 'Alter Link /?test=T0003 öffnet Digoxin unter /test/T0003', await pfad());

  // 6. Profil per Link
  await gehe('/profil?tests=T0003,T0008,T9999&name=Test');
  expect(await waitFor(`document.querySelector('#geteiltes-profil-titel')?.textContent === 'Test'`), 'Profil „Test“ geöffnet');
  expect(await ev(`document.querySelectorAll('[aria-label="Tests im Profil"] li').length`) === 2, 'Profil enthält 2 Tests');
  const hinweis = await ev(`document.querySelector('[role=alert]')?.textContent || ''`);
  expect(hinweis.includes('T9999') && hinweis.includes('übersprungen'), 'Hinweis auf die unbekannte ID T9999', hinweis);
  await shot(`profil-${kind}`);
  // Test aus dem Profil öffnen und mit Zurück wieder schließen
  await ev(`document.querySelector('[aria-label="Tests im Profil"] button').click()`); await sleep(500);
  expect(/^\/test\//.test(await pfad()), 'Test aus dem Profil hat eigene Adresse', await pfad());
  await ev('history.back()'); await sleep(500);
  expect((await pfad()).startsWith('/profil?tests=') && await ev(`!!document.querySelector('#geteiltes-profil-titel')`), 'Zurück bringt zum Profil');
  // Link teilen im Profil
  await ev(`window.__geteilt = []; document.querySelector('button[aria-label^="Link zum Profil"]').click()`); await sleep(400);
  geteilt = JSON.parse(await ev('JSON.stringify(window.__geteilt)'));
  expect(geteilt[0]?.url === `${BASE}/profil?tests=T0003,T0008&name=Test`, 'Profil-Link ohne unbekannte ID', geteilt[0]?.url);
  // Speichern
  await ev(`[...document.querySelectorAll('.actions button')].find((b) => b.textContent.includes('Als persönliches Profil speichern')).click()`); await sleep(300);
  const gespeichert = JSON.parse(await ev(`localStorage.getItem('persoenlicheProfile') || '[]'`));
  expect(gespeichert.length === 1 && gespeichert[0].name === 'Test' && gespeichert[0].tests.map((t) => t.id).join() === 'T0003,T0008', 'localStorage „persoenlicheProfile“ enthält das Profil', JSON.stringify(gespeichert[0]?.tests));
  await ev(`[...document.querySelectorAll('.actions button')].find((b) => b.textContent.trim() === 'Schließen').click()`); await sleep(400);
  expect(await pfad() === '/' && !(await dialogOffen()), 'Profil geschlossen, URL „/“');
  await ev(`[...document.querySelectorAll('nav[aria-label=Ansicht] button')].find((b) => b.textContent.includes('Test-Profile')).click()`); await sleep(500);
  await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Persönliche Profile').click()`); await sleep(1200);
  const persoenlich = await ev(`document.body.innerText`);
  expect(persoenlich.includes('Test') && persoenlich.includes('2 Test'), 'Profil erscheint unter „Persönliche Profile“');
  await ev(`window.__geteilt = []; document.querySelector('button[aria-label="Link zum Profil Test teilen"]').click()`); await sleep(400);
  geteilt = JSON.parse(await ev('JSON.stringify(window.__geteilt)'));
  expect(geteilt[0]?.url === `${BASE}/profil?tests=T0003,T0008&name=Test`, 'Persönliche Profile: „Link teilen“ liefert den Profil-Link', geteilt[0]?.url);
  await shot(`persoenlich-${kind}`);

  // 7. Grenzen
  const viele = Array.from({ length: 120 }, (_, i) => `T${String(i + 1).padStart(4, '0')}`).join(',');
  await gehe(`/profil?tests=${viele}&name=Gross`);
  await waitFor(`!!document.querySelector('#geteiltes-profil-titel')`);
  const anzahl = await ev(`document.querySelectorAll('[aria-label="Tests im Profil"] li').length`);
  const hinweisViele = await ev(`document.body.innerText.includes('höchstens 100')`);
  expect(anzahl <= 100 && hinweisViele, 'Mehr als 100 IDs: höchstens 100 Tests plus Hinweis', `${anzahl} Tests`);
  await gehe('/profil?tests=%3Cscript%3E,T0003&name=%3Cb%3Ex');
  await waitFor(`!!document.querySelector('#geteiltes-profil-titel')`);
  expect(await ev(`document.querySelector('#geteiltes-profil-titel').textContent`) === '<b>x' && await ev(`!document.querySelector('#geteiltes-profil-titel b')`), 'Name wird als Text angezeigt, kein HTML');
}

await lauf('mobil');
await lauf('desktop');

// Statische Seiten und API-Doku unverändert
console.log('\n=== Infrastruktur ===');
await gehe('/api/docs/');
expect(await waitFor(`!!document.querySelector('.swagger-ui')`), '/api/docs/ zeigt die Swagger UI');
await gehe('/datenschutz.html');
expect(/Datenschutz/.test(await ev('document.title')), '/datenschutz.html zeigt die Datenschutzseite', await ev('document.title'));
expect(await pfad() === '/datenschutz.html', 'keine Umleitung auf die App');

const echteFehler = consoleErrors.filter((m) => !/Failed to load resource|favicon|cloudflareinsights|ERR_/.test(m));
expect(echteFehler.length === 0, 'keine Konsolenfehler', echteFehler.join(' | '));

// Offline: Service-Worker-Fallback für /test/<id>
if (process.env.OFFLINE_DIRECT === '1') {
  console.log('\n=== Offline /test/T0008 ===');
  await viewport('mobil');
  await gehe('/');
  await waitFor(`document.querySelectorAll('div.test-card').length > 0`);
  await waitFor(`navigator.serviceWorker.controller !== null || navigator.serviceWorker.ready.then(() => true)`);
  await gehe('/'); // jetzt vom Service Worker kontrolliert
  await waitFor(`document.querySelectorAll('div.test-card').length > 0`);
  await ev(`navigator.serviceWorker.controller ? 1 : 0`);
  await ev(`fetch('/api/tests?page=1&limit=2000').then((r) => r.status)`);
  await sleep(1500);
  execFileSync('docker', ['stop', CONTAINER]);
  try {
    await gehe('/test/T0008');
    const ok = await waitFor(`document.querySelector('[role=dialog] h2')?.textContent?.length > 0`, 10000);
    const titel = await dialogTitel();
    expect(ok, 'offline: /test/T0008 öffnet das Detail', titel);
    expect(await ev('document.title') === `${titel} – SpecimenOne`, 'offline: Titel passt', await ev('document.title'));
    await shot('offline-test');
    await ev('history.back()'); await sleep(500);
    expect(!(await dialogOffen()) && await karten() > 0, 'offline: Zurück schließt den Dialog, Liste bleibt');
    await gehe('/test/T0003');
    expect(await waitFor(`document.querySelector('[role=dialog] h2')?.textContent === 'Digoxin'`, 8000), 'offline: /test/T0003 zeigt Digoxin');
    await gehe('/profil?tests=T0003,T0008&name=Offline');
    expect(await waitFor(`document.querySelector('#geteiltes-profil-titel')?.textContent === 'Offline'`, 8000), 'offline: /profil öffnet das Profil');
  } finally {
    execFileSync('docker', ['start', CONTAINER]);
  }
}

ch.kill();
try { fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 5 }); } catch { /* Chromium räumt noch auf */ }
console.log(failures.length ? `\n${failures.length} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(failures.length ? 1 : 0);
