// Tests ohne echte Datenbank: der pg-Pool wird durch einen Mock ersetzt.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('./app');

function mockPool(handler) {
  const calls = [];
  return {
    calls,
    query: async (sql, params = []) => {
      calls.push({ sql, params });
      return handler(sql, params);
    },
  };
}

describe('GET /api/health', () => {
  test('liefert ok mit DB-Zeit', async () => {
    const pool = mockPool(() => ({ rows: [{ now: '2026-01-01T00:00:00Z' }] }));
    const res = await request(createApp(pool)).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  test('liefert 500 bei DB-Fehler', async () => {
    const pool = mockPool(() => { throw new Error('db down'); });
    const res = await request(createApp(pool)).get('/api/health');
    assert.equal(res.status, 500);
    assert.equal(res.body.error, 'db down');
  });
});

describe('GET /api/tests', () => {
  const handler = (sql) =>
    sql.startsWith('SELECT COUNT') ? { rows: [{ count: '45' }] } : { rows: [{ id: 'T0001' }] };

  test('Standard-Paginierung: Seite 1, 20 Einträge, ohne WHERE', async () => {
    const pool = mockPool(handler);
    const res = await request(createApp(pool)).get('/api/tests');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.pagination, { page: 1, limit: 20, totalCount: 45, totalPages: 3 });
    const main = pool.calls.find((c) => c.sql.startsWith('SELECT *'));
    assert.ok(!main.sql.includes('WHERE'));
    assert.deepEqual(main.params, [20, 0]);
  });

  test('Paginierung: page und limit bestimmen LIMIT/OFFSET', async () => {
    const pool = mockPool(handler);
    const res = await request(createApp(pool)).get('/api/tests?page=3&limit=10');
    assert.deepEqual(res.body.pagination, { page: 3, limit: 10, totalCount: 45, totalPages: 5 });
    const main = pool.calls.find((c) => c.sql.startsWith('SELECT *'));
    assert.deepEqual(main.params, [10, 20]);
  });

  test('Suche: Suchbegriff geht nur als Parameter in die Abfrage (kein SQL-Injection-Pfad)', async () => {
    const pool = mockPool(handler);
    const evil = "x'; DROP TABLE tests;--";
    const res = await request(createApp(pool)).get('/api/tests').query({ search: evil });
    assert.equal(res.status, 200);
    for (const c of pool.calls) {
      assert.ok(!c.sql.includes('DROP TABLE'), 'Suchtext darf nicht im SQL stehen');
    }
    const main = pool.calls.find((c) => c.sql.startsWith('SELECT *'));
    const count = pool.calls.find((c) => c.sql.startsWith('SELECT COUNT'));
    assert.deepEqual(main.params, [`%${evil}%`, 20, 0]);
    assert.deepEqual(count.params, [`%${evil}%`]);
  });

  test('Suche: durchsucht Name, ID, LOINC, Kategorie und Synonyme (ILIKE)', async () => {
    const pool = mockPool(handler);
    await request(createApp(pool)).get('/api/tests?search=lanox');
    const main = pool.calls.find((c) => c.sql.startsWith('SELECT *'));
    for (const part of ['name ILIKE $1', 'id ILIKE $1', 'loinc ILIKE $1', 'kategorie ILIKE $1', 'unnest(synonyme)']) {
      assert.ok(main.sql.includes(part), `fehlt: ${part}`);
    }
    assert.ok(main.sql.includes('LIMIT $2 OFFSET $3'));
  });

  test('Suche und Zählabfrage nutzen dieselbe WHERE-Bedingung', async () => {
    const pool = mockPool(handler);
    await request(createApp(pool)).get('/api/tests?search=na');
    const where = (s) => s.slice(s.indexOf('WHERE'), s.indexOf(' ORDER BY') > 0 ? s.indexOf(' ORDER BY') : undefined);
    const main = pool.calls.find((c) => c.sql.startsWith('SELECT *'));
    const count = pool.calls.find((c) => c.sql.startsWith('SELECT COUNT'));
    assert.equal(where(main.sql), where(count.sql));
  });
});

describe('GET /api/tests/:id', () => {
  test('liefert 404 bei unbekannter ID', async () => {
    const pool = mockPool(() => ({ rows: [] }));
    const res = await request(createApp(pool)).get('/api/tests/T9999');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Test nicht gefunden');
    assert.deepEqual(pool.calls[0].params, ['T9999']);
  });

  test('liefert Test mit Referenzwerten und Versandinfos', async () => {
    const pool = mockPool((sql) => {
      if (sql.includes('FROM tests')) return { rows: [{ id: 'T0049', name: 'Natrium' }] };
      if (sql.includes('FROM referenzwerte')) return { rows: [{ test_id: 'T0049' }] };
      return { rows: [{ stations_bezlang: 'Labor X', versandart_anz: 'Post' }] };
    });
    const res = await request(createApp(pool)).get('/api/tests/T0049');
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Natrium');
    assert.equal(res.body.referenzwerte.length, 1);
    assert.equal(res.body.versandinfos.length, 1);
    // numerischer Teil der ID wird als Parameter übergeben
    assert.deepEqual(pool.calls[2].params, [49]);
  });
});

describe('Listen-Routen', () => {
  for (const [path, key] of [
    ['/api/material', 'materialien'],
    ['/api/einheiten', 'einheiten'],
    ['/api/profile', 'profile'],
    ['/api/farben', 'farben'],
  ]) {
    test(`${path} liefert { ${key}: [...] }`, async () => {
      const pool = mockPool(() => ({ rows: [{ a: 1 }, { a: 2 }] }));
      const res = await request(createApp(pool)).get(path);
      assert.equal(res.status, 200);
      assert.equal(res.body[key].length, 2);
    });
  }
});
