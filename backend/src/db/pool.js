import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/library';

// Hosted databases (Render, Neon, Supabase, ...) usually require SSL from
// outside their network. Set DATABASE_SSL=true to force it on.
const useSsl =
  process.env.DATABASE_SSL === 'true' || /render\.com|neon\.tech|supabase|amazonaws\.com/.test(connectionString);

export const pool = new Pool({ connectionString, ssl: useSsl ? { rejectUnauthorized: false } : undefined });

export function query(text, params) {
  return pool.query(text, params);
}

// Runs fn inside one database transaction. Everything commits together or
// nothing does, which is what keeps stock counts and the history log in step.
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Waits for the database to answer, so the API can start before the local
// database has finished booting.
export async function waitForDatabase({ attempts = 40, delayMs = 750 } = {}) {
  let lastError;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      lastError = err;
      if (i === 1) console.log('[api] waiting for the database...');
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Could not reach the database at ' + connectionString + ': ' + (lastError && lastError.message));
}
