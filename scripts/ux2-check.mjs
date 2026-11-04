#!/usr/bin/env node
// Prüfung „Mobil + Barrierefreiheit“ mit Chromium über CDP (Karte 8).
//
// Läuft gegen eine laufende App (Default http://localhost:8199/, Aufbau wie in scripts/offline-check.mjs):
//   - Mobil 390×844 (mobile:true) und Desktop 1440×1000, jeweils hell und dunkel
//   - Position der ersten Testkarte mit und ohne Willkommenshinweis, Anzahl Karten und DOM-Elemente
//   - Sortierung mobil hinter Knopf, Suche bleibt beim Scrollen oben, Seitennavigation
//   - Textkontrast aller sichtbaren Texte (WCAG AA) in beiden Farbschemata, auch in der Detailansicht
//   - Detailansicht „Digoxin“: Dialog, Materialname statt Code
//   - Tastatur: Tab zur Suche, Karte öffnen (Enter), Escape schließt, Fokus kehrt zurück, Checkbox per Leertaste
//   - Suche „Lanoxin“ findet Digoxin, Sortierung nach Name
// Screenshots: SCREENSHOT_DIR/ux2-*.png (Default docs/screenshots). Exit-Code 1 bei Fehlern.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.UX_URL || 'http://localhost:8199/';
const CHROMIUM = process.env.CHROMIUM || 'chromium';
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'docs', 'screenshots');
const DEBUG_PORT = 9335;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profileDir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'so-ux2-prof-'));
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
  const f = path.join(SHOT_DIR, `ux2-${name}.png`);
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

// ---------------------------------------------------------------------------------------------
// Prüfung „Mobil + Barrierefreiheit“ (Karte 8)
// ---------------------------------------------------------------------------------------------
const CARD = 'div.test-card';
const MAX_KARTE_PX = 360;
const MAX_DOM = 1500;

async function key(k, code, vk, text) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, ...(text ? { text } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  await sleep(60);
}
const tab = () => key('Tab', 'Tab', 9);

