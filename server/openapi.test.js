// Vertragstest: openapi.yaml muss gültig sein, zu den Antworten der API passen
// und jede Route aus app.js enthalten (und umgekehrt). Datenbank gemockt.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');
const SwaggerParser = require('@apidevtools/swagger-parser');
const YAML = require('yaml');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const { createApp, MAX_LIMIT, MAX_PAGE, MAX_SEARCH_LENGTH, DEFAULT_LIMIT } = require('./app');
const pkg = require('./package.json');

const SPEC_PATH = path.join(__dirname, 'openapi.yaml');

function mockPool(handler) {
  return { query: async (sql, params = []) => handler(sql, params) };
}

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);

/**
 * Löst lokale $refs ("#/components/…") rekursiv auf. Synchron, damit die Tests unten
 * beim Registrieren schon aus der Spezifikation erzeugt werden können.
 * (Die Spezifikation selbst validiert SwaggerParser im ersten Test.)
 */
function derefSync(root) {
  const resolve = (node) => {
    if (Array.isArray(node)) return node.map(resolve);
    if (node === null || typeof node !== 'object') return node;
    if (typeof node.$ref === 'string') {
      const target = node.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o[k], root);
      return resolve(target);
    }
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, resolve(v)]));
  };
  return resolve(root);
}

/** Prüft einen Wert gegen ein (dereferenziertes) Schema und liefert lesbare Fehler. */
function assertMatches(schema, value, what) {
  const validate = ajv.compile(schema);
  const ok = validate(value);
  assert.ok(ok, `${what} passt nicht zum Schema:\n${JSON.stringify(validate.errors, null, 2)}`);
}

// Mock-Datenbank, die für jede Route die Zeilen aus dem Beispiel der Spezifikation liefert.
// Liefert { url, pool } für ein Beispiel (JSON-Antwort) der Route.
function setupFor(route, example) {
  switch (route) {
    case '/api/health':
      return { url: '/api/health', pool: mockPool(() => ({ rows: [{ now: example.time }] })) };
    case '/api/tests': {
      const { page, limit, totalCount } = example.pagination;
      return {
        url: `/api/tests?page=${page}&limit=${limit}`,
        pool: mockPool((sql) => (
          /COUNT/.test(sql) ? { rows: [{ count: String(totalCount) }] } : { rows: example.tests }
        )),
      };
    }
    case '/api/tests/{id}': {
      const { referenzwerte, versandinfos, ...test } = example;
      return {
        url: `/api/tests/${test.id}`,
        pool: mockPool((sql) => {
          if (/FROM tests/.test(sql)) return { rows: [test] };
          if (/FROM referenzwerte/.test(sql)) return { rows: referenzwerte };
          return { rows: versandinfos };
        }),
      };
    }
    case '/api/referenzwerte':
    case '/api/versandinfos':
    case '/api/material':
    case '/api/einheiten':
    case '/api/profile':
    case '/api/farben': {
      const key = Object.keys(example)[0];
      return { url: route, pool: mockPool(() => ({ rows: example[key] })) };
    }
    default:
      throw new Error(`Für die Route ${route} fehlt ein Mock im Vertragstest – bitte in setupFor() ergänzen.`);
  }
}

/** Routen (GET) der Express-App im OpenAPI-Pfadformat, ohne Fallbacks per app.use(). */
function appRoutes() {
  const app = createApp(mockPool(() => ({ rows: [] })));
  const routes = [];
  for (const layer of app._router.stack) {
    if (!layer.route) continue;
    for (const method of Object.keys(layer.route.methods)) {
      routes.push(`${method.toUpperCase()} ${layer.route.path.replace(/:(\w+)/g, '{$1}')}`);
    }
  }
  return routes.sort();
}

describe('OpenAPI-Spezifikation', () => {
  test('ist ein gültiges OpenAPI-3.1-Dokument', async () => {
    const api = await SwaggerParser.validate(SPEC_PATH);
    assert.match(api.openapi, /^3\.1\./);
  });

  test('Version entspricht server/package.json', async () => {
    const api = await SwaggerParser.parse(SPEC_PATH);
    assert.equal(api.info.version, pkg.version);
  });

  test('jede Route aus app.js steht in der Spezifikation und umgekehrt', async () => {
    const api = await SwaggerParser.parse(SPEC_PATH);
    const specRoutes = Object.entries(api.paths)
      .flatMap(([p, item]) => Object.keys(item)
        .filter((m) => ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(m))
        .map((m) => `${m.toUpperCase()} ${p}`))
      .sort();
    assert.deepEqual(appRoutes(), specRoutes,
      'Routen in app.js und server/openapi.yaml weichen ab – neue Routen bitte in openapi.yaml nachtragen');
  });

  test('Parametergrenzen entsprechen den Konstanten in app.js', async () => {
    const api = await SwaggerParser.dereference(SPEC_PATH);
    const params = Object.fromEntries(api.paths['/api/tests'].get.parameters.map((p) => [p.name, p.schema]));
    assert.equal(params.limit.maximum, MAX_LIMIT);
    assert.equal(params.limit.default, DEFAULT_LIMIT);
    assert.equal(params.page.maximum, MAX_PAGE);
    assert.equal(params.search.maxLength, MAX_SEARCH_LENGTH);
  });

  test('jede Operation hat Tag, operationId und eine 200-Antwort mit Beispiel', async () => {
    const api = await SwaggerParser.dereference(SPEC_PATH);
    const ids = new Set();
    for (const [p, item] of Object.entries(api.paths)) {
      const op = item.get;
      assert.ok(op.tags?.length, `${p}: Tag fehlt`);
      assert.ok(op.operationId && !ids.has(op.operationId), `${p}: operationId fehlt oder doppelt`);
      ids.add(op.operationId);
      const content = op.responses['200']?.content?.['application/json'];
      assert.ok(content?.schema, `${p}: Schema der 200-Antwort fehlt`);
      if (p !== '/api/openapi.json') assert.ok(content.examples, `${p}: Beispiel fehlt`);
    }
  });
});

