import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime, pluralize } from '../lib/format.js';
import { TypeBadge } from './Badge.jsx';
import BookCover from './BookCover.jsx';
import Button from './Button.jsx';
import { Modal } from './Modal.jsx';
import { useToast } from './Toast.jsx';

// Details of one borrow or return, opened by clicking it in the activity list
// or the history. An open loan has a "Return book" button: it puts the copies
// back on the shelf and records the return, which then shows as Returned.
export default function LoanDialog({ entry, onClose, onReturned }) {
  const { request, canEdit } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!entry) return null;

  const isLoan = entry.type === 'borrow';
  const copies = entry.quantity ? pluralize(entry.quantity, 'copy', 'copies') : null;

  async function returnBook() {
    setBusy(true);
    setError(null);
    try {
      await request(`/transactions/${entry.id}/return`, { method: 'POST' });
      toast(`“${entry.bookTitle}” has been returned. Thank you.`, 'success');
      onReturned?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  let status;
  if (!isLoan) status = 'Returned to the shelf';
  else if (entry.returnedAt) status = `Returned on ${formatDateTime(entry.returnedAt)}`;
  else if (entry.bookId === null) status = 'No longer in the catalogue';
  else status = 'Still out on loan';

  return (
    <Modal open title={isLoan ? 'Borrowed book' : 'Returned book'} onClose={onClose} width={520}>
      <div className="loan">
        <BookCover title={entry.bookTitle} author={entry.bookAuthor} src={entry.bookCover} size="lg" />
        <div className="loan-info">
          <TypeBadge type={entry.type} />
          <h3>{entry.bookTitle}</h3>
          {entry.bookAuthor ? <p className="muted">{entry.bookAuthor}</p> : null}

          <dl className="loan-details">
            <div>
              <dt>{isLoan ? 'Borrowed' : 'Returned'}</dt>
              <dd>{formatDateTime(entry.createdAt)}</dd>
            </div>
            {copies ? (
              <div>
                <dt>Copies</dt>
                <dd>{copies}</dd>
              </div>
            ) : null}
            {canEdit ? (
              <div>
                <dt>Borrower</dt>
                <dd>
                  {entry.borrowerName
                    ? `${entry.borrowerName}${entry.borrowerMembershipId ? ` (${entry.borrowerMembershipId})` : ''}`
                    : 'Not recorded'}
                </dd>
              </div>
            ) : entry.mine ? (
              <div>
                <dt>Borrower</dt>
                <dd>You</dd>
              </div>
            ) : null}
            {canEdit && entry.userName ? (
              <div>
                <dt>Recorded by</dt>
                <dd>{entry.userName}</dd>
              </div>
            ) : null}
            {isLoan ? (
              <div>
                <dt>Status</dt>
                <dd className={entry.returnedAt ? 'is-ok' : ''}>{status}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      {isLoan && !entry.canReturn && !entry.returnedAt && entry.bookId !== null && !canEdit ? (
        <p className="loan-note">This loan is not in your name. Books borrowed for someone else are returned at the desk.</p>
      ) : null}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="modal-actions">
        <Button variant="ghost" type="button" onClick={onClose} disabled={busy}>
          Close
        </Button>
        {entry.canReturn ? (
          <Button type="button" onClick={returnBook} loading={busy}>
            Return book
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
