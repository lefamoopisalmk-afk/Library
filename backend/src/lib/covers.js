import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import { query } from '../db/pool.js';
import { HttpError } from './errors.js';

// Cover images are stored in the database (table "covers"), not on disk, so
// they survive redeploys on hosts whose disk is wiped. They are still served
// at /uploads/covers/<name>, so the paths saved on books do not change.
const here = path.dirname(fileURLToPath(import.meta.url));
const OLD_UPLOADS_DIR = path.resolve(here, '../../uploads/covers');
export const LIBRARY_DIR = path.resolve(here, '../../../cover-library');

const TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MIME_BY_EXT = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
const MAX_BYTES = 5 * 1024 * 1024;
const PREFIX = '/uploads/covers/';

// Turns "data:image/jpeg;base64,...." into { bytes, ext, mime }, or throws a plain 400.
export function parseCover(dataUrl) {
  const match = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(String(dataUrl || ''));
  if (!match) throw new HttpError(400, 'The cover must be an image file');
  const ext = TYPES[match[1]];
  if (!ext) throw new HttpError(400, 'Covers can be JPG, PNG, WebP or GIF images');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length === 0) throw new HttpError(400, 'The cover image is empty');
  if (bytes.length > MAX_BYTES) throw new HttpError(400, 'The cover image must be 5 MB or smaller');
  return { bytes, ext, mime: match[1] };
}

async function store(name, mime, bytes, db = { query }) {
  await db.query(
    'INSERT INTO covers (name, mime, data) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data',
    [name, mime, bytes],
  );
  return PREFIX + name;
}

// Saves an uploaded cover and returns the public path stored in books.cover.
export async function saveCover(bookId, cover) {
  return store(`book-${bookId}-${Date.now()}.${cover.ext}`, cover.mime, cover.bytes);
}

// Saves a cover from the cover-library folder (used by the seed).
export async function saveLibraryCover(fileName, db) {
  const source = path.join(LIBRARY_DIR, fileName);
  if (!existsSync(source)) return null;
  const ext = path.extname(fileName).slice(1).toLowerCase();
  return store(`seed-${fileName}`, MIME_BY_EXT[ext] || 'application/octet-stream', readFileSync(source), db);
}

// Removes a stored cover. Missing covers are fine.
export async function removeCover(publicPath) {
  if (!publicPath || !publicPath.startsWith(PREFIX)) return;
  await query('DELETE FROM covers WHERE name = $1', [path.basename(publicPath)]).catch(() => {});
}

// Moves covers that older versions saved as files into the database, so
// nothing is lost when upgrading.
export async function importFileCovers() {
  const { rows } = await query(
    `SELECT DISTINCT b.cover FROM books b
     WHERE b.cover LIKE '/uploads/covers/%'
       AND NOT EXISTS (SELECT 1 FROM covers c WHERE '/uploads/covers/' || c.name = b.cover)`,
  );
  let moved = 0;
  for (const { cover } of rows) {
    const name = path.basename(cover);
    const ext = path.extname(name).slice(1).toLowerCase();
    const candidates = [path.join(OLD_UPLOADS_DIR, name)];
    if (name.startsWith('seed-')) candidates.push(path.join(LIBRARY_DIR, name.slice('seed-'.length)));
    const file = candidates.find((f) => existsSync(f));
    if (file) {
      await store(name, MIME_BY_EXT[ext] || 'application/octet-stream', readFileSync(file));
      moved += 1;
    }
  }
  if (moved) console.log(`[db] moved ${moved} cover image(s) into the database`);
}

// GET /uploads/covers/:name serves a cover from the database.
export const coverRouter = Router();
coverRouter.get('/covers/:name', async (req, res) => {
  const { rows } = await query('SELECT mime, data FROM covers WHERE name = $1', [req.params.name]);
  if (!rows[0]) return res.status(404).end();
  res.set('Content-Type', rows[0].mime);
  res.set('Cache-Control', 'public, max-age=604800, immutable');
  res.send(rows[0].data);
});
