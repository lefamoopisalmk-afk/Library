import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

// Passwords are checked against a bcrypt hash, which cannot be turned back
// into the password. So that people can view their own password on their
// profile page (the eye icon), an encrypted copy is kept as well, sealed with
// AES-256-GCM using a key from server/.env (PASSWORD_VIEW_KEY, falling back
// to JWT_SECRET). Only the account owner can ask for it to be opened.
const keySource = process.env.PASSWORD_VIEW_KEY || process.env.JWT_SECRET || 'shelfwise-dev-secret';
const KEY = createHash('sha256').update(String(keySource)).digest();

export function seal(plain) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, data].map((b) => b.toString('base64')).join('.');
}

export function open(sealed) {
  if (!sealed) return null;
  try {
    const [iv, tag, data] = sealed.split('.').map((s) => Buffer.from(s, 'base64'));
    const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    // Wrong key (for example the secret was changed) or damaged value.
    return null;
  }
}