async function ladenKarten(url = BASE) {
  await send('Page.navigate', { url });
  await sleep(500);
  return waitFor(`document.querySelectorAll('${CARD}').length > 0`);
}
async function suche(begriff) {
  await ev(`(() => { const f = document.getElementById('search-input-field'); f.value = ${JSON.stringify(begriff)}; f.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await sleep(700);
}

// Kontrast aller sichtbaren Texte (einfarbige Hintergründe) nach WCAG 2.x
const KONTRAST_JS = `(() => {
  const parse = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const bgOf = (el) => { const chain = []; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') return null; const c = parse(cs.backgroundColor); if (c && c.a > 0) { chain.push(c); if (c.a === 1) break; } } let bg = { r: 255, g: 255, b: 255, a: 1 }; if (document.documentElement.classList.contains('dark')) bg = { r: 28, g: 27, b: 31, a: 1 }; for (const c of chain.reverse()) bg = over(c, bg); return bg; };
  const out = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; let geprueft = 0;
  while ((n = walker.nextNode())) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest('md-outlined-text-field, script, style')) continue;
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity < 1) continue;
    const fg = parse(cs.color); const bg = bgOf(el); if (!fg || !bg) continue;
    const f = over(fg, bg); const a = lum(f) + 0.05, b = lum(bg) + 0.05; const ratio = Math.max(a, b) / Math.min(a, b);
    const gross = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
    geprueft++;
    if (ratio < (gross ? 3 : 4.5)) { const k = el.tagName.toLowerCase() + '.' + (el.className.toString().split(' ').filter(Boolean).slice(0, 3).join('.')) + ' ' + cs.color + ' auf rgb(' + [bg.r, bg.g, bg.b].map(Math.round) + ')'; out.set(k, { ratio: Math.round(ratio * 100) / 100, text: n.textContent.trim().slice(0, 30), anzahl: (out.get(k)?.anzahl || 0) + 1 }); }
  }
  return JSON.stringify({ geprueft, zuSchwach: [...out].map(([k, v]) => k + ' -> ' + v.ratio + ' ("' + v.text + '", ' + v.anzahl + '×)') });
})()`;

console.log('Messung gegen', BASE);
const ergebnisse = [];
for (const kind of ['mobil', 'desktop']) {
  for (const scheme of ['light', 'dark']) {
    console.log(`\n== ${kind} / ${scheme}`);
    await viewport(kind, scheme);
    await send('Page.navigate', { url: BASE });
    await sleep(800);
    await ev('localStorage.clear()');
    expect(await ladenKarten(), `${kind}/${scheme}: Testliste geladen`);
    const mitHinweis = await ev(`Math.round(document.querySelector('${CARD}').getBoundingClientRect().top + window.scrollY)`);
    const hint = await ev(`!!document.querySelector('[data-testid=willkommen-hinweis]')`);
    expect(hint, `${kind}/${scheme}: Willkommenshinweis bei Erstbesuch sichtbar`);
    await ev(`document.querySelector('[aria-label="Hinweis schließen"]').click()`);
    await sleep(300);
    const ohne = await ev(`Math.round(document.querySelector('${CARD}').getBoundingClientRect().top + window.scrollY)`);
    const dom = await ev('document.getElementsByTagName("*").length');
    const karten = await ev(`document.querySelectorAll('${CARD}').length`);
    console.log(`     erste Testkarte: ${ohne} px (Hinweis geschlossen), ${mitHinweis} px (Hinweis offen); ${karten} Karten, ${dom} DOM-Elemente`);
    ergebnisse.push({ kind, scheme, ohne, mitHinweis, dom, karten });
    expect(karten === 50, `${kind}/${scheme}: 50 Karten pro Seite (${karten})`);
    expect(dom < MAX_DOM, `${kind}/${scheme}: DOM ${dom} < ${MAX_DOM}`);
    if (kind === 'mobil') expect(ohne <= MAX_KARTE_PX, `mobil/${scheme}: erste Karte ${ohne} px <= ${MAX_KARTE_PX} px`);
    await shot(`start-${kind}-${scheme}`);

    const sortSichtbar = await ev(`(() => { const p = document.getElementById('sortier-panel'); return p.getBoundingClientRect().height > 0; })()`);
    if (kind === 'mobil') {
      expect(!sortSichtbar, `${kind}/${scheme}: Sortierung zunächst eingeklappt`);
      await ev(`document.querySelector('[aria-controls=sortier-panel]').click()`);
      await sleep(300);
      expect(await ev(`document.getElementById('sortier-panel').getBoundingClientRect().height > 0`), `${kind}/${scheme}: Sortierung per Knopf aufklappbar`);
      await shot(`sortierung-${kind}-${scheme}`);
      await ev(`document.querySelector('[aria-controls=sortier-panel]').click()`);
    } else {
      expect(sortSichtbar, `${kind}/${scheme}: Sortierung auf Desktop sichtbar`);
      await shot(`sortierung-${kind}-${scheme}`);
    }

    // sticky Suche
    await ev('window.scrollTo(0, 1200)');
    await sleep(400);
    const stickyTop = await ev(`Math.round(document.getElementById('search-input-field').getBoundingClientRect().top)`);
    expect(stickyTop >= 0 && stickyTop < 80, `${kind}/${scheme}: Suche bleibt oben beim Scrollen (y=${stickyTop})`);
    await ev('window.scrollTo(0, 0)');

    // Seitennavigation
    const nav = await ev(`(() => { const n = [...document.querySelectorAll('nav[aria-label=Seitennavigation]')][0]; const k = n.querySelector('[data-testid=seiten-kompakt]'); return JSON.stringify({ kompakt: k && getComputedStyle(k).display !== 'none' ? k.innerText.replace(/\\s+/g, ' ') : null, voll: [...n.querySelectorAll('button')].filter((b) => b.offsetParent).map((b) => b.innerText.trim() || b.getAttribute('aria-label')).join('|') }); })()`);
    console.log('     Seitennavigation:', nav);
    const ersteId = await ev(`document.querySelector('${CARD} input').id`);
    await ev(`[...document.querySelectorAll('nav[aria-label=Seitennavigation] button[aria-label="Nächste Seite"]')].find((b) => b.offsetParent).click()`);
    await sleep(500);
    const zweiteId = await ev(`document.querySelector('${CARD} input').id`);
    expect(ersteId !== zweiteId, `${kind}/${scheme}: „Nächste Seite“ wechselt die Karten (${ersteId} → ${zweiteId})`);
    await ev('window.scrollTo(0, 0)');

    // Kontrast
    const k = JSON.parse(await ev(KONTRAST_JS));
    console.log(`     Kontrastprüfung: ${k.geprueft} Textstellen, ${k.zuSchwach.length} Gruppen unter AA`);
    k.zuSchwach.slice(0, 12).forEach((z) => console.log('        ', z));
    expect(k.zuSchwach.length === 0, `${kind}/${scheme}: alle Texte mit Kontrast >= 4,5:1`);

    // Detailansicht Digoxin
    await ladenKarten();
    await suche('Digoxin');
    await ev(`document.querySelector('${CARD} .test-open').click()`);
    await sleep(900);
    expect(await ev(`!!document.querySelector('[role=dialog][aria-modal=true]')`), `${kind}/${scheme}: Detailansicht ist ein Dialog`);
    const material = await ev(`(() => { const d = document.querySelector('[role=dialog]'); const z = [...d.querySelectorAll('p')].find((p) => p.textContent.trim().startsWith('Material')); return z ? z.parentElement.innerText.replace(/\\s+/g, ' ') : ''; })()`);
    console.log('     Material in Details:', material);
    expect(/Serum/.test(material) && !/^Material:\s*SE-00\s*$/.test(material), `${kind}/${scheme}: Details zeigen Materialname`);
    await shot(`detail-digoxin-${kind}-${scheme}`);
    const k2 = JSON.parse(await ev(KONTRAST_JS));
    console.log(`     Kontrast Detailansicht: ${k2.zuSchwach.length} Gruppen unter AA`);
    k2.zuSchwach.slice(0, 8).forEach((z) => console.log('        ', z));
    expect(k2.zuSchwach.length === 0, `${kind}/${scheme}: Detailansicht Kontrast >= 4,5:1`);
  }
}

// Tastaturbedienung (Desktop, hell)
console.log('\n== Tastatur');
await viewport('desktop', 'light');
await send('Page.navigate', { url: BASE });
await sleep(800);
await ev('localStorage.setItem("specimenOne.willkommenAusgeblendet","1")');
await ladenKarten();
await ev('document.activeElement && document.activeElement.blur()');
let schritte = 0, aufSuche = false;
for (; schritte < 15 && !aufSuche; schritte++) {
  await tab();
  aufSuche = await ev(`document.activeElement && document.activeElement.id === 'search-input-field'`);
}
expect(aufSuche, `Tab erreicht die Suche nach ${schritte} Tabs`);
let aufKarte = false, sprung = 0;
for (; sprung < 25 && !aufKarte; sprung++) {
  await tab();
  aufKarte = await ev(`document.activeElement && document.activeElement.classList.contains('test-open')`);
}
expect(aufKarte, `Tab erreicht den ersten Testnamen nach weiteren ${sprung} Tabs`);
await shot('fokus-karte-hell');
const ring = await ev(`(() => { const c = document.activeElement.closest('.test-card'); const s = getComputedStyle(c); return s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor; })()`);
expect(/solid 3px/.test(ring), `Fokusrahmen an der Karte sichtbar (${ring})`);
const opener = await ev(`document.activeElement.textContent`);
await key('Enter', 'Enter', 13, '\r');
await sleep(900);
expect(await ev(`!!document.querySelector('[role=dialog]')`), 'Enter öffnet die Detailansicht');
expect(await ev(`document.querySelector('[role=dialog]').contains(document.activeElement)`), 'Fokus liegt beim Öffnen im Dialog');
await key('Escape', 'Escape', 27);
await sleep(500);
expect(await ev(`!document.querySelector('[role=dialog]')`), 'Escape schließt die Detailansicht');
expect(await ev(`document.activeElement && document.activeElement.textContent === ${JSON.stringify(opener)}`), `Fokus kehrt zum Testnamen „${opener}“ zurück`);

// Auswahl behält den Fokus
await ev(`document.querySelector('${CARD} input').focus()`);
await key(' ', 'Space', 32, ' ');
await sleep(400);
expect(await ev(`/1 Test ausgewählt/.test(document.body.innerText)`), 'Leertaste hakt die Checkbox an („1 Test ausgewählt“)');
expect(await ev(`document.activeElement.tagName === 'INPUT' && document.activeElement.checked`), 'Fokus bleibt nach dem Anhaken auf der Checkbox');
expect(await ev(`document.activeElement.getAttribute('aria-label').endsWith('für Profil auswählen')`), 'Checkbox hat aria-label „… für Profil auswählen“');
await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Abbrechen')).click()`);

