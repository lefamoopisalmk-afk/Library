import BookForm from './BookForm.jsx';

// The "Add a book" panel: a controlled form for title, author, genre, ISBN,
// initial quantity and cover, with validation, built on the shared BookForm.
export default function AddBookForm({ onAdd }) {
  return (
    <aside className="panel">
      <div className="panel-head">
        <div>
          <h2>Add a book</h2>
          <p className="muted">The initial quantity is logged as stock arriving.</p>
        </div>
      </div>
      <BookForm mode="add" onSubmit={onAdd} idPrefix="add-book" />
    </aside>
  );
}
