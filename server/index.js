const { Pool } = require('pg');
const { createApp } = require('./app');
const { loadDbConfig } = require('./config');

const port = parseInt(process.env.PORT || '3001', 10);

let dbConfig;
try {
  dbConfig = loadDbConfig(process.env);
} catch (err) {
  console.error(`Startabbruch: ${err.message}`);
  process.exit(1);
}

// PostgreSQL Verbindung konfigurieren
const pool = new Pool(dbConfig);

// Fehler ungenutzter Verbindungen (z.B. DB-Neustart) loggen statt den Prozess zu beenden
pool.on('error', (err) => {
  console.error('PostgreSQL-Pool-Fehler:', err);
});

createApp(pool).listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
