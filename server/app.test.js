// Tests ohne echte Datenbank: der pg-Pool wird durch einen Mock ersetzt.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('./app');
const { loadDbConfig } = require('./config');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

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

  test('liefert 500 mit allgemeiner Meldung bei DB-Fehler', async (t) => {
    const logged = t.mock.method(console, 'error', () => {});
    const pool = mockPool(() => { throw new Error('db down'); });
    const res = await request(createApp(pool)).get('/api/health');
    assert.equal(res.status, 500);
    assert.equal(res.body.error, 'Interner Serverfehler');
    assert.ok(!JSON.stringify(res.body).includes('db down'));
    assert.equal(logged.mock.callCount(), 1, 'Fehler wird serverseitig geloggt');
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

describe('GET /api/referenzwerte', () => {
  test('liefert alle Referenzwerte unter { referenzwerte }', async () => {
    const rows = [{ id: 1, test_id: 'T0008', anzeige_label: '< 30' }, { id: 2, test_id: 'T0009' }];
    const pool = mockPool(() => ({ rows }));
    const res = await request(createApp(pool)).get('/api/referenzwerte');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { referenzwerte: rows });
    assert.equal(pool.calls.length, 1);
    assert.match(pool.calls[0].sql, /FROM referenzwerte/);
    assert.ok(!pool.calls[0].sql.includes('WHERE'), 'keine Einschränkung: alle Zeilen');
    assert.deepEqual(pool.calls[0].params, []);
  });
});

describe('GET /api/versandinfos', () => {
  test('liefert alle Versandinfos mit test_nr unter { versandinfos }', async () => {
    const rows = [
      { test_nr: 49, stations_bezlang: 'Labor X', versandart_anz: 'Post' },
      { test_nr: 567, stations_bezlang: 'Labor Y', versandart_anz: null },
    ];
    const pool = mockPool(() => ({ rows }));
    const res = await request(createApp(pool)).get('/api/versandinfos');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { versandinfos: rows });
  });

  test('gleiche Join-Logik wie /api/tests/:id, aber ohne Filter auf einen Test', async () => {
    const pool = mockPool(() => ({ rows: [] }));
    await request(createApp(pool)).get('/api/versandinfos');
    const { sql, params } = pool.calls[0];
    for (const part of ['FROM test_versand tv', 'LEFT JOIN empfaenger e ON tv.einsender_id = e.einsender_id', 'LEFT JOIN versandart v']) {
      assert.ok(sql.includes(part), `fehlt: ${part}`);
    }
    assert.ok(!sql.includes('$1'), 'keine Parameter');
    assert.deepEqual(params, []);
  });

  test('gibt nur test_nr, stations_bezlang und versandart_anz heraus (keine weiteren empfaenger-Spalten)', async () => {
    const pool = mockPool(() => ({ rows: [] }));
    await request(createApp(pool)).get('/api/versandinfos');
    const sql = pool.calls[0].sql;
    const select = sql.slice(sql.indexOf('SELECT') + 6, sql.indexOf('FROM')).split(',').map((s) => s.trim());
    assert.deepEqual(select, ['tv.test_nr', 'e.stations_bezlang', 'v.versandart_anz']);
    assert.ok(!/e\.\*|SELECT \*/.test(sql));
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

describe('GET /api/tests: Validierung von page/limit', () => {
  const handler = (sql) =>
    sql.startsWith('SELECT COUNT') ? { rows: [{ count: '1497' }] } : { rows: [] };

  test('limit=2000 (Frontend) ist erlaubt', async () => {
    const pool = mockPool(handler);
    const res = await request(createApp(pool)).get('/api/tests?limit=2000');
    assert.equal(res.status, 200);
    assert.equal(res.body.pagination.limit, 2000);
  });

  for (const qs of [
    'limit=2001', 'limit=999999999', 'limit=0', 'limit=-5', 'limit=abc', 'limit=10abc', 'limit=1.5',
    'limit=1&limit=2', 'page=0', 'page=-1', 'page=x', 'page=2.5', 'page=99999999999999999999',
  ]) {
    test(`?${qs} → 400 ohne DB-Abfrage`, async () => {
      const pool = mockPool(handler);
      const res = await request(createApp(pool)).get(`/api/tests?${qs}`);
      assert.equal(res.status, 400);
      assert.match(res.body.error, /page|limit/);
      assert.equal(pool.calls.length, 0);
    });
  }

  test('zu langer Suchbegriff → 400', async () => {
    const pool = mockPool(handler);
    const res = await request(createApp(pool)).get('/api/tests').query({ search: 'a'.repeat(201) });
    assert.equal(res.status, 400);
    assert.equal(pool.calls.length, 0);
  });
});

describe('Fehlerbehandlung', () => {
  const sqlError = () => {
    const err = new Error('relation "tests" does not exist');
    err.code = '42P01';
    throw err;
  };

  for (const route of ['/api/tests', '/api/tests/T0001', '/api/material', '/api/einheiten', '/api/profile', '/api/farben', '/api/referenzwerte', '/api/versandinfos']) {
    test(`${route}: DB-Fehler → 500 ohne SQL-Details, Log per console.error`, async (t) => {
      const logged = t.mock.method(console, 'error', () => {});
      const res = await request(createApp(mockPool(sqlError))).get(route);
      assert.equal(res.status, 500);
      assert.deepEqual(res.body, { error: 'Interner Serverfehler' });
      assert.ok(!res.text.includes('relation'));
      assert.equal(logged.mock.callCount(), 1);
      assert.ok(String(logged.mock.calls[0].arguments[1].message).includes('relation'));
    });
  }

  test('unbekannter API-Pfad → JSON-404', async () => {
    const res = await request(createApp(mockPool(() => ({ rows: [] })))).get('/api/gibtsnicht');
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'Nicht gefunden' });
  });
});

describe('Header', () => {
  test('helmet aktiv, kein X-Powered-By, kein CORS', async () => {
    const res = await request(createApp(mockPool(() => ({ rows: [] }))))
      .get('/api/material')
      .set('Origin', 'https://evil.example');
    assert.equal(res.headers['x-powered-by'], undefined);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['content-security-policy']);
    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });
});

describe('Konfiguration (config.js)', () => {
  test('ohne PGPASSWORD wird abgebrochen', () => {
    assert.throws(() => loadDbConfig({}), /PGPASSWORD ist nicht gesetzt/);
    assert.throws(() => loadDbConfig({ PGPASSWORD: '' }), /PGPASSWORD/);
  });

  test('mit PGPASSWORD: Passwort aus der Env, sonst Defaults', () => {
    const cfg = loadDbConfig({ PGPASSWORD: 'geheim' });
    assert.deepEqual(cfg, { host: 'styx', port: 5433, user: 'specimen', password: 'geheim', database: 'specimenone' });
  });

  test('Env-Werte überschreiben die Defaults', () => {
    const cfg = loadDbConfig({ PGPASSWORD: 'x', PGHOST: 'postgres', PGPORT: '5432', PGUSER: 'u', PGDATABASE: 'd' });
    assert.deepEqual(cfg, { host: 'postgres', port: 5432, user: 'u', password: 'x', database: 'd' });
  });

  test('index.js ohne PGPASSWORD: Exit-Code 1 und verständliche Meldung', () => {
    const env = { ...process.env };
    delete env.PGPASSWORD;
    const r = spawnSync(process.execPath, [path.join(__dirname, 'index.js')], { env, encoding: 'utf8', timeout: 10000 });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Startabbruch: PGPASSWORD ist nicht gesetzt/);
  });
});
