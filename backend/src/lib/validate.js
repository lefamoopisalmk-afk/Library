import { HttpError } from './errors.js';

// Each helper returns the cleaned value or throws a 400 with a plain message.

export function text(value, field, { min = 1, max = 200, optional = false } = {}) {
  if (value === undefined || value === null || String(value).trim() === '') {
    if (optional) return null;
    throw new HttpError(400, `${field} is required`);
  }
  const clean = String(value).trim();
  if (clean.length < min) throw new HttpError(400, `${field} must be at least ${min} characters`);
  if (clean.length > max) throw new HttpError(400, `${field} must be ${max} characters or fewer`);
  return clean;
}

export function integer(value, field, { min = 0, max = 1000000 } = {}) {
  if (value === undefined || value === null || value === '') throw new HttpError(400, `${field} is required`);
  const n = Number(value);
  if (!Number.isInteger(n)) throw new HttpError(400, `${field} must be a whole number`);
  if (n < min) throw new HttpError(400, `${field} must be at least ${min}`);
  if (n > max) throw new HttpError(400, `${field} must be ${max} or less`);
  return n;
}

export function oneOf(value, field, allowed) {
  if (!allowed.includes(value)) {
    throw new HttpError(400, `${field} must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

// Accepts ISBN-10 or ISBN-13, with or without hyphens and spaces, and stores
// the bare digits so the same book cannot be added twice with different punctuation.
export function isbn(value) {
  const raw = text(value, 'ISBN', { max: 32 });
  const digits = raw.replace(/[-\s]/g, '').toUpperCase();
  if (!/^(\d{9}[\dX]|\d{13})$/.test(digits)) {
    throw new HttpError(400, 'ISBN must be 10 or 13 digits (hyphens are fine)');
  }
  return digits;
}

export function membershipId(value) {
  const clean = text(value, 'Membership ID', { min: 3, max: 40 }).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]*$/.test(clean)) {
    throw new HttpError(400, 'Membership ID can only contain letters, numbers and hyphens');
  }
  return clean;
}

export function password(value, { optional = false } = {}) {
  const clean = text(value, 'Password', { min: 6, max: 128, optional });
  return clean;
}
