import { Router } from 'express';
import { query, withTransaction } from '../db/pool.js';
import { HttpError } from '../lib/errors.js';
import { parseCover, removeCover, saveCover } from '../lib/covers.js';
import { integer, isbn, text } from '../lib/validate.js';
import { BOOK_COLUMNS, toBook } from '../lib/serialize.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const canEdit = requireRole('admin', 'librarian');

function parseBookDetails(body = {}) {
  return {
    title: text(body.title, 'Title'),
    author: text(body.author, 'Author'),
    genre: text(body.genre, 'Genre', { max: 60 }),
    isbn: isbn(body.isbn),
  };
}

// GET /api/books?q=search&low=1
router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const lowOnly = req.query.low === '1';
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    where.push('(title ILIKE $1 OR author ILIKE $1 OR isbn ILIKE $1 OR genre ILIKE $1)');
  }
  if (lowOnly) where.push('quantity < 2');

  const sql = `SELECT ${BOOK_COLUMNS} FROM books ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY title ASC`;
  const { rows } = await query(sql, params);
  res.json({ books: rows.map(toBook) });
});

// GET /api/books/:id
router.get('/:id', async (req, res) => {
  const id = integer(req.params.id, 'Book id', { min: 1 });
  const { rows } = await query(`SELECT ${BOOK_COLUMNS} FROM books WHERE id = $1`, [id]);
  if (!rows[0]) throw new HttpError(404, 'Book not found');
  res.json({ book: toBook(rows[0]) });
});

// POST /api/books  { title, author, genre, isbn, quantity, cover? }
// `cover` is an optional image as a data URL. The initial quantity is written
// to the history as a stock arrival.
router.post('/', canEdit, async (req, res) => {
  const details = parseBookDetails(req.body);
  const quantity = integer(req.body?.quantity, 'Initial quantity', { min: 0, max: 100000 });
  const cover = req.body?.cover ? parseCover(req.body.cover) : null;
  let savedPath = null;

  try {
    const book = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO books (title, author, genre, isbn, quantity) VALUES ($1, $2, $3, $4, $5) RETURNING ${BOOK_COLUMNS}`,
        [details.title, details.author, details.genre, details.isbn, quantity],
      );
      let row = rows[0];
      if (cover) {
        savedPath = await saveCover(row.id, cover);
        const updated = await client.query(`UPDATE books SET cover = $1 WHERE id = $2 RETURNING ${BOOK_COLUMNS}`, [
          savedPath,
          row.id,
        ]);
        row = updated.rows[0];
      }
      if (quantity > 0) {
        await client.query(
          `INSERT INTO transactions (book_id, book_title, user_id, user_name, type, quantity, quantity_after, note)
           VALUES ($1, $2, $3, $4, 'stock_in', $5, $5, 'Initial stock')`,
          [row.id, row.title, req.user.id, req.user.name, quantity],
        );
      }
      return row;
    });
    res.status(201).json({ book: toBook(book) });
  } catch (err) {
    await removeCover(savedPath);
    throw err;
  }
});

// PUT /api/books/:id  { title, author, genre, isbn, cover?, removeCover? }
// Stock is changed through transactions so every movement is on record.
// A renamed book keeps its history together by updating the stored title too.
router.put('/:id', canEdit, async (req, res) => {
  const id = integer(req.params.id, 'Book id', { min: 1 });
  const details = parseBookDetails(req.body);
  const cover = req.body?.cover ? parseCover(req.body.cover) : null;
  const dropCover = req.body?.removeCover === true;
  let savedPath = null;
  let oldCover = null;

  try {
    const book = await withTransaction(async (client) => {
      const found = await client.query('SELECT cover FROM books WHERE id = $1 FOR UPDATE', [id]);
      if (!found.rows[0]) throw new HttpError(404, 'Book not found');
      oldCover = found.rows[0].cover;

      let nextCover = oldCover;
      if (cover) {
        savedPath = await saveCover(id, cover);
        nextCover = savedPath;
      } else if (dropCover) {
        nextCover = null;
      }

      const { rows } = await client.query(
        `UPDATE books SET title = $1, author = $2, genre = $3, isbn = $4, cover = $5, updated_at = now()
         WHERE id = $6 RETURNING ${BOOK_COLUMNS}`,
        [details.title, details.author, details.genre, details.isbn, nextCover, id],
      );
      await client.query('UPDATE transactions SET book_title = $1 WHERE book_id = $2', [details.title, id]);
      return rows[0];
    });
    if (oldCover && oldCover !== book.cover) await removeCover(oldCover);
    res.json({ book: toBook(book) });
  } catch (err) {
    await removeCover(savedPath);
    throw err;
  }
});

// DELETE /api/books/:id
router.delete('/:id', canEdit, async (req, res) => {
  const id = integer(req.params.id, 'Book id', { min: 1 });
  const { rows } = await query('DELETE FROM books WHERE id = $1 RETURNING id, cover', [id]);
  if (!rows[0]) throw new HttpError(404, 'Book not found');
  await removeCover(rows[0].cover);
  res.json({ ok: true, id });
});

export default router;
