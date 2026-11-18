import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { formatDateTime, pluralize, TYPE_LABELS } from '../lib/format.js';
import { TypeBadge } from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Field from '../components/Field.jsx';
import BookCover from '../components/BookCover.jsx';
import LoanDialog from '../components/LoanDialog.jsx';
import {
  ArrowRightIcon,
  InboxInIcon,
  LockIcon,
  MinusIcon,
  OutIcon,
  PlusIcon,
  ReturnIcon,
  SearchIcon,
} from '../components/Icons.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { ErrorNote, Spinner } from '../components/Spinner.jsx';
import { useToast } from '../components/Toast.jsx';

const TYPES = [
  { value: 'stock_in', label: 'Add stock', text: 'New copies', Icon: InboxInIcon },
  { value: 'borrow', label: 'Borrow', text: 'Copies go out', Icon: OutIcon },
  { value: 'return', label: 'Return', text: 'Copies come back', Icon: ReturnIcon },
];

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'stock_in', label: 'Stock added' },
  { value: 'borrow', label: 'Borrowed' },
  { value: 'return', label: 'Returned' },
];

export default function Transactions() {
  const { request, canEdit } = useAuth();
  const toast = useToast();
  const [params] = useSearchParams();

  const books = useAsync(() => request('/books'), [request]);

  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const query = useDebounce(search.trim(), 250);
  const history = useAsync(() => {
    const qs = new URLSearchParams();
    if (filterType) qs.set('type', filterType);
    if (query) qs.set('q', query);
    const suffix = qs.toString();
    return request(`/transactions${suffix ? `?${suffix}` : ''}`);
  }, [request, filterType, query]);

  const [form, setForm] = useState({ bookId: '', type: 'stock_in', quantity: 1, note: '', borrowerId: '' });
  const [openEntry, setOpenEntry] = useState(null);
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  // A link like /app/transactions?book=5&type=stock_in preselects the form.
  useEffect(() => {
    const bookId = params.get('book');
    const type = params.get('type');
    if (bookId || type) {
      setForm((f) => ({
        ...f,
        bookId: bookId || f.bookId,
        type: TYPES.some((t) => t.value === type) ? type : f.type,
      }));
    }
  }, [params]);

  const bookList = books.data?.books || [];
  const selected = useMemo(() => bookList.find((b) => String(b.id) === String(form.bookId)), [bookList, form.bookId]);
  const qty = Number(form.quantity);
  const validQty = Number.isInteger(qty) && qty > 0;
  const after = selected && validQty ? selected.quantity + (form.type === 'borrow' ? -qty : qty) : null;
  const overdrawn = after !== null && after < 0;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const bump = (delta) =>
    setForm((f) => {
      const n = Number(f.quantity);
      const base = Number.isInteger(n) && n > 0 ? n : 1;
      return { ...f, quantity: Math.max(1, base + delta) };
    });

  async function submit(e) {
    e.preventDefault();
    if (!selected) return setFormError('Pick a book first');
    if (!validQty) return setFormError('Quantity must be a whole number above 0');
    if (overdrawn) return setFormError(`Only ${pluralize(selected.quantity, 'copy', 'copies')} in stock`);

    setFormError(null);
    setBusy(true);
    try {
      const data = await request('/transactions', {
        method: 'POST',
        body: {
          bookId: selected.id,
          type: form.type,
          quantity: qty,
          note: form.note.trim() || undefined,
          borrowerId: form.type === 'borrow' && form.borrowerId.trim() ? form.borrowerId.trim() : undefined,
        },
      });
      const verb = form.type === 'borrow' ? 'borrowed' : form.type === 'return' ? 'returned' : 'added';
      toast(`${pluralize(qty, 'copy', 'copies')} of “${data.book.title}” ${verb}. ${data.book.quantity} now in stock.`, 'success');
      setForm((f) => ({ ...f, quantity: 1, note: '', borrowerId: '' }));
      books.reload();
      history.reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const lowBooks = bookList.filter((b) => b.lowStock);
  const rows = history.data?.transactions || [];

  return (
    <div className="page">
      <PageHeader
        eyebrow={canEdit ? 'Stock' : 'Lending'}
        title={canEdit ? 'Transactions' : 'Borrowing activity'}
        text={canEdit ? 'Record stock arriving, copies going out, and copies coming back.' : 'Books borrowed and returned at the library, newest first.'}
      />

      <div className={canEdit ? 'two-col' : ''}>
        {canEdit ? (
          <aside className="panel sticky-aside">
            <div className="panel-head">
              <div>
                <h2>Record a movement</h2>
                <p className="muted">The shelf count and the log update together.</p>
              </div>
            </div>

            <form className="form" onSubmit={submit} noValidate>
              <Field label="Book" id="tx-book">
                <select id="tx-book" className="input select" value={form.bookId} onChange={set('bookId')}>
                  <option value="">Choose a book</option>
                  {bookList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.quantity} in stock)
                    </option>
                  ))}
                </select>
              </Field>

              <fieldset className="type-cards">
                <legend>Movement</legend>
                {TYPES.map((t) => (
                  <label key={t.value} className={`type-card${form.type === t.value ? ' is-active' : ''} type-${t.value}`}>
                    <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={set('type')} />
                    <span className="type-card-icon">
                      <t.Icon />
                    </span>
                    <strong>{t.label}</strong>
                    <span>{t.text}</span>
                  </label>
                ))}
              </fieldset>

              <div className="qty-row">
                <Field label="Quantity" id="tx-quantity">
                  <div className="stepper">
                    <button type="button" onClick={() => bump(-1)} disabled={!validQty || qty <= 1} aria-label="One less">
                      <MinusIcon />
                    </button>
                    <input id="tx-quantity" type="number" min="1" step="1" value={form.quantity} onChange={set('quantity')} />
                    <button type="button" onClick={() => bump(1)} aria-label="One more">
                      <PlusIcon />
                    </button>
                  </div>
                </Field>
                <Field label="Note (optional)" id="tx-note">
                  <input id="tx-note" className="input" value={form.note} onChange={set('note')} maxLength={300} />
                </Field>
              </div>

              {form.type === 'borrow' ? (
                <Field
                  label="Borrower's membership ID (optional)"
                  id="tx-borrower"
                  hint="Lets the member see this loan and return it from their account"
                >
                  <input
                    id="tx-borrower"
                    className="input mono"
                    value={form.borrowerId}
                    onChange={set('borrowerId')}
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                </Field>
              ) : null}

              {selected ? (
                <div className={`summary${overdrawn ? ' is-bad' : ''}`} aria-live="polite">
                  <div className="summary-book">
                    <BookCover title={selected.title} src={selected.cover} size="sm" />
                    <div>
                      <strong>{selected.title}</strong>
                      <span>{selected.author}</span>
                    </div>
                  </div>
                  <dl>
                    <div>
                      <dt>In stock now</dt>
                      <dd>{selected.quantity}</dd>
                    </div>
                    <div>
                      <dt>{TYPES.find((t) => t.value === form.type)?.label}</dt>
                      <dd className={form.type === 'borrow' ? 'is-ember' : 'is-ok'}>
                        {validQty ? `${form.type === 'borrow' ? '−' : '+'}${qty}` : '…'}
                      </dd>
                    </div>
                    <div className="summary-total">
                      <dt>After this</dt>
                      <dd>{after === null ? '…' : Math.max(after, 0)}</dd>
                    </div>
                  </dl>
                  {overdrawn ? <p className="summary-warn">Not enough copies on the shelf.</p> : null}
                </div>
              ) : null}

              {formError ? (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              ) : null}

              <Button type="submit" size="lg" className="btn-block" loading={busy} disabled={!selected || overdrawn}>
                {TYPES.find((t) => t.value === form.type)?.label}
                {validQty ? ` ${pluralize(qty, 'copy', 'copies')}` : ''}
                <ArrowRightIcon />
              </Button>
              <p className="secure-line">
                <LockIcon /> Saved to the history log with your name
              </p>
            </form>

            {lowBooks.length > 0 ? (
              <div className="quick">
                <p className="eyebrow">Quick restock</p>
                <div className="chip-list">
                  {lowBooks.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className="chip chip-button"
                      onClick={() => setForm((f) => ({ ...f, bookId: String(b.id), type: 'stock_in' }))}
                    >
                      <span>{b.title}</span>
                      <strong>{b.quantity} left</strong>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        ) : null}

        <section className="panel">
          <div className="toolbar">
            <div className="chips" role="group" aria-label="Filter by movement">
              {FILTERS.filter((f) => canEdit || f.value !== 'stock_in').map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={`chip chip-button${filterType === f.value ? ' is-active' : ''}`}
                  onClick={() => setFilterType(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <label className="search">
              <SearchIcon />
              <input
                className="input"
                type="search"
                placeholder={canEdit ? 'Search book, person or note' : 'Search title or author'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search history"
              />
            </label>
          </div>

          <ErrorNote error={history.error} onRetry={history.reload} />
          {history.loading && !history.data ? <Spinner label="Loading history" /> : null}
          {history.data && rows.length === 0 ? (
            <EmptyState title="No movements found" text="Nothing matches this filter yet." />
          ) : null}

          {rows.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Activity</th>
                    <th>When</th>
                    <th>Status</th>
                    {canEdit ? (
                      <>
                        <th className="num">Change</th>
                        <th className="num">After</th>
                        <th>By</th>
                        <th>Note</th>
                      </>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="title-cell">
                          <BookCover title={t.bookTitle} author={t.bookAuthor} src={t.bookCover} size="sm" />
                          <span>
                            <strong>{t.bookTitle}</strong>
                            <span className="muted block">
                              {t.bookId === null ? 'No longer in the catalogue' : t.bookAuthor || ''}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <TypeBadge type={t.type} />
                        <span className="visually-hidden">{TYPE_LABELS[t.type]}</span>
                      </td>
                      <td className="nowrap muted">{formatDateTime(t.createdAt)}</td>
                      <td className="history-status">
                        {t.type === 'borrow' ? (
                          t.returnedAt ? (
                            <span className="loan-state is-returned">Returned</span>
                          ) : t.canReturn ? (
                            <Button size="sm" variant="ghost" type="button" onClick={() => setOpenEntry(t)}>
                              Return
                            </Button>
                          ) : (
                            <button type="button" className="link-btn" onClick={() => setOpenEntry(t)}>
                              On loan
                            </button>
                          )
                        ) : t.type === 'return' ? (
                          <button type="button" className="link-btn" onClick={() => setOpenEntry(t)}>
                            Details
                          </button>
                        ) : null}
                      </td>
                      {canEdit ? (
                        <>
                          <td className={`num mono ${t.type === 'borrow' ? 'is-ember' : 'is-ok'}`}>
                            {t.type === 'borrow' ? '−' : '+'}
                            {t.quantity}
                          </td>
                          <td className="num mono">{t.quantityAfter}</td>
                          <td>{t.userName}</td>
                          <td className="muted">{t.note || ''}</td>
                        </>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {openEntry ? (
            <LoanDialog
              entry={openEntry}
              onClose={() => setOpenEntry(null)}
              onReturned={() => {
                books.reload();
                history.reload();
              }}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}
