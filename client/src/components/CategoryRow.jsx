import { Link } from 'react-router-dom';

// The round category buttons from the reference: a white circle with an
// icon and a label underneath, the selected one filled deep green.
// Items are links (to) or buttons (onClick).
export default function CategoryRow({ items, label = 'Categories' }) {
  return (
    <nav className="cats" aria-label={label}>
      {items.map(({ key, label: text, Icon, to, onClick, active }) => {
        const inner = (
          <>
            <span className="cat-circle">
              <Icon />
            </span>
            <span className="cat-label">{text}</span>
          </>
        );
        return to ? (
          <Link key={key} to={to} className={`cat${active ? ' is-active' : ''}`}>
            {inner}
          </Link>
        ) : (
          <button key={key} type="button" className={`cat${active ? ' is-active' : ''}`} onClick={onClick} aria-pressed={active}>
            {inner}
          </button>
        );
      })}
    </nav>
  );
}
