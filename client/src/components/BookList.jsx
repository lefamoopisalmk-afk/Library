import { StockBadge } from './Badge.jsx';
import BookCover from './BookCover.jsx';
import Button from './Button.jsx';

// The editable list of books: cover, title, author, genre, ISBN, stock and
// status, with Update and Delete buttons for staff. Low-stock rows are
// highlighted for staff only.
export default function BookList({ books, canEdit, onUpdate, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Genre / ISBN</th>
            <th className="num">In stock</th>
            <th>Status</th>
            {canEdit ? <th className="actions-col">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr key={b.id} className={canEdit && b.lowStock ? 'row-low' : ''}>
              <td>
                <div className="title-cell">
                  <BookCover title={b.title} src={b.cover} size="sm" />
                  <span>
                    <strong>{b.title}</strong>
                    <span className="muted block">{b.author}</span>
                  </span>
                </div>
              </td>
              <td>
                {b.genre}
                <span className="muted block mono isbn">{b.isbn}</span>
              </td>
              <td className="num">
                <span className="qty">{b.quantity}</span>
              </td>
              <td>
                <StockBadge quantity={b.quantity} showLow={canEdit} />
              </td>
              {canEdit ? (
                <td className="actions-col">
                  <div className="row-actions">
                    <Button variant="ghost" size="sm" type="button" onClick={() => onUpdate(b)}>
                      Update
                    </Button>
                    <Button variant="danger-ghost" size="sm" type="button" onClick={() => onDelete(b)}>
                      Delete
                    </Button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
