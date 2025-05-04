const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
const port = 3001;

// PostgreSQL Verbindung konfigurieren
const pool = new Pool({
  host: '192.168.178.43',
  port: 5433,
  user: 'specimen',
  password: 'specimenpw',
  database: 'specimenone'
});

app.use(cors());
app.use(express.json());

// Test-Route zur Überprüfung der Datenbankverbindung
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API-Route für Materialdaten
app.get('/api/material', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM material');
    res.json({ materialien: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API-Route für Einheiten
app.get('/api/einheiten', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM einheiten');
    res.json({ einheiten: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API-Route für Tests mit Paginierung und Suche
app.get('/api/tests', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = 'SELECT * FROM tests';
    let countQuery = 'SELECT COUNT(*) FROM tests';
    let params = [];

    if (search) {
      query += ' WHERE name ILIKE $1 OR id ILIKE $1 OR $1 = ANY(synonyme)';
      countQuery += ' WHERE name ILIKE $1 OR id ILIKE $1 OR $1 = ANY(synonyme)';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY id LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const [testsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, search ? [params[0]] : [])
    ]);

    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      tests: testsResult.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API-Route für einzelnen Test anhand ID
app.get('/api/tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1', [id]);
    
    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test nicht gefunden' });
    }
    
    // Referenzwerte für diesen Test abrufen
    const refResult = await pool.query(
      'SELECT * FROM referenzwerte WHERE test_id = $1',
      [id]
    );

    // Ergebnisse zusammenführen
    const result = {
      ...testResult.rows[0],
      referenzwerte: refResult.rows
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API-Route für Profile
app.get('/api/profile', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profile');
    res.json({ profile: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API-Route für Farben
app.get('/api/farben', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM farben');
    res.json({ farben: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
