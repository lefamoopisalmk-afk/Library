import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';

// The site header, used on every page: a full-width bar with links on the
// left, the wordmark in the middle and account actions on the right. It is a
// solid bar that is part of the page and scrolls away with it.
// Links take `to` (router page, highlighted when active) or `href` (anchor).
export default function SiteHeader({ links = [], right = null, homeTo = '/' }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <button
          type="button"
          className="icon-btn site-header-menu"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="burger" />
        </button>

        <nav className={`site-header-links${open ? ' is-open' : ''}`} aria-label="Main">
          {links.map((l) =>
            l.to ? (
              <NavLink
                key={l.label}
                to={l.to}
                end={l.end}
                className={({ isActive }) => (isActive ? 'is-active' : '')}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </NavLink>
            ) : (
              <a
                key={l.label}
                href={l.href}
                onClick={() => {
                  setOpen(false);
                  l.onClick?.();
                }}
              >
                {l.label}
              </a>
            ),
          )}
        </nav>

        <Logo to={homeTo} />

        <div className="site-header-actions">{right}</div>
      </div>
    </header>
  );
}
