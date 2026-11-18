import { Router } from 'express';
import { query, withTransaction } from '../db/pool.js';
import { HttpError } from '../lib/errors.js';
import { integer, oneOf, text } from '../lib/validate.js';
import {
  BOOK_COLUMNS,
  isStaff,
  MEMBER_VISIBLE_TYPES,
  toBook,
  toPublicTransaction,
  toTransaction,
} from '../lib/serialize.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

export const TRANSACTION_TYPES = ['stock_in', 'borrow', 'return'];

const SELECT_WITH_BOOK = `SELECT t.*, b.isbn AS book_isbn, b.cover AS book_cover, b.author AS book_author,
                                 u.membership_id AS borrower_membership_id
                          FROM transactions t
                          LEFT JOIN books b ON b.id = t.book_id
                          LEFT JOIN users u ON u.id = t.borrower_id`;

// Staff get every movement in full; members get the trimmed, public version.
function serializer(user) {
  return (row) => (isStaff(user) ? toTransaction(row, user) : toPublicTransaction(row, user));
}

// GET /api/transactions?type=borrow&bookId=3&q=text
// Staff get every movement in full. Members get borrows and returns only,
// without stock counts, staff names or notes.
router.get('/', async (req, res) => {
  const staff = isStaff(req.user);
  const where = [];
  const params = [];

  if (req.query.type) {
    params.push(oneOf(req.query.type, 'Type', staff ? TRANSACTION_TYPES : MEMBER_VISIBLE_TYPES));
    where.push(`t.type = $${params.length}`);
  }
  if (!staff) {
    params.push(MEMBER_VISIBLE_TYPES);
    where.push(`t.type = ANY($${params.length})`);
  }
  if (req.query.bookId) {
    params.push(integer(req.query.bookId, 'Book id', { min: 1 }));
    where.push(`t.book_id = $${params.length}`);
  }
  const q = String(req.query.q || '').trim();
  if (q) {
    params.push(`%${q}%`);
    const n = params.length;
    where.push(
      staff
        ? `(t.book_title ILIKE $${n} OR t.user_name ILIKE $${n} OR t.note ILIKE $${n} OR t.borrower_name ILIKE $${n})`
        : `(t.book_title ILIKE $${n} OR b.author ILIKE $${n})`,
    );
  }

  const { rows } = await query(
    `${SELECT_WITH_BOOK}
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY t.created_at DESC, t.id DESC
     LIMIT 300`,
    params,
  );
  res.json({ transactions: rows.map(serializer(req.user)) });
});

// GET /api/transactions/my-loans
// The signed-in person's books that are still out.
router.get('/my-loans', async (req, res) => {
  const { rows } = await query(
    `${SELECT_WITH_BOOK}
     WHERE t.type = 'borrow' AND t.borrower_id = $1 AND t.returned_at IS NULL
     ORDER BY t.created_at DESC`,
    [req.user.id],
  );
  res.json({ loans: rows.map(serializer(req.user)) });
});

// Looks up a member by membership ID for the borrow form.
async function findBorrower(client, membershipId) {
  const id = text(membershipId, 'Borrower membership ID', { max: 40 });
  const { rows } = await client.query('SELECT id, name, membership_id FROM users WHERE lower(membership_id) = lower($1)', [id]);
  if (!rows[0]) throw new HttpError(400, `No account has the membership ID ${id.toUpperCase()}`);
  return rows[0];
}

