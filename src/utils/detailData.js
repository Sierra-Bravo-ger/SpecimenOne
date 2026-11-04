// Hilfsfunktionen für die beim Start geladenen Detaildaten (Referenzwerte, Versandinfos).
// Die API liefert beide Tabellen vollständig (/api/referenzwerte, /api/versandinfos);
// hier werden sie einmal nach Test gruppiert, damit TestDetails ohne Netz auskommt.

/** Numerischer Teil einer Test-ID: "T0049" → 49, sonst null (gleiche Regel wie die API). */
export function testNrFromId(id) {
  const m = typeof id === 'string' ? id.match(/T(\d+)/) : null;
  return m ? parseInt(m[1], 10) : null;
}

/** Referenzwerte nach test_id gruppieren: { T0008: [...], … } */
export function groupReferenzwerte(rows) {
  const byTest = {};
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || !row.test_id) continue;
    (byTest[row.test_id] ||= []).push(row);
  }
  return byTest;
}

/** Versandinfos nach test_nr gruppieren: { 567: [{ stations_bezlang, versandart_anz }], … } */
export function groupVersandinfos(rows) {
  const byNr = {};
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || row.test_nr === null || row.test_nr === undefined) continue;
    const { test_nr, ...info } = row;
    (byNr[Number(test_nr)] ||= []).push(info);
  }
  return byNr;
}

/** Formatiert einen Zeitstempel (ms) wie „03.11.2026, 18:05“. */
export function formatDatenstand(ms) {
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
