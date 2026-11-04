// Einmaliger Live-Vertragstest: ruft jede Route einer laufenden API echt auf und prüft die
// Antworten gegen openapi.yaml (auch alle Einzeltests /api/tests/{id}). Keine CI, braucht eine DB.
//
//   PGHOST=… PGPASSWORD=… PORT=3099 node index.js &
//   node scripts/vertrag-live.js http://localhost:3099
const path = require('node:path');
const SwaggerParser = require('@apidevtools/swagger-parser');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const base = process.argv[2] || 'http://localhost:3001';
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);

let failures = 0;
let checked = 0;

async function check(api, route, url, expectedStatus = 200) {
  const res = await fetch(base + url);
  const body = await res.json();
  const schema = api.paths[route].get.responses[String(expectedStatus)].content['application/json'].schema;
  const validate = ajv.compile(schema);
  checked += 1;
  if (res.status !== expectedStatus || !validate(body)) {
    failures += 1;
    console.log(`FEHLER ${url}: Status ${res.status}`, JSON.stringify(validate.errors?.slice(0, 3)));
  }
  return body;
}

async function main() {
  const api = await SwaggerParser.dereference(path.join(__dirname, '..', 'openapi.yaml'));
  const counts = {};
  for (const route of Object.keys(api.paths)) {
    if (route.includes('{')) continue;
    const url = route === '/api/tests' ? '/api/tests?limit=2000' : route;
    const body = await check(api, route, url);
    const list = Object.values(body).find(Array.isArray);
    counts[route] = list ? list.length : 'ok';
    if (route === '/api/tests') {
      // Alle Einzeltests, 20 parallel
      const ids = list.map((t) => t.id);
      for (let i = 0; i < ids.length; i += 20) {
        await Promise.all(ids.slice(i, i + 20).map((id) => check(api, '/api/tests/{id}', `/api/tests/${id}`)));
      }
      counts['/api/tests/{id}'] = ids.length;
    }
  }
  await check(api, '/api/tests', '/api/tests?limit=2001', 400);
  await check(api, '/api/tests/{id}', '/api/tests/T9999999', 404);
  await check(api, '/api/tests', '/api/tests?search=Lanoxin');
  console.log('Anzahl je Route:', counts);
  console.log(`${checked} Antworten geprüft, ${failures} Fehler`);
  process.exit(failures ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
