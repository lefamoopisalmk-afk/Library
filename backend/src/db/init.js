import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pool, waitForDatabase, withTransaction } from './pool.js';
import { seed } from './seed.js';
import { importFileCovers } from '../lib/covers.js';

// Creates the tables if they are missing and loads the demo data the first
// time the database is empty.
export async function ensureSchema() {
  const sql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);

  const { rows } = await pool.query('SELECT count(*)::int AS n FROM users');
  if (rows[0].n === 0) {
    console.log('[db] empty database, loading the demo accounts and books');
    await withTransaction((client) => seed(client));
  }

  // Covers saved as files by older versions are moved into the database.
  await importFileCovers();
}

// "npm run db:init" runs this file directly.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    await waitForDatabase();
    await ensureSchema();
    console.log('[db] schema is ready');
  } finally {
    await pool.end();
  }
}
