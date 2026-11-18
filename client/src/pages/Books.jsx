import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { pluralize } from '../lib/format.js';
import AddBookForm from '../components/AddBookForm.jsx';
import BookForm from '../components/BookForm.jsx';
import BookList from '../components/BookList.jsx';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SearchIcon } from '../components/Icons.jsx';
import { ConfirmDialog, Modal } from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { ErrorNote, Spinner } from '../components/Spinner.jsx';
import { useToast } from '../components/Toast.jsx';

// About as many rows as fit beside the Add a book form; Show more adds more.
const PAGE_SIZE = 6;

export default function Books() {
  const { request, canEdit } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [params] = useSearchParams();
  const [lowOnlyChoice, setLowOnly] = useState(() => params.get('low') === '1');
  // The low-stock filter is a staff tool; members never get it, even from a link.
  const lowOnly = canEdit && lowOnlyChoice;
  const query = useDebounce(search.trim(), 250);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => setVisibleCount(PAGE_SIZE), [query, lowOnly]);

  const list = useAsync(
    () => request(`/books?q=${encodeURIComponent(query)}${lowOnly ? '&low=1' : ''}`),
    [request, query, lowOnly],
  );

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const closeEdit = useCallback(() => setEditing(null), []);
  const closeDelete = useCallback(() => setDeleting(null), []);

  async function addBook(values) {
    const data = await request('/books', { method: 'POST', body: values });
    toast(`Added “${data.book.title}” with ${pluralize(data.book.quantity, 'copy', 'copies')}`, 'success');
    list.reload();
  }

  async function updateBook(values) {
    const data = await request(`/books/${editing.id}`, { method: 'PUT', body: values });
    toast(`Updated “${data.book.title}”`, 'success');
    setEditing(null);
    list.reload();
  }

  async function deleteBook() {
    setDeleteBusy(true);
    try {
      await request(`/books/${deleting.id}`, { method: 'DELETE' });
      toast(`Deleted “${deleting.title}”`, 'info');
      setDeleting(null);
      list.reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  }

  const books = list.data?.books || [];
  const shown = books.slice(0, visibleCount);
  const hiddenCount = books.length - shown.length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Catalogue"
        title="Books"
        text={canEdit ? 'Add a title, fix its details, or remove it when it leaves the collection.' : 'Every title in the collection.'}
      />

      <div className={canEdit ? 'two-col books-layout' : ''}>
        {canEdit ? <AddBookForm onAdd={addBook} /> : null}

        <section className="panel books-list">
          <div className="toolbar">
            <label className="search">
              <SearchIcon />
              <input
                className="input"
                type="search"
                placeholder="Search title, author, genre or ISBN"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search books"
              />
            </label>
            {canEdit ? (
              <label className="check">
                <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
                <span>Low stock only</span>
              </label>
            ) : null}
            <span className="muted toolbar-count">{list.data ? pluralize(books.length, 'title') : ''}</span>
          </div>

          <ErrorNote error={list.error} onRetry={list.reload} />
          {list.loading && !list.data ? <Spinner label="Loading books" /> : null}

          {list.data && books.length === 0 ? (
            <EmptyState
              title={query || lowOnly ? 'No matches' : 'No books yet'}
              text={query || lowOnly ? 'Try a different search or clear the filter.' : 'Add the first title with the form.'}
            />
          ) : null}

          {books.length > 0 ? (
            <BookList books={shown} canEdit={canEdit} onUpdate={setEditing} onDelete={setDeleting} />
          ) : null}

          {books.length > PAGE_SIZE ? (
            <div className="show-more">
              <span className="muted">
                Showing {shown.length} of {books.length}
              </span>
              {hiddenCount > 0 ? (
                <Button variant="ghost" size="sm" type="button" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                  Show more
                </Button>
              ) : (
                <Button variant="ghost" size="sm" type="button" onClick={() => setVisibleCount(PAGE_SIZE)}>
                  Show less
                </Button>
              )}
            </div>
          ) : null}
        </section>
      </div>

      <Modal open={Boolean(editing)} title={editing ? `Update “${editing.title}”` : ''} onClose={closeEdit} width={560}>
        {editing ? (
          <BookForm key={editing.id} mode="edit" initial={editing} onSubmit={updateBook} onCancel={closeEdit} idPrefix="edit-book" />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this book?"
        message={
          deleting
            ? `“${deleting.title}” will be removed from the catalogue. Its history stays in the transaction log.`
            : ''
        }
        confirmLabel="Delete book"
        busy={deleteBusy}
        onConfirm={deleteBook}
        onClose={closeDelete}
      />
    </div>
  );
}
