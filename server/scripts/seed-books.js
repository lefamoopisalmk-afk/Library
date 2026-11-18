// Puts the starting books (with their covers from cover-library) on the shelf.
// Books whose ISBN is already there are skipped, so it is safe to run again.
//   npm run db:seed-books
import { pool, waitForDatabase, withTransaction } from '../src/db/pool.js';
import { ensureSchema } from '../src/db/init.js';
import { seedBooks } from '../src/db/seed.js';

try {
  await waitForDatabase();
  await ensureSchema();
  const added = await withTransaction((client) => seedBooks(client));
  console.log(`[db] added ${added} book(s) with covers`);
} finally {
  await pool.end();
}