// POST /api/transactions  { bookId, type, quantity, note, borrowerId? }
// Adds stock (stock_in, return) or deducts it (borrow), and writes the log
// entry in the same database transaction so the two can never disagree.
// For a borrow, borrowerId is the member's membership ID (optional).
router.post('/', requireRole('admin', 'librarian'), async (req, res) => {
  const bookId = integer(req.body?.bookId, 'Book', { min: 1 });
  const type = oneOf(req.body?.type, 'Type', TRANSACTION_TYPES);
  const quantity = integer(req.body?.quantity, 'Quantity', { min: 1, max: 10000 });
  let note = text(req.body?.note, 'Note', { optional: true, max: 300 });
  const borrowerGiven = type === 'borrow' && String(req.body?.borrowerId || '').trim() !== '';

  const result = await withTransaction(async (client) => {
    const borrower = borrowerGiven ? await findBorrower(client, req.body.borrowerId) : null;

    const found = await client.query('SELECT * FROM books WHERE id = $1 FOR UPDATE', [bookId]);
    const book = found.rows[0];
    if (!book) throw new HttpError(404, 'Book not found');

    const delta = type === 'borrow' ? -quantity : quantity;
    const after = book.quantity + delta;
    if (after < 0) {
      const copies = book.quantity === 1 ? 'copy' : 'copies';
      throw new HttpError(400, `Only ${book.quantity} ${copies} of "${book.title}" in stock, so ${quantity} cannot be borrowed`);
    }
    if (borrower && !note) note = `Borrowed by ${borrower.membership_id}`;

    const updated = await client.query(
      `UPDATE books SET quantity = $1, updated_at = now() WHERE id = $2 RETURNING ${BOOK_COLUMNS}`,
      [after, bookId],
    );
    const inserted = await client.query(
      `INSERT INTO transactions (book_id, book_title, user_id, user_name, type, quantity, quantity_after, note, borrower_id, borrower_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [bookId, book.title, req.user.id, req.user.name, type, quantity, after, note, borrower?.id ?? null, borrower?.name ?? null],
    );
    return {
      book: updated.rows[0],
      transaction: {
        ...inserted.rows[0],
        book_isbn: book.isbn,
        book_cover: book.cover,
        book_author: book.author,
        borrower_membership_id: borrower?.membership_id ?? null,
      },
    };
  });

  res.status(201).json({ book: toBook(result.book), transaction: toTransaction(result.transaction, req.user) });
});

// POST /api/transactions/:id/return
// Returns a borrowed loan: the copies go back on the shelf, a "return" entry
// is written that points at the loan, and the loan is marked returned.
// Staff can return any loan; members can return loans made in their name.
router.post('/:id/return', async (req, res) => {
  const loanId = integer(req.params.id, 'Loan', { min: 1 });

  const result = await withTransaction(async (client) => {
    const found = await client.query('SELECT * FROM transactions WHERE id = $1 FOR UPDATE', [loanId]);
    const loan = found.rows[0];
    if (!loan) throw new HttpError(404, 'That loan was not found');
    if (loan.type !== 'borrow') throw new HttpError(400, 'Only borrowed books can be returned');
    if (!isStaff(req.user) && loan.borrower_id !== req.user.id) {
      throw new HttpError(403, 'You can only return books borrowed in your name. Please return this one at the desk');
    }
    if (loan.returned_at) throw new HttpError(409, `"${loan.book_title}" has already been returned`);
    if (!loan.book_id) throw new HttpError(400, 'This book is no longer in the catalogue, so it cannot be returned here');

    const b = await client.query('SELECT * FROM books WHERE id = $1 FOR UPDATE', [loan.book_id]);
    const book = b.rows[0];
    const after = book.quantity + loan.quantity;

    const updated = await client.query(
      `UPDATE books SET quantity = $1, updated_at = now() WHERE id = $2 RETURNING ${BOOK_COLUMNS}`,
      [after, book.id],
    );
    const note = isStaff(req.user) ? 'Returned at the desk' : 'Returned by the member';
    const inserted = await client.query(
      `INSERT INTO transactions (book_id, book_title, user_id, user_name, type, quantity, quantity_after, note, loan_id, borrower_id, borrower_name)
       VALUES ($1, $2, $3, $4, 'return', $5, $6, $7, $8, $9, $10) RETURNING *`,
      [book.id, book.title, req.user.id, req.user.name, loan.quantity, after, note, loan.id, loan.borrower_id, loan.borrower_name],
    );
    await client.query('UPDATE transactions SET returned_at = now() WHERE id = $1', [loan.id]);

    return {
      book: updated.rows[0],
      transaction: { ...inserted.rows[0], book_isbn: book.isbn, book_cover: book.cover, book_author: book.author },
    };
  });

  res.status(201).json({ book: toBook(result.book), transaction: serializer(req.user)(result.transaction) });
});

export default router;
