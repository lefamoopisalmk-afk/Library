import 'dotenv/config';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { query, waitForDatabase } from './db/pool.js';
import { ensureSchema } from './db/init.js';
import { errorHandler, notFound } from './lib/errors.js';
import { coverRouter } from './lib/covers.js';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import transactionRoutes from './routes/transactions.js';
import userRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import publicRoutes from './routes/public.js';

const PORT = Number(process.env.PORT || 4000);
const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, '../../frontend/dist');

const app = express();
app.use(cors());
// Cover images arrive as data URLs inside JSON, so allow a few megabytes.
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', coverRouter);
app.use('/uploads', (req, res) => res.status(404).end());

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Public database status: shows the PostgreSQL database is connected and how
// many records it holds. No names, passwords or connection details.
app.get('/api/health/db', async (req, res) => {
  const started = Date.now();
  const { rows } = await query(`SELECT version() AS version,
      (SELECT count(*)::int FROM books) AS books,
      (SELECT coalesce(sum(quantity), 0)::int FROM books) AS copies,
      (SELECT count(*)::int FROM users) AS users,
      (SELECT count(*)::int FROM transactions) AS transactions`);
  const r = rows[0];
  res.set('Cache-Control', 'no-store');
  res.json({
    database: 'connected',
    engine: (r.version.match(/PostgreSQL [\d.]+/) || ['PostgreSQL'])[0],
    tables: ['books', 'users', 'transactions', 'covers'],
    records: { books: r.books, copiesInStock: r.copies, users: r.users, transactions: r.transactions },
    responseMs: Date.now() - started,
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes);
app.all('/api/{*rest}', notFound);

// The assignment brief names the REST routes /books, /transactions and /users.
// The React app uses the /api/... paths above; the same routers answer here too.
app.use('/books', bookRoutes);
app.use('/transactions', transactionRoutes);
app.use('/users', userRoutes);

// After "npm run build" the React app is served from here too, so one
// process can run the whole site.
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*path}', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(errorHandler);

await waitForDatabase();
await ensureSchema();

app.listen(PORT, () => {
  console.log(`[api] Brew & Bind API listening on http://localhost:${PORT}`);
});
