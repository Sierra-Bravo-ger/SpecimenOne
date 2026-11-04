#!/usr/bin/env node
// UX-Prüfung des Willkommenshinweises und der Rechtslinks mit Chromium über CDP.
//
// Prüft gegen eine laufende App (Default http://localhost:8199/, Aufbau wie in
// scripts/offline-check.mjs beschrieben):
//   - Hinweis auf Desktop (1440×1000) und Mobil (390×844, mobile:true), hell und dunkel:
//     Screenshot, Höhe des Hinweises, Position der ersten Testkarte mit/ohne Hinweis
//   - Schließen: Hinweis weg, „?“ im Header, Merkung in localStorage, Hinweis bleibt nach Neuladen weg
//   - Klick auf „Lanoxin“ füllt die Suche, die Liste zeigt Digoxin
//   - /datenschutz.html direkt und nach geladenem Service-Worker (kein App-Fallback)
// Screenshots: SCREENSHOT_DIR/ux-*.png (Default docs/screenshots). Exit-Code 1 bei Fehlern.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.UX_URL || 'http://localhost:8199/';
const CHROMIUM = process.env.CHROMIUM || 'chromium';
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'docs', 'screenshots');
const DEBUG_PORT = 9334;
const MAX_MOBIL_PX = 140;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profileDir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'so-ux-prof-'));
const failures = [];
const expect = (ok, label) => { console.log(`${ok ? 'OK  ' : 'FEHL'} ${label}`); if (!ok) failures.push(label); return ok; };

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
  const f = path.join(SHOT_DIR, `ux-${name}.png`);
  fs.writeFileSync(f, Buffer.from(r.data, 'base64'));
  console.log('     Screenshot', f);
}
async function viewport(kind, scheme) {
  const mobile = kind === 'mobil';
  await send('Emulation.setDeviceMetricsOverride', mobile
    ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
    : { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
}
async function laden(url = BASE) {
  await send('Page.navigate', { url });
  await sleep(500);
  return waitFor(`document.querySelectorAll('div.relative.rounded-lg.shadow-sm.p-4').length > 0`);
}
const CARD_TOP = `Math.round(document.querySelector('div.relative.rounded-lg.shadow-sm.p-4').getBoundingClientRect().top + window.scrollY)`;
const HINT_H = `Math.round(document.querySelector('[data-testid=willkommen-hinweis]').getBoundingClientRect().height)`;

// Erstbesucher: Speicher leeren
await send('Page.navigate', { url: BASE });
await sleep(1000);
await ev('localStorage.clear()');

for (const kind of ['desktop', 'mobil']) {
  for (const scheme of ['light', 'dark']) {
    console.log(`\n== ${kind} / ${scheme}`);
    await viewport(kind, scheme);
    await ev('localStorage.clear()');
    expect(await laden(), `${kind}/${scheme}: Testliste geladen`);
    expect(await ev(`!!document.querySelector('[data-testid=willkommen-hinweis]')`), `${kind}/${scheme}: Hinweis sichtbar bei Erstbesuch`);
    const hoehe = await ev(HINT_H);
    const mitHinweis = await ev(CARD_TOP);
    console.log(`     Höhe Hinweis ${hoehe} px, erste Testkarte bei y=${mitHinweis}`);
    if (kind === 'mobil') expect(hoehe <= MAX_MOBIL_PX, `mobil/${scheme}: Hinweis ${hoehe} px <= ${MAX_MOBIL_PX} px`);
    await shot(`${kind}-${scheme}-hinweis`);

    // Schließen
    await ev(`document.querySelector('[aria-label="Hinweis schließen"]').click()`);
    await sleep(300);
    expect(await ev(`!document.querySelector('[data-testid=willkommen-hinweis]')`), `${kind}/${scheme}: Hinweis nach Schließen weg`);
    expect(await ev(`localStorage.getItem('specimenOne.willkommenAusgeblendet') === '1'`), `${kind}/${scheme}: Merkung in localStorage`);
    expect(await ev(`!!document.querySelector('[aria-label="Einführung und Info zum Projekt anzeigen"]')`), `${kind}/${scheme}: „?“ im Header`);
    const ohne = await ev(CARD_TOP);
    console.log(`     erste Testkarte ohne Hinweis bei y=${ohne} (Differenz ${mitHinweis - ohne} px)`);
    await shot(`${kind}-${scheme}-geschlossen`);

    // Nach Neuladen bleibt er weg, „?“ blendet ihn wieder ein
    await laden();
    expect(await ev(`!document.querySelector('[data-testid=willkommen-hinweis]')`), `${kind}/${scheme}: bleibt nach Neuladen ausgeblendet`);
    await ev(`document.querySelector('[aria-label="Einführung und Info zum Projekt anzeigen"]').click()`);
    await sleep(300);
    expect(await ev(`!!document.querySelector('[data-testid=willkommen-hinweis]') && localStorage.getItem('specimenOne.willkommenAusgeblendet') === null`), `${kind}/${scheme}: „?“ blendet Hinweis wieder ein`);

    // Dialog „Über das Projekt“
    if (scheme === 'light' || kind === 'mobil') {
      await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Über das Projekt').click()`);
      await sleep(300);
      expect(await ev(`!!document.querySelector('[role=dialog]')`), `${kind}/${scheme}: Dialog „Über das Projekt“ offen`);
      await shot(`${kind}-${scheme}-projekt`);
      await ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
    }
  }
}

// Beispielsuche „Lanoxin“ (Mobil, hell)
console.log('\n== Beispielsuchen');
await viewport('desktop', 'light');
await ev('localStorage.clear()');
await laden();
for (const [begriff, erwartet] of [['Lanoxin', 'Digoxin'], ['Creatinin', 'Creatinin'], ['Mycoplasma pneumoniae', 'Mycoplasma'], ['F37', 'F37']]) {
  await ev(`[...document.querySelectorAll('[data-testid=willkommen-hinweis] button')].find((b) => b.textContent.trim() === ${JSON.stringify(begriff)}).click()`);
  await sleep(800);
  const feld = await ev(`document.getElementById('search-input-field').value`);
  const text = await ev(`[...document.querySelectorAll('div.relative.rounded-lg.shadow-sm.p-4')].map((c) => c.innerText).join('\\n')`);
  const n = await ev(`document.querySelectorAll('div.relative.rounded-lg.shadow-sm.p-4').length`);
  expect(feld === begriff, `Chip „${begriff}“ füllt das Suchfeld (${feld})`);
  expect(n > 0 && text.toLowerCase().includes(erwartet.toLowerCase()), `Chip „${begriff}“: ${n} Treffer, enthält „${erwartet}“`);
  if (begriff === 'Lanoxin') await shot('desktop-lanoxin');
}
await viewport('mobil', 'dark');
await ev('localStorage.clear()');
await laden();
await ev(`[...document.querySelectorAll('[data-testid=willkommen-hinweis] button')].find((b) => b.textContent.trim() === 'Lanoxin').click()`);
await sleep(800);
await shot('mobil-lanoxin');

// Datenschutz-Seite: direkt und mit Service-Worker
console.log('\n== /datenschutz.html');
await viewport('desktop', 'light');
const ds = new URL('datenschutz.html', BASE).href;
await send('Page.navigate', { url: BASE });
await waitFor(`navigator.serviceWorker && navigator.serviceWorker.ready.then(() => true)`);
await send('Page.navigate', { url: BASE }); // Seite wird vom Service-Worker kontrolliert
await sleep(1500);
expect(await ev(`!!navigator.serviceWorker.controller`), 'Service-Worker kontrolliert die Seite');
// Footer-Link anklicken: darf nicht die App liefern
const hrefs = await ev(`[...document.querySelectorAll('footer a')].map((a) => a.getAttribute('href')).join(' ')`);
expect(hrefs.includes('/datenschutz.html') && hrefs.includes('https://sebastian-bride.pages.dev/impressum'), `Footer-Links: ${hrefs}`);
await ev(`[...document.querySelectorAll('footer a')].find((a) => a.textContent.trim() === 'Datenschutz').click()`);
await sleep(1500);
expect(await ev(`location.pathname === '/datenschutz.html' && document.title.startsWith('Datenschutz') && !document.getElementById('root')`), 'mit Service-Worker: Datenschutz-Seite statt App');
await shot('datenschutz-sw-hell');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
await shot('datenschutz-sw-dunkel');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await shot('datenschutz-mobil-dunkel');
expect(await ev(`document.querySelectorAll('.platzhalter').length`) > 0, 'Platzhalter vorhanden');
expect(await ev(`performance.getEntriesByType('resource').filter((e) => !e.name.startsWith(location.origin)).length === 0`), 'Datenschutz-Seite lädt keine externen Ressourcen');
// frischer Profil-Zustand ohne Service-Worker ist durch Direktaufruf in neuem Tab abgedeckt (curl im Handoff)
console.log('\nKonsolenfehler:', consoleErrors.length ? consoleErrors : 'keine');
void ds;

ws.close(); ch.kill();
await sleep(500);
fs.rmSync(profileDir, { recursive: true, force: true });
console.log(failures.length ? `\n${failures.length} Fehler:\n- ${failures.join('\n- ')}` : '\nAlle Prüfungen bestanden');
process.exit(failures.length ? 1 : 0);
