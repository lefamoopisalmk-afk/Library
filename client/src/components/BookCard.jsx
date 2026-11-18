import { Link } from 'react-router-dom';
import BookCover from './BookCover.jsx';
import { BookIcon, PlusIcon } from './Icons.jsx';

// The "Popular Dishes" card from the reference design, for a book:
// picture on top, a badge, the title, a short line, the stock and a round
// plus button for the main action.
// Low-stock warnings ("Last copy on the shelf", red marking) are for staff
// only; pass showStockAlerts for librarians and admins.
export default function BookCard({ book, badge, action, showStockAlerts = false }) {
  const out = book.quantity === 0;
  const low = showStockAlerts && book.quantity < 2;

  return (
    <article className={`book-card${low ? ' is-low' : ''}`}>
      <div className="book-card-media">
        <BookCover title={book.title} author={book.author} src={book.cover} />
        {badge ? <span className="book-card-badge">{badge}</span> : null}
      </div>
      <div className="book-card-body">
        <h3>{book.title}</h3>
        <p className="book-card-meta">
          {book.author}, {book.genre}
        </p>
        <p className={`book-card-stock${low || (out && showStockAlerts) ? ' is-low' : ''}`}>
          <BookIcon />
          {out
            ? 'Out of stock'
            : low
              ? 'Last copy on the shelf'
              : `${book.quantity} ${book.quantity === 1 ? 'copy' : 'copies'} on the shelf`}
        </p>
        <div className="book-card-foot">
          <span className="book-card-qty">
            {book.quantity}
            <small> in stock</small>
          </span>
          {action ? (
            action.href ? (
              <a className="round-btn" href={action.href} aria-label={action.label} title={action.label}>
                <PlusIcon />
              </a>
            ) : (
              <Link className="round-btn" to={action.to} aria-label={action.label} title={action.label}>
                <PlusIcon />
              </Link>
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}