// Gegenprobe Lanoxin
console.log('\n== Suche');
await ladenKarten();
await suche('Lanoxin');
const treffer = await ev(`[...document.querySelectorAll('${CARD}')].map((c) => c.innerText).join('\\n')`);
expect(/Digoxin/i.test(treffer), 'Suche „Lanoxin“ zeigt Digoxin');
await suche('');
// Sortierung ändern
await ev(`document.querySelector('input[name=sortOption][value=name]').click()`);
await sleep(500);
const sortiert = await ev(`[...document.querySelectorAll('${CARD} h3')].slice(0, 3).map((h) => h.innerText.trim()).join(' | ')`);
console.log('     Sortiert nach Name:', sortiert);
expect(sortiert.length > 0, 'Sortierung nach Name funktioniert');
await ev(`localStorage.setItem('specimenOne.sortOption','id')`);

console.log('\nKonsolenfehler:', consoleErrors.length ? consoleErrors : 'keine');
console.log('\nZusammenfassung erste Testkarte / DOM:');
for (const e of ergebnisse) console.log(`  ${e.kind}/${e.scheme}: Karte bei ${e.ohne} px (mit Hinweis ${e.mitHinweis} px), ${e.dom} DOM-Elemente, ${e.karten} Karten`);
ws.close(); ch.kill();
await sleep(500);
fs.rmSync(profileDir, { recursive: true, force: true });
console.log(failures.length ? `\n${failures.length} Fehler:\n- ${failures.join('\n- ')}` : '\nAlle Prüfungen bestanden');
process.exit(failures.length ? 1 : 0);
