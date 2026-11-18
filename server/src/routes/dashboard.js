import { Router } from 'express';
import { query } from '../db/pool.js';
import { BOOK_COLUMNS, isStaff, toBook, toPublicTransaction, toTransaction } from '../lib/serialize.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/dashboard
// Staff get the full picture, including low stock and every stock movement.
// Members get the catalogue totals and recent lending only.
router.get('/', async (req, res) => {
  const staff = isStaff(req.user);

  const [totals, lowStock, recent, activity] = await Promise.all([
    query(`SELECT count(*)::int AS titles,
                  coalesce(sum(quantity), 0)::int AS copies,
                  count(*) FILTER (WHERE quantity < 2)::int AS low_stock,
                  count(*) FILTER (WHERE quantity = 0)::int AS out_of_stock
           FROM books`),
    staff
      ? query(`SELECT ${BOOK_COLUMNS} FROM books WHERE quantity < 2 ORDER BY quantity ASC, title ASC LIMIT 20`)
      : Promise.resolve({ rows: [] }),
    query(`SELECT t.*, b.isbn AS book_isbn, b.cover AS book_cover, b.author AS book_author,
                  u.membership_id AS borrower_membership_id
           FROM transactions t
           LEFT JOIN books b ON b.id = t.book_id
           LEFT JOIN users u ON u.id = t.borrower_id
           ${staff ? '' : "WHERE t.type IN ('borrow', 'return')"}
           ORDER BY t.created_at DESC, t.id DESC LIMIT 8`),
    query(`SELECT count(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS today,
                  coalesce(sum(quantity) FILTER (WHERE type = 'borrow' AND created_at >= now() - interval '7 days'), 0)::int AS borrowed_this_week,
                  coalesce(sum(quantity) FILTER (WHERE type = 'return' AND created_at >= now() - interval '7 days'), 0)::int AS returned_this_week,
                  coalesce(sum(quantity) FILTER (WHERE type IN ('stock_in', 'return') AND created_at >= now() - interval '7 days'), 0)::int AS added_this_week
           FROM transactions`),
  ]);

  const t = totals.rows[0];
  const a = activity.rows[0];
  res.json({
    totals: {
      titles: t.titles,
      copies: t.copies,
      lowStock: staff ? t.low_stock : null,
      outOfStock: staff ? t.out_of_stock : null,
      transactionsToday: staff ? a.today : null,
      borrowedThisWeek: a.borrowed_this_week,
      returnedThisWeek: a.returned_this_week,
      addedThisWeek: staff ? a.added_this_week : null,
    },
    lowStockBooks: lowStock.rows.map(toBook),
    recentTransactions: recent.rows.map((r) => (staff ? toTransaction(r, req.user) : toPublicTransaction(r, req.user))),
  });
});

export default router;
