import { describe, it, expect } from 'vitest';
import {
  ITEMS_PER_PAGE,
  PAGINATION_THRESHOLD,
  gesamtSeiten,
  istPaginiert,
  seitenAusschnitt,
  seitenBereich,
  sichtbareSeiten,
} from './seitenaufteilung';

const liste = (n) => Array.from({ length: n }, (_, i) => ({ id: `T${i + 1}` }));

describe('Seitenaufteilung', () => {
  it('zeigt 50 Karten pro Seite (DOM unter 1500 Elementen)', () => {
    expect(ITEMS_PER_PAGE).toBe(50);
    expect(PAGINATION_THRESHOLD).toBe(50);
  });

  it('paginiert erst oberhalb der Seitengröße', () => {
    expect(istPaginiert(50)).toBe(false);
    expect(istPaginiert(51)).toBe(true);
    expect(gesamtSeiten(0)).toBe(1);
    expect(gesamtSeiten(50)).toBe(1);
    expect(gesamtSeiten(51)).toBe(2);
    expect(gesamtSeiten(1497)).toBe(30);
  });

  it('schneidet die Seiten korrekt aus (1497 Tests → 29 × 50 + 47)', () => {
    const alle = liste(1497);
    expect(seitenAusschnitt(alle, 1)).toHaveLength(50);
    expect(seitenAusschnitt(alle, 1)[0].id).toBe('T1');
    expect(seitenAusschnitt(alle, 2)[0].id).toBe('T51');
    expect(seitenAusschnitt(alle, 30)).toHaveLength(47);
    expect(seitenAusschnitt(alle, 30).at(-1).id).toBe('T1497');
  });

  it('klemmt ungültige Seiten und lässt kurze Listen unverändert', () => {
    const alle = liste(120);
    expect(seitenAusschnitt(alle, 0)[0].id).toBe('T1');
    expect(seitenAusschnitt(alle, 99)[0].id).toBe('T101');
    const kurz = liste(10);
    expect(seitenAusschnitt(kurz, 1)).toBe(kurz);
  });

  it('berechnet den angezeigten Bereich', () => {
    expect(seitenBereich(0, 1)).toEqual({ von: 0, bis: 0 });
    expect(seitenBereich(10, 1)).toEqual({ von: 1, bis: 10 });
    expect(seitenBereich(1497, 1)).toEqual({ von: 1, bis: 50 });
    expect(seitenBereich(1497, 30)).toEqual({ von: 1451, bis: 1497 });
  });

  it('wählt höchstens 7 Seitenzahlen um die aktuelle Seite', () => {
    expect(sichtbareSeiten(1, 30)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(sichtbareSeiten(15, 30)).toEqual([12, 13, 14, 15, 16, 17, 18]);
    expect(sichtbareSeiten(30, 30)).toEqual([24, 25, 26, 27, 28, 29, 30]);
    expect(sichtbareSeiten(1, 3)).toEqual([1, 2, 3]);
  });
});
