/**
 * Seitenaufteilung der Testliste.
 *
 * Gewählter Weg gegen die große DOM (1497 Karten ≈ 3400 Elemente): feste Seiten mit 50 Karten
 * statt Virtualisierung. Eine Seite sind rund 1100 DOM-Elemente, die Browser-Suche (Strg+F),
 * Tastatur-/Screenreader-Navigation und das responsive Raster bleiben unverändert und es
 * kommt keine neue Abhängigkeit dazu.
 */
export const ITEMS_PER_PAGE = 50;

/** Ab dieser Anzahl Tests wird aufgeteilt (alles darunter passt auf eine Seite). */
export const PAGINATION_THRESHOLD = ITEMS_PER_PAGE;

export function istPaginiert(anzahl) {
  return anzahl > PAGINATION_THRESHOLD;
}

export function gesamtSeiten(anzahl) {
  return istPaginiert(anzahl) ? Math.ceil(anzahl / ITEMS_PER_PAGE) : 1;
}

/** Karten der (1-basierten) Seite; ungültige Seiten werden in den gültigen Bereich geklemmt. */
export function seitenAusschnitt(liste, seite) {
  if (!istPaginiert(liste.length)) return liste;
  const aktuell = Math.min(Math.max(1, seite), gesamtSeiten(liste.length));
  const start = (aktuell - 1) * ITEMS_PER_PAGE;
  return liste.slice(start, start + ITEMS_PER_PAGE);
}

/** Bereich „von – bis“ der angezeigten Karten (1-basiert) für die Anzeige „Zeige 1–50 von 1497“. */
export function seitenBereich(anzahl, seite) {
  if (anzahl === 0) return { von: 0, bis: 0 };
  if (!istPaginiert(anzahl)) return { von: 1, bis: anzahl };
  const von = (seite - 1) * ITEMS_PER_PAGE + 1;
  return { von, bis: Math.min(seite * ITEMS_PER_PAGE, anzahl) };
}

/** Seitenzahlen für die Desktop-Navigation (max. `max` Stück, um die aktuelle Seite zentriert). */
export function sichtbareSeiten(aktuell, gesamt, max = 7) {
  let start = Math.max(1, Math.min(aktuell - Math.floor(max / 2), gesamt - max + 1));
  const ende = Math.min(start + max - 1, gesamt);
  start = Math.max(1, ende - max + 1);
  const seiten = [];
  for (let i = start; i <= ende; i++) seiten.push(i);
  return seiten;
}
