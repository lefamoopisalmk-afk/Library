import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';
import { HttpError } from '../lib/errors.js';
import { toUser, USER_COLUMNS } from '../lib/serialize.js';

const SECRET = process.env.JWT_SECRET || 'shelfwise-dev-secret';
if (!process.env.JWT_SECRET) {
  console.warn('[api] JWT_SECRET is not set, using a development default');
}

export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, SECRET, { expiresIn: '12h' });
}

// Reads the "Authorization: Bearer <token>" header, checks the token and
// loads the current user from the database so role changes apply at once.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please sign in');

  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    throw new HttpError(401, 'Your session has expired. Please sign in again');
  }

  const { rows } = await query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [payload.sub]);
  if (!rows[0]) throw new HttpError(401, 'This account no longer exists');

  req.user = toUser(rows[0]);
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(403, 'You do not have permission to do that');
    }
    next();
  };
}
