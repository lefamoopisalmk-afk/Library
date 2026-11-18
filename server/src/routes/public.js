import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

// GET /api/public/shelf?q=search&genre=Fiction
// The front page shows a few titles without signing in. Only catalogue facts
// are returned (title, author, genre, copies), never people or history.
router.get('/shelf', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 80);
  const genre = String(req.query.genre || '').trim().slice(0, 60);
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    where.push(`(b.title ILIKE $${params.length} OR b.author ILIKE $${params.length} OR b.genre ILIKE $${params.length})`);
  }
  if (genre) {
    params.push(genre);
    where.push(`lower(b.genre) = lower($${params.length})`);
  }

  const [books, totals, genres] = await Promise.all([
    query(
      `SELECT b.id, b.title, b.author, b.genre, b.quantity, b.cover,
              coalesce(sum(t.quantity) FILTER (WHERE t.type = 'borrow'), 0)::int AS borrows
       FROM books b
       LEFT JOIN transactions t ON t.book_id = b.id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       GROUP BY b.id
       ORDER BY borrows DESC, b.quantity DESC, b.title ASC
       LIMIT 8`,
      params,
    ),
    query(`SELECT count(*)::int AS titles, coalesce(sum(quantity), 0)::int AS copies,
                  count(*) FILTER (WHERE quantity < 2)::int AS low_stock
           FROM books`),
    query('SELECT genre, count(*)::int AS n FROM books GROUP BY genre ORDER BY n DESC, genre ASC LIMIT 6'),
  ]);

  const t = totals.rows[0];
  res.json({
    books: books.rows,
    totals: { titles: t.titles, copies: t.copies, lowStock: t.low_stock },
    genres: genres.rows.map((g) => g.genre),
  });
});

export default router;
