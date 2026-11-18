import { Link } from 'react-router-dom';
import { BRAND } from '../lib/brand.js';
import { ClockIcon, LockIcon, ShieldIcon, StackIcon } from './Icons.jsx';
import Logo from './Logo.jsx';

// The site footer, used on every page: a frosted-glass block with the
// wordmark, a few quick links, the four things the library does well and
// the copyright line.
export default function SiteFooter({ links = [] }) {
  return (
    <footer className="site-footer">
      <div className="container footer-card">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo />
            <p>A warm corner for good books. Every copy counted, every loan on record.</p>
          </div>
          {links.length ? (
            <nav className="footer-links" aria-label="Footer">
              {links.map((l) =>
                l.to ? (
                  <Link key={l.label} to={l.to}>
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.label} href={l.href} onClick={l.onClick}>
                    {l.label}
                  </a>
                ),
              )}
            </nav>
          ) : null}
        </div>

        <ul className="perks">
          <li>
            <StackIcon /> Live stock counts
          </li>
          <li>
            <ShieldIcon /> Role-based access
          </li>
          <li>
            <ClockIcon /> Full history log
          </li>
          <li>
            <LockIcon /> Secure sign-in
          </li>
        </ul>

        <p className="footer-note">
          © 2026 {BRAND.name}. A student project for a web development course, not a real company.
        </p>
      </div>
    </footer>
  );
}
