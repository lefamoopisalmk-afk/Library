import { useState } from 'react';
import Button from './Button.jsx';
import CoverPicker from './CoverPicker.jsx';
import Field from './Field.jsx';

export const GENRES = [
  'Fiction',
  'Classic',
  'Fantasy',
  'Science Fiction',
  'Dystopian',
  'Romance',
  'Mystery',
  'History',
  'Memoir',
  'Biography',
  'Technology',
  'Science',
  'Poetry',
  'Children',
];

const ISBN_PATTERN = /^(\d{9}[\dX]|\d{13})$/;

function emptyValues() {
  return { title: '', author: '', genre: '', isbn: '', quantity: 1 };
}

// Used for adding (mode="add", includes the initial quantity) and for
// updating details (mode="edit", stock changes live on the Transactions page).
export default function BookForm({ mode = 'add', initial, onSubmit, onCancel, idPrefix = 'book' }) {
  const [values, setValues] = useState(() => ({ ...emptyValues(), ...initial }));
  const [newCover, setNewCover] = useState(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [errors, setErrors] = useState({});

  const existingCover = initial?.cover && !coverRemoved ? initial.cover : null;
  const coverSrc = newCover || existingCover;
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  function validate() {
    const next = {};
    if (!values.title.trim()) next.title = 'Title is required';
    if (!values.author.trim()) next.author = 'Author is required';
    if (!values.genre.trim()) next.genre = 'Genre is required';
    const digits = values.isbn.replace(/[-\s]/g, '').toUpperCase();
    if (!ISBN_PATTERN.test(digits)) next.isbn = 'Enter a 10 or 13 digit ISBN';
    if (mode === 'add') {
      const n = Number(values.quantity);
      if (values.quantity === '' || !Number.isInteger(n) || n < 0) next.quantity = 'Enter a whole number, 0 or more';
    }
    return next;
  }

  async function submit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      title: values.title.trim(),
      author: values.author.trim(),
      genre: values.genre.trim(),
      isbn: values.isbn.trim(),
    };
    if (mode === 'add') payload.quantity = Number(values.quantity);
    if (newCover) payload.cover = newCover;
    else if (mode === 'edit' && coverRemoved && initial?.cover) payload.removeCover = true;

    setBusy(true);
    setServerError(null);
    try {
      await onSubmit(payload);
      if (mode === 'add') {
        setValues(emptyValues());
        setNewCover(null);
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <CoverPicker
        id={`${idPrefix}-cover`}
        src={coverSrc}
        title={values.title.trim()}
        author={values.author.trim()}
        onPick={(dataUrl) => {
          setNewCover(dataUrl);
          setCoverRemoved(false);
        }}
        onRemove={() => {
          setNewCover(null);
          setCoverRemoved(true);
        }}
      />
      <Field label="Title" id={`${idPrefix}-title`} error={errors.title}>
        <input id={`${idPrefix}-title`} className="input" value={values.title} onChange={set('title')} placeholder="The Hobbit" />
      </Field>
      <Field label="Author" id={`${idPrefix}-author`} error={errors.author}>
        <input id={`${idPrefix}-author`} className="input" value={values.author} onChange={set('author')} placeholder="J. R. R. Tolkien" />
      </Field>
      <div className="form-row">
        <Field label="Genre" id={`${idPrefix}-genre`} error={errors.genre}>
          <input
            id={`${idPrefix}-genre`}
            className="input"
            value={values.genre}
            onChange={set('genre')}
            list={`${idPrefix}-genres`}
            placeholder="Fantasy"
          />
          <datalist id={`${idPrefix}-genres`}>
            {GENRES.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </Field>
        <Field label="ISBN" id={`${idPrefix}-isbn`} error={errors.isbn} hint={errors.isbn ? null : '10 or 13 digits'}>
          <input
            id={`${idPrefix}-isbn`}
            className="input mono"
            value={values.isbn}
            onChange={set('isbn')}
            placeholder="9780547928227"
            inputMode="numeric"
          />
        </Field>
      </div>
      {mode === 'add' ? (
        <Field label="Initial quantity" id={`${idPrefix}-quantity`} error={errors.quantity} hint="Copies on the shelf right now">
          <input
            id={`${idPrefix}-quantity`}
            className="input"
            type="number"
            min="0"
            step="1"
            value={values.quantity}
            onChange={set('quantity')}
          />
        </Field>
      ) : (
        <p className="field-hint">Stock is changed on the Transactions page, so every movement stays on record.</p>
      )}

      {serverError ? (
        <p className="form-error" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="form-actions">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={busy}>
          {mode === 'add' ? 'Add book' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
