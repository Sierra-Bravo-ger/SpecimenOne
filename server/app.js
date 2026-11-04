const express = require('express');
const helmet = require('helmet');

// So viele Tests lädt das Frontend (src/App.jsx) auf einmal.
const MAX_LIMIT = 2000;
const DEFAULT_LIMIT = 20;
const MAX_PAGE = 100000;
const MAX_SEARCH_LENGTH = 200;

/** Fehler mit HTTP-Status, deren Meldung an den Client gehen darf. */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

/**
 * Liest einen Query-Parameter als positive Ganzzahl.
 * Fehlt er, gilt der Default. Alles außer 1..max (z.B. "0", "-5", "10abc", "1.5"
 * oder ein mehrfach angegebener Parameter) führt zu 400.
 */
function parsePositiveInt(value, name, fallback, max) {
  if (value === undefined || value === '') return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new HttpError(400, `${name} muss eine positive Ganzzahl sein`);
  }
  const n = Number(value);
  if (n < 1 || n > max) {
    throw new HttpError(400, `${name} muss zwischen 1 und ${max} liegen`);
  }
  return n;
}

/** Express 4 fängt abgelehnte Promises nicht ab: an die Error-Middleware weiterreichen. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Erzeugt die Express-App. Der Datenbank-Pool wird injiziert (pg.Pool oder ein Mock mit query()).
 * CORS ist bewusst nicht aktiv: Das Frontend ruft die API über nginx mit gleicher Herkunft auf.
 * @param {{ query: Function }} pool
 */
function createApp(pool) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());

  // Test-Route zur Überprüfung der Datenbankverbindung
  app.get('/api/health', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  }));

  // Einfache Listen-Routen: SELECT * FROM <tabelle> → { <schluessel>: rows }
  for (const [path, table, key] of [
    ['/api/material', 'material', 'materialien'],
    ['/api/einheiten', 'einheiten', 'einheiten'],
    ['/api/profile', 'profile', 'profile'],
    ['/api/farben', 'farben', 'farben'],
  ]) {
    app.get(path, asyncHandler(async (req, res) => {
      const result = await pool.query(`SELECT * FROM ${table}`);
      res.json({ [key]: result.rows });
    }));
  }

  // Alle Referenzwerte auf einmal (ca. 1500 Zeilen). Das Frontend lädt sie beim Start,
  // damit die Testdetails auch offline vollständig sind; Zuordnung über test_id.
  app.get('/api/referenzwerte', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM referenzwerte ORDER BY test_id, id');
    res.json({ referenzwerte: result.rows });
  }));

  // Alle Versandinfos auf einmal, gleiche Join-Logik wie in /api/tests/:id.
  // test_nr ist der numerische Teil der Test-ID (T0049 → 49). Bewusst nur die
  // Anzeigefelder: keine weiteren empfaenger-Spalten (Telefon, Bank, DFÜ …).
  app.get('/api/versandinfos', asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT tv.test_nr, e.stations_bezlang, v.versandart_anz
       FROM test_versand tv
       LEFT JOIN empfaenger e ON tv.einsender_id = e.einsender_id
       LEFT JOIN versandart v ON NULLIF(split_part(tv.versandart_id, ',', 1), '')::integer = v.versandart_id
       WHERE tv.test_nr IS NOT NULL
       ORDER BY tv.test_nr, tv.test_versand_id`
    );
    res.json({ versandinfos: result.rows });
  }));

  // API-Route für Tests mit Paginierung und Suche
  app.get('/api/tests', asyncHandler(async (req, res) => {
    const page = parsePositiveInt(req.query.page, 'page', 1, MAX_PAGE);
    const limit = parsePositiveInt(req.query.limit, 'limit', DEFAULT_LIMIT, MAX_LIMIT);
    const offset = (page - 1) * limit;

    const search = req.query.search ?? '';
    if (typeof search !== 'string' || search.length > MAX_SEARCH_LENGTH) {
      throw new HttpError(400, `search muss ein Text mit höchstens ${MAX_SEARCH_LENGTH} Zeichen sein`);
    }

    let query = 'SELECT * FROM tests';
    let countQuery = 'SELECT COUNT(*) FROM tests';
    const params = [];

    if (search) {
      const where = ' WHERE name ILIKE $1 OR id ILIKE $1 OR loinc ILIKE $1 OR kategorie ILIKE $1 OR EXISTS (SELECT 1 FROM unnest(synonyme) s WHERE s ILIKE $1)';
      query += where;
      countQuery += where;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY id LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const [testsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, search ? [params[0]] : [])
    ]);

    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      tests: testsResult.rows,
      pagination: { page, limit, totalCount, totalPages }
    });
  }));

  // API-Route für einzelnen Test anhand ID
  app.get('/api/tests/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1', [id]);
    if (testResult.rows.length === 0) {
      throw new HttpError(404, 'Test nicht gefunden');
    }

    // Referenzwerte für diesen Test abrufen
    const refResult = await pool.query(
      'SELECT * FROM referenzwerte WHERE test_id = $1',
      [id]
    );

    // Versandinfos abrufen (test_versand, empfaenger, versandart)
    // Numerischen Teil der Test-ID extrahieren (z.B. T0049 -> 49)
    const testNrMatch = id.match(/T(\d+)/);
    let versandinfos = [];
    if (testNrMatch) {
      const testNr = parseInt(testNrMatch[1], 10);
      const versandResult = await pool.query(
        `SELECT e.stations_bezlang, v.versandart_anz
         FROM test_versand tv
         LEFT JOIN empfaenger e ON tv.einsender_id = e.einsender_id
         LEFT JOIN versandart v ON NULLIF(split_part(tv.versandart_id, ',', 1), '')::integer = v.versandart_id
         WHERE tv.test_nr = $1`,
        [testNr]
      );
      versandinfos = versandResult.rows;
    }

    res.json({
      ...testResult.rows[0],
      referenzwerte: refResult.rows,
      versandinfos
    });
  }));

  // Unbekannte API-Pfade: JSON statt der HTML-Fehlerseite von Express
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Nicht gefunden' });
  });

  // Zentrale Fehlerbehandlung: Details nur ins Server-Log, nie an den Client
  // (keine SQL-Texte, Tabellennamen oder Stacktraces nach außen).
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.expose && err.status >= 400 && err.status < 500) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`, err);
    res.status(500).json({ error: 'Interner Serverfehler' });
  });

  return app;
}

module.exports = { createApp, parsePositiveInt, HttpError, MAX_LIMIT };
