import { describe, it, expect } from 'vitest';
import { testNrFromId, groupReferenzwerte, groupVersandinfos, formatDatenstand } from './detailData';

describe('testNrFromId', () => {
  it('liefert den numerischen Teil der Test-ID', () => {
    expect(testNrFromId('T0049')).toBe(49);
    expect(testNrFromId('T0567')).toBe(567);
  });

  it('liefert null für IDs ohne T-Nummer', () => {
    expect(testNrFromId('ABC')).toBeNull();
    expect(testNrFromId(undefined)).toBeNull();
  });
});

describe('groupReferenzwerte', () => {
  it('gruppiert nach test_id und behält die Reihenfolge', () => {
    const rows = [
      { id: 1, test_id: 'T0008' },
      { id: 2, test_id: 'T0009' },
      { id: 3, test_id: 'T0008' },
      { id: 4 },
    ];
    const g = groupReferenzwerte(rows);
    expect(g.T0008.map((r) => r.id)).toEqual([1, 3]);
    expect(g.T0009).toHaveLength(1);
    expect(Object.keys(g)).toEqual(['T0008', 'T0009']);
  });

  it('kommt mit fehlenden Daten zurecht', () => {
    expect(groupReferenzwerte(undefined)).toEqual({});
  });
});

describe('groupVersandinfos', () => {
  it('gruppiert nach test_nr und entfernt den Schlüssel aus den Einträgen', () => {
    const g = groupVersandinfos([
      { test_nr: 567, stations_bezlang: 'Labor A', versandart_anz: null },
      { test_nr: 567, stations_bezlang: 'Labor B', versandart_anz: 'Kurier' },
      { test_nr: '49', stations_bezlang: 'Labor C', versandart_anz: 'Post' },
      { test_nr: null, stations_bezlang: 'ohne Test' },
    ]);
    expect(g[567]).toEqual([
      { stations_bezlang: 'Labor A', versandart_anz: null },
      { stations_bezlang: 'Labor B', versandart_anz: 'Kurier' },
    ]);
    expect(g[49]).toEqual([{ stations_bezlang: 'Labor C', versandart_anz: 'Post' }]);
    expect(Object.keys(g)).toHaveLength(2);
  });
});

describe('formatDatenstand', () => {
  it('formatiert deutsch mit Datum und Uhrzeit', () => {
    const ms = new Date(2026, 10, 3, 18, 5).getTime();
    expect(formatDatenstand(ms)).toBe('03.11.2026, 18:05');
  });

  it('liefert null ohne Zeitstempel', () => {
    expect(formatDatenstand(NaN)).toBeNull();
  });
});
