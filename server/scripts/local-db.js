// Starts a real PostgreSQL server for local development without installing
// anything on the machine. The binaries come from the embedded-postgres
// npm package and the data lives in server/.pgdata (ignored by git).
//
//   npm run db:local        (or "npm run dev" at the project root, which runs this too)
//
// If you already have PostgreSQL installed, you do not need this script:
// point DATABASE_URL in server/.env at your own server instead.

import EmbeddedPostgres from 'embedded-postgres';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, '..', '.pgdata');
const port = Number(process.env.LOCAL_PG_PORT || 5433);
const user = 'postgres';
const password = 'postgres';
const databaseName = 'library';

// A previous run that was killed hard can leave a lock file behind. If the
// process it names is gone, the lock is stale and safe to remove.
function clearStaleLock() {
  const lock = path.join(dataDir, 'postmaster.pid');
  if (!existsSync(lock)) return;
  const pid = Number(readFileSync(lock, 'utf8').split(/\r?\n/)[0]);
  try {
    process.kill(pid, 0);
    console.log(`[db] another PostgreSQL (pid ${pid}) is already running from ${dataDir}`);
  } catch {
    rmSync(lock, { force: true });
    console.log('[db] removed a stale lock file from an earlier run');
  }
}

const db = new EmbeddedPostgres({
  databaseDir: dataDir,
  user,
  password,
  port,
  persistent: true,
  autoRehydrateSymlinks: true,
  onLog: () => {},
  onError: (msg) => console.error('[db]', String(msg).trim()),
});

const isFresh = !existsSync(path.join(dataDir, 'PG_VERSION'));
if (isFresh) {
  console.log('[db] first run: creating the data folder (takes a few seconds)');
  await db.initialise();
} else {
  clearStaleLock();
}

await db.start();

// Create the "library" database once.
const admin = new pg.Client({ host: 'localhost', port, user, password, database: 'postgres' });
await admin.connect();
const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
if (rows.length === 0) {
  await admin.query(`CREATE DATABASE ${databaseName}`);
  console.log(`[db] created database "${databaseName}"`);
}
await admin.end();

console.log(`[db] PostgreSQL is running on port ${port}. Connection: postgres://${user}:${password}@localhost:${port}/${databaseName}`);
console.log('[db] Press Ctrl+C to stop.');

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  console.log('\n[db] stopping PostgreSQL');
  try {
    await db.stop();
  } finally {
    process.exit(0);
  }
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('SIGHUP', stop);
