import { LOW_STOCK_LIMIT, ROLE_LABELS, TYPE_LABELS } from '../lib/format.js';

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

// `showLow` is for staff: members only see In stock or Out of stock.
export function StockBadge({ quantity, showLow = true }) {
  if (quantity === 0) return <Badge tone="ember">Out of stock</Badge>;
  if (showLow && quantity < LOW_STOCK_LIMIT) return <Badge tone="warn">Low stock</Badge>;
  return <Badge tone="ok">In stock</Badge>;
}

export function RoleBadge({ role }) {
  const tone = role === 'admin' ? 'accent' : role === 'librarian' ? 'info' : 'neutral';
  return <Badge tone={tone}>{ROLE_LABELS[role] || role}</Badge>;
}

export function TypeBadge({ type }) {
  const tone = type === 'borrow' ? 'ember' : type === 'return' ? 'info' : 'ok';
  return <Badge tone={tone}>{TYPE_LABELS[type] || type}</Badge>;
}
