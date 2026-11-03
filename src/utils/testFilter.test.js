import { describe, it, expect } from 'vitest';
import { filterTests, sortTests } from './testFilter';

const tests = [
  { id: 'T0003', name: 'Digoxin', synonyme: ['Lanoxin'], loinc: '10535-3', kategorie: 'Toxikologie', material: ['Serum'] },
  { id: 'T0001', name: 'Natrium', synonyme: ['Na'], loinc: '2951-2', kategorie: 'Klinische Chemie', material: ['Serum', 'Heparinplasma'] },
  { id: 'T0002', name: 'Hämoglobin', synonyme: [], loinc: '718-7', kategorie: 'Hämatologie', material: ['EDTA-Blut'] },
  { id: 'T0004', name: 'Kalium', loinc: '2823-3', kategorie: 'Klinische Chemie' },
];

const ids = (list) => list.map((t) => t.id);

describe('filterTests', () => {
  it('liefert ohne Suchbegriff und Kategorie alle Tests', () => {
    expect(filterTests(tests)).toHaveLength(4);
  });

  it('findet nach Name, ohne Groß-/Kleinschreibung und als Teilstring', () => {
    expect(ids(filterTests(tests, { suchbegriff: 'NATR' }))).toEqual(['T0001']);
  });

  it('findet über Synonym', () => {
    expect(ids(filterTests(tests, { suchbegriff: 'lanox' }))).toEqual(['T0003']);
  });

  it('findet über LOINC', () => {
    expect(ids(filterTests(tests, { suchbegriff: '718-7' }))).toEqual(['T0002']);
  });

  it('findet über Test-ID', () => {
    expect(ids(filterTests(tests, { suchbegriff: 't0004' }))).toEqual(['T0004']);
  });

  it('findet über Material', () => {
    expect(ids(filterTests(tests, { suchbegriff: 'edta' }))).toEqual(['T0002']);
  });

  it('filtert nach Kategorie', () => {
    expect(ids(filterTests(tests, { kategorie: 'Klinische Chemie' }))).toEqual(['T0001', 'T0004']);
  });

  it('kombiniert Kategorie und Suche', () => {
    expect(ids(filterTests(tests, { kategorie: 'Klinische Chemie', suchbegriff: 'kal' }))).toEqual(['T0004']);
    expect(filterTests(tests, { kategorie: 'Toxikologie', suchbegriff: 'kal' })).toEqual([]);
  });

  it('kommt mit fehlenden Feldern und leerer Eingabe zurecht', () => {
    expect(filterTests(null)).toEqual([]);
    expect(filterTests(tests, { suchbegriff: 'xyz' })).toEqual([]);
  });
});

describe('sortTests', () => {
  it('sortiert standardmäßig aufsteigend nach ID', () => {
    expect(ids(sortTests(tests))).toEqual(['T0001', 'T0002', 'T0003', 'T0004']);
  });

  it('sortiert absteigend', () => {
    expect(ids(sortTests(tests, 'id', 'desc'))).toEqual(['T0004', 'T0003', 'T0002', 'T0001']);
  });

  it('sortiert nach Name', () => {
    expect(ids(sortTests(tests, 'name', 'asc'))).toEqual(['T0003', 'T0002', 'T0004', 'T0001']);
  });

  it('sortiert nach Kategorie, innerhalb davon nach Name', () => {
    expect(ids(sortTests(tests, 'kategorie', 'asc'))).toEqual(['T0002', 'T0004', 'T0001', 'T0003']);
  });

  it('sortiert nach erstem Material; Tests ohne Material zuerst', () => {
    expect(ids(sortTests(tests, 'material', 'asc'))).toEqual(['T0004', 'T0002', 'T0003', 'T0001']);
  });

  it('verändert die Eingabeliste nicht', () => {
    const copy = [...tests];
    sortTests(tests, 'name', 'desc');
    expect(tests).toEqual(copy);
  });
});
