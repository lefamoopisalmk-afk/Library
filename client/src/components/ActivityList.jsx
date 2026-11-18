import { formatDate, formatDateTime, pluralize } from '../lib/format.js';
import { TypeBadge } from './Badge.jsx';
import BookCover from './BookCover.jsx';

const MEMBER_LINES = {
  borrow: 'Borrowed from the library',
  return: 'Returned to the shelf',
};

const STAFF_VERBS = {
  stock_in: 'Added',
  borrow: 'Lent out',
  return: 'Returned',
};

// Recent stock movements with the book's cover. Staff see the full record
// (copies, stock after, who recorded it, note); members see only what
// happened to the book, which is all the server sends them anyway.
// Borrows and returns can be clicked (onSelect) to see details and return.
export default function ActivityList({ items, staff, onSelect }) {
  return (
    <ul className="activity">
      {items.map((t) => {
        const clickable = Boolean(onSelect) && t.type !== 'stock_in';
        const content = (
          <>
            <BookCover title={t.bookTitle} author={t.bookAuthor} src={t.bookCover} size="sm" />
            <div className="activity-text">
              <strong>{t.bookTitle}</strong>
              {staff ? (
                <span className="muted">
                  {STAFF_VERBS[t.type]} {pluralize(t.quantity, 'copy', 'copies')}, {t.quantityAfter} now in stock. By{' '}
                  {t.userName}
                  {t.note ? `, “${t.note}”` : ''}
                </span>
              ) : (
                <span className="muted">
                  {t.bookAuthor ? `${t.bookAuthor}. ` : ''}
                  {MEMBER_LINES[t.type] || ''}
                  {t.mine && t.type === 'borrow' ? ' (yours)' : ''}
                </span>
              )}
              {t.type === 'borrow' ? (
                t.returnedAt ? (
                  <span className="loan-state is-returned">Returned {formatDate(t.returnedAt)}</span>
                ) : t.canReturn ? (
                  <span className="loan-state is-open">On loan. Click to return</span>
                ) : null
              ) : null}
            </div>
            <div className="activity-meta">
              <TypeBadge type={t.type} />
              <time className="muted" dateTime={t.createdAt}>
                {formatDateTime(t.createdAt)}
              </time>
            </div>
          </>
        );
        return (
          <li key={t.id}>
            {clickable ? (
              <button type="button" className="activity-row" onClick={() => onSelect(t)}>
                {content}
              </button>
            ) : (
              <div className="activity-row">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