describe('Antworten der API passen zur Spezifikation', () => {
  const api = derefSync(YAML.parse(fs.readFileSync(SPEC_PATH, 'utf8')));

  for (const [route, item] of Object.entries(api.paths)) {
    if (route === '/api/openapi.json') continue;
    const op = item.get;

    // Jedes Beispiel der 200-Antwort: Mock liefert die Beispieldaten, Antwort muss Schema erfüllen
    // und dem Beispiel entsprechen (so bleiben auch die Beispiele ehrlich).
    for (const [name, ex] of Object.entries(op.responses['200'].content['application/json'].examples)) {
      test(`GET ${route} – 200, Beispiel „${name}“`, async () => {
        const { url, pool } = setupFor(route, ex.value);
        const res = await request(createApp(pool)).get(url);
        assert.equal(res.status, 200);
        assertMatches(op.responses['200'].content['application/json'].schema, res.body, `Antwort ${url}`);
        assert.deepEqual(res.body, JSON.parse(JSON.stringify(ex.value)));
      });
    }

    test(`GET ${route} – 500 bei Datenbankfehler entspricht Error-Schema`, async (t) => {
      t.mock.method(console, 'error', () => {});
      const { url } = setupFor(route, Object.values(op.responses['200'].content['application/json'].examples)[0].value);
      const res = await request(createApp(mockPool(() => { throw new Error('db down'); }))).get(url);
      assert.equal(res.status, 500);
      assertMatches(op.responses['500'].content['application/json'].schema, res.body, '500-Antwort');
    });
  }

  test('GET /api/tests – 400 bei ungültigen Parametern entspricht Error-Schema', async () => {
    const op = api.paths['/api/tests'].get;
    const schema = op.responses['400'].content['application/json'].schema;
    for (const q of ['limit=2001', 'limit=0', 'page=abc', `search=${'x'.repeat(MAX_SEARCH_LENGTH + 1)}`]) {
      const res = await request(createApp(mockPool(() => ({ rows: [] })))).get(`/api/tests?${q}`);
      assert.equal(res.status, 400, q);
      assertMatches(schema, res.body, `400-Antwort für ${q.slice(0, 20)}`);
    }
  });

  test('GET /api/tests/{id} – 404 bei unbekannter ID entspricht Error-Schema', async () => {
    const op = api.paths['/api/tests/{id}'].get;
    const res = await request(createApp(mockPool(() => ({ rows: [] })))).get('/api/tests/T9999999');
    assert.equal(res.status, 404);
    assertMatches(op.responses['404'].content['application/json'].schema, res.body, '404-Antwort');
  });

  test('nullable Felder werden akzeptiert, unbekannte Felder abgelehnt', () => {
    const schema = api.components.schemas.Material;
    const row = { material_id: 'X', material_bezeichnung: null, material_kurz: null, material_farbe: null,
      farben_id: null, material_erweiterung: null, lagerung: null, probenroehre: null,
      praekanalytik: null, db_material_id: null };
    assertMatches(schema, row, 'Material mit null-Werten');
    assert.equal(ajv.compile(schema)({ ...row, neue_spalte: 1 }), false, 'neue DB-Spalte muss auffallen');
  });
});

describe('Auslieferung', () => {
  test('GET /api/openapi.json liefert die Spezifikation', async () => {
    const res = await request(createApp(mockPool(() => ({ rows: [] })))).get('/api/openapi.json');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /application\/json/);
    const parsed = await SwaggerParser.parse(SPEC_PATH);
    assert.deepEqual(res.body, JSON.parse(JSON.stringify(parsed)));
  });

  test('GET /api/docs liefert die Swagger UI ohne externe Quellen', async () => {
    const app = createApp(mockPool(() => ({ rows: [] })));
    const res = await request(app).get('/api/docs/');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/html/);
    assert.ok(!/https?:\/\/(?!www\.w3\.org\/)/.test(res.text.replace(/<!--[\s\S]*?-->/g, '')), 'keine externen URLs im HTML');
    const init = await request(app).get('/api/docs/swagger-ui-init.js');
    assert.equal(init.status, 200);
    assert.ok(!/https?:\/\/cdn/.test(init.text));
  });

  test('CSP: /api/docs braucht keine Lockerung, überall gilt dieselbe strenge Standard-CSP', async () => {
    const app = createApp(mockPool(() => ({ rows: [{ now: 'x' }] })));
    const strict = (await request(app).get('/api/health')).headers['content-security-policy'];
    assert.match(strict, /script-src 'self'(;|$)/);
    assert.match(strict, /default-src 'self'/);
    assert.ok(!strict.includes("'unsafe-eval'"));
    for (const p of ['/api/openapi.json', '/api/tests', '/api/unbekannt', '/api/docs/', '/api/docs/swagger-ui-init.js']) {
      assert.equal((await request(app).get(p)).headers['content-security-policy'], strict, p);
    }
  });

  test('openapi.yaml liegt im Docker-Image (Dockerfile kopiert die Datei)', () => {
    const dockerfile = fs.readFileSync(path.join(__dirname, 'Dockerfile'), 'utf8');
    assert.match(dockerfile, /openapi\.yaml/);
  });
});
