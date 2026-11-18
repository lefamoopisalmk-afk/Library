import { Link } from 'react-router-dom';
import { BRAND } from '../lib/brand.js';

// Wordmark in the Deli//Break style: a bold first word, two slashes and a
// light second word, with an optional small tag line underneath.
export default function Logo({ to = '/', compact = false, light = false }) {
  return (
    <Link
      to={to}
      className={`logo${compact ? ' logo-compact' : ''}${light ? ' logo-light' : ''}`}
      aria-label={`${BRAND.name} home`}
    >
      <span className="logo-name">
        <strong>{BRAND.first}</strong>
        <span className="logo-slash" aria-hidden="true">
          //
        </span>
        <span className="logo-second">{BRAND.second}</span>
      </span>
      {compact ? null : <span className="logo-tag">{BRAND.tagline}</span>}
    </Link>
  );
}
