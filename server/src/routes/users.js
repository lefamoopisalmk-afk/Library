import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { HttpError } from '../lib/errors.js';
import { integer, membershipId, oneOf, password, text } from '../lib/validate.js';
import { toUser, USER_COLUMNS } from '../lib/serialize.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { seal } from '../lib/secret.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

export const ROLES = ['admin', 'librarian', 'member'];

// GET /api/users
router.get('/', async (req, res) => {
  const { rows } = await query(`SELECT ${USER_COLUMNS} FROM users ORDER BY created_at ASC, id ASC`);
  res.json({ users: rows.map(toUser) });
});

// POST /api/users  { name, membershipId, role, password }
router.post('/', async (req, res) => {
  const name = text(req.body?.name, 'Name', { max: 120 });
  const id = membershipId(req.body?.membershipId);
  const role = oneOf(req.body?.role, 'Role', ROLES);
  const plain = password(req.body?.password);
  const hash = await bcrypt.hash(plain, 10);

  const { rows } = await query(
    `INSERT INTO users (name, membership_id, role, password_hash, password_secret) VALUES ($1, $2, $3, $4, $5) RETURNING ${USER_COLUMNS}`,
    [name, id, role, hash, seal(plain)],
  );
  res.status(201).json({ user: toUser(rows[0]) });
});

// PUT /api/users/:id  { name, membershipId, role, password? }
router.put('/:id', async (req, res) => {
  const id = integer(req.params.id, 'User id', { min: 1 });
  const name = text(req.body?.name, 'Name', { max: 120 });
  const member = membershipId(req.body?.membershipId);
  const role = oneOf(req.body?.role, 'Role', ROLES);
  const newPassword = password(req.body?.password, { optional: true });

  if (id === req.user.id && role !== 'admin') {
    throw new HttpError(400, 'You cannot remove your own admin role');
  }

  const params = [name, member, role, id];
  let setPassword = '';
  if (newPassword) {
    params.push(await bcrypt.hash(newPassword, 10));
    setPassword = `, password_hash = $${params.length}`;
    params.push(seal(newPassword));
    setPassword += `, password_secret = $${params.length}`;
  }

  const { rows } = await query(
    `UPDATE users SET name = $1, membership_id = $2, role = $3${setPassword} WHERE id = $4 RETURNING ${USER_COLUMNS}`,
    params,
  );
  if (!rows[0]) throw new HttpError(404, 'User not found');
  res.json({ user: toUser(rows[0]) });
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  const id = integer(req.params.id, 'User id', { min: 1 });
  if (id === req.user.id) throw new HttpError(400, 'You cannot delete the account you are signed in with');

  const { rows } = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  if (!rows[0]) throw new HttpError(404, 'User not found');
  res.json({ ok: true, id });
});

export default router;
