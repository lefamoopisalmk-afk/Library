import { Link, NavLink } from 'react-router-dom';

// Phone-only bottom bar with a raised round button in the middle, as in the
// reference design. Items take `to` (router link) or `href` (page anchor).
export default function BottomNav({ items, center }) {
  const half = Math.ceil(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);

  const renderItem = ({ key, label, Icon, to, href, end, active }) =>
    to ? (
      <NavLink key={key} to={to} end={end} className={({ isActive }) => `bn-item${isActive || active ? ' is-active' : ''}`}>
        <Icon />
        <span>{label}</span>
      </NavLink>
    ) : (
      <a key={key} href={href} className={`bn-item${active ? ' is-active' : ''}`}>
        <Icon />
        <span>{label}</span>
      </a>
    );

  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      {left.map(renderItem)}
      {center ? (
        center.to ? (
          <Link to={center.to} className="bn-center">
            <center.Icon />
            <span>{center.label}</span>
          </Link>
        ) : (
          <a href={center.href} className="bn-center">
            <center.Icon />
            <span>{center.label}</span>
          </a>
        )
      ) : null}
      {right.map(renderItem)}
    </nav>
  );
}
