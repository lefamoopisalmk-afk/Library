const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const dateOnly = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

export function formatDateTime(value) {
  return value ? dateTime.format(new Date(value)) : '';
}

export function formatDate(value) {
  return value ? dateOnly.format(new Date(value)) : '';
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export const TYPE_LABELS = {
  stock_in: 'Stock added',
  borrow: 'Borrowed',
  return: 'Returned',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  librarian: 'Librarian',
  member: 'Member',
};

export const LOW_STOCK_LIMIT = 2;
