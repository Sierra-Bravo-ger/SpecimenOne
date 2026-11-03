/**
 * Datenbank-Konfiguration aus Umgebungsvariablen.
 * Ein Passwort-Default gibt es bewusst nicht: Das Image ist öffentlich auf Docker Hub.
 * @param {NodeJS.ProcessEnv} env
 */
function loadDbConfig(env) {
  if (!env.PGPASSWORD) {
    throw new Error(
      'PGPASSWORD ist nicht gesetzt. Die API startet ohne Datenbank-Passwort nicht. ' +
      'Bitte PGPASSWORD als Umgebungsvariable setzen (z.B. im environment-Block der compose.yaml).'
    );
  }
  return {
    host: env.PGHOST || 'styx',
    port: parseInt(env.PGPORT || '5433', 10),
    user: env.PGUSER || 'specimen',
    password: env.PGPASSWORD,
    database: env.PGDATABASE || 'specimenone'
  };
}

module.exports = { loadDbConfig };
