const { Pool } = require('pg');
const { createApp } = require('./app');

const port = parseInt(process.env.PORT || '3001', 10);

// PostgreSQL Verbindung konfigurieren
const pool = new Pool({
  host: process.env.PGHOST || 'styx',
  port: parseInt(process.env.PGPORT || '5433', 10),
  user: process.env.PGUSER || 'specimen',
  password: process.env.PGPASSWORD || 'specimenpw',
  database: process.env.PGDATABASE || 'specimenone'
});

createApp(pool).listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
