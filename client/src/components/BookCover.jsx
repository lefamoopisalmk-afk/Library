import { useState } from 'react';

// Shows the book's real cover image when it has one. Books without a cover,
// or whose image fails to load, get a drawn cover in the brand colours, picked
// from the title so a book always looks the same.
const PALETTES = [
  ['#1d4a33', '#0f2e1f', '#e9d3a2'],
  ['#b5543a', '#7d3321', '#f6e3c4'],
  ['#2f4f6f', '#1b3047', '#e2ebf3'],
  ['#c49a52', '#8c6a2f', '#24190a'],
  ['#5d3f61', '#3b2440', '#f0dff0'],
  ['#20282d', '#0d1316', '#d8b26e'],
  ['#6f8a4e', '#4a5f31', '#f4f1dd'],
  ['#8a2f3c', '#5a1a24', '#f3dcc8'],
];

function hash(text) {
  let h = 7;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export default function BookCover({ title, author, src, size = 'md' }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (src && src !== failedSrc) {
    return (
      <img
        className={`cover-photo cover-photo-${size}`}
        src={src}
        alt={title ? `Cover of ${title}` : 'Book cover'}
        loading="lazy"
        onError={() => setFailedSrc(src)}
      />
    );
  }

  const [c1, c2, ink] = PALETTES[hash(title || '') % PALETTES.length];
  return (
    <div className={`cover cover-${size}`} style={{ '--c1': c1, '--c2': c2, '--ink': ink }} aria-hidden="true">
      <span className="cover-rule" />
      <span className="cover-title">{title || 'Untitled'}</span>
      {author ? <span className="cover-author">{author}</span> : null}
      <span className="cover-mark" />
    </div>
  );
}
