import { useRef, useState } from 'react';
import BookCover from './BookCover.jsx';
import { PlusIcon } from './Icons.jsx';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_W = 600;
const MAX_H = 900;

// Reads an image file and shrinks it to at most 600 x 900 pixels as a JPEG
// data URL, so uploads stay small however large the original photo was.
function shrink(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_W / img.naturalWidth, MAX_H / img.naturalHeight);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image'));
    };
    img.src = url;
  });
}

// The cover preview at the top of the book form: shows the chosen cover with
// the title and author underneath as they are typed.
export default function CoverPicker({ id, src, title, author, onPick, onRemove }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);

  async function take(file) {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      setError('Choose a JPG, PNG, WebP or GIF image');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError('That image is larger than 15 MB');
      return;
    }
    setError(null);
    setReading(true);
    try {
      onPick(await shrink(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setReading(false);
    }
  }

  return (
    <div className="cover-picker">
      <div
        className={`cover-drop${dragging ? ' is-dragging' : ''}${src ? ' has-cover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files?.[0]);
        }}
      >
        <BookCover title={title} author={author} src={src} size="lg" />
        {!src ? <span className="cover-drop-hint">No cover yet</span> : null}
      </div>

      <div className="cover-picker-side">
        <p className="cover-picker-title">{title || 'Book title'}</p>
        <p className="cover-picker-author">{author || 'Author'}</p>
        <div className="cover-picker-actions">
          <label htmlFor={id} className="btn btn-ghost btn-sm">
            <PlusIcon /> {src ? 'Change cover' : 'Choose cover'}
          </label>
          <input
            ref={inputRef}
            id={id}
            className="visually-hidden"
            type="file"
            accept={ACCEPT.join(',')}
            onChange={(e) => {
              take(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {src ? (
            <button type="button" className="link-btn" onClick={onRemove}>
              Remove
            </button>
          ) : null}
        </div>
        <p className="field-hint">{reading ? 'Preparing the image...' : 'JPG, PNG or WebP. You can also drop an image on the cover.'}</p>
        {error ? (
          <p className="field-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
