import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { HttpError } from '../lib/errors.js';
import { oneOf, password, text } from '../lib/validate.js';
import { toUser, USER_COLUMNS } from '../lib/serialize.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { open, seal } from '../lib/secret.js';

const router = Router();

const STAFF_ROLES = ['librarian', 'admin'];

// The staff code staff enter when they sign in. STAFF_SIGNIN_CODE in
// server/.env; the older name LIBRARIAN_SIGNUP_CODE still works.
function staffCode() {
  return (process.env.STAFF_SIGNIN_CODE || process.env.LIBRARIAN_SIGNUP_CODE || '').trim();
}

// POST /api/auth/login  { membershipId, password, staffCode? }
// Members sign in with ID and password. Staff (librarians and admins) also
// enter the staff code, so a leaked staff password alone is not enough.
router.post('/login', async (req, res) => {
  const membershipId = text(req.body?.membershipId, 'Membership ID', { max: 40 });
  const password = text(req.body?.password, 'Password', { max: 128 });

  const { rows } = await query('SELECT * FROM users WHERE lower(membership_id) = lower($1)', [membershipId]);
  const user = rows[0];
  const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!ok) throw new HttpError(401, 'Membership ID or password is incorrect');

  if (STAFF_ROLES.includes(user.role)) {
    const expected = staffCode();
    const given = String(req.body?.staffCode || '').trim();
    if (!given) throw new HttpError(403, 'This is a staff account. Choose Staff and enter the staff code to sign in');
    if (!expected) throw new HttpError(503, 'Staff sign-in is not set up yet: the server needs STAFF_SIGNIN_CODE');
    if (given.toLowerCase() !== expected.toLowerCase()) throw new HttpError(403, 'That staff code is not right');
  }

  // Accounts made before the profile page could show passwords get their
  // encrypted copy the first time they sign in.
  if (!user.password_secret) {
    await query('UPDATE users SET password_secret = $1 WHERE id = $2', [seal(password), user.id]);
  }

  res.json({ token: signToken(user), user: toUser(user) });
});

const PREFIX = { member: 'MEM' };

// The next free ID for a role, e.g. MEM-004 after MEM-003.
async function nextMembershipId(role) {
  const prefix = PREFIX[role];
  const { rows } = await query(
    `SELECT coalesce(max(substring(membership_id FROM '^${prefix}-([0-9]+)$')::int), 0) AS n
     FROM users WHERE membership_id ~ '^${prefix}-[0-9]+$'`,
  );
  return `${prefix}-${String(rows[0].n + 1).padStart(3, '0')}`;
}

// POST /api/auth/register  { name, password }
// Anyone can create a member account. Librarian and admin accounts are only
// made by an admin on the Users page.
router.post('/register', async (req, res) => {
  const name = text(req.body?.name, 'Name', { min: 2, max: 120 });
  const role = oneOf(req.body?.role || 'member', 'Account type', ['member']);
  const plain = password(req.body?.password);
  const hash = await bcrypt.hash(plain, 10);

  // Two people signing up at the same moment could pick the same ID; the
  // unique index catches it and we simply try the next one.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const membershipId = await nextMembershipId(role);
    try {
      const { rows } = await query(
        `INSERT INTO users (name, membership_id, role, password_hash, password_secret) VALUES ($1, $2, $3, $4, $5) RETURNING ${USER_COLUMNS}`,
        [name, membershipId, role, hash, seal(plain)],
      );
      const user = rows[0];
      return res.status(201).json({ token: signToken(user), user: toUser(user) });
    } catch (err) {
      if (err.code !== '23505') throw err;
    }
  }
  throw new HttpError(503, 'Could not create the account right now. Please try again');
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/me/password
// The signed-in person's own password, for the eye icon on their profile.
router.get('/me/password', requireAuth, async (req, res) => {
  const { rows } = await query('SELECT password_secret FROM users WHERE id = $1', [req.user.id]);
  const plain = open(rows[0]?.password_secret);
  if (plain === null) {
    throw new HttpError(404, 'Your password can be shown after your next sign-in or password change');
  }
  res.set('Cache-Control', 'no-store');
  res.json({ password: plain });
});

// PUT /api/auth/me/password  { currentPassword, newPassword }
// Changes the signed-in person's password after checking the current one.
router.put('/me/password', requireAuth, async (req, res) => {
  const current = text(req.body?.currentPassword, 'Current password', { max: 128 });
  const next = password(req.body?.newPassword);

  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const ok = rows[0] ? await bcrypt.compare(current, rows[0].password_hash) : false;
  if (!ok) throw new HttpError(400, 'Your current password is not right');
  if (await bcrypt.compare(next, rows[0].password_hash)) {
    throw new HttpError(400, 'The new password must be different from the current one');
  }

  const hash = await bcrypt.hash(next, 10);
  await query('UPDATE users SET password_hash = $1, password_secret = $2 WHERE id = $3', [hash, seal(next), req.user.id]);
  res.json({ ok: true });
});

export default router;
