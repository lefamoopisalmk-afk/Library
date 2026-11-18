import { Link } from 'react-router-dom';
import { UserIcon } from './Icons.jsx';
import SiteFooter from './SiteFooter.jsx';
import SiteHeader from './SiteHeader.jsx';

const LINKS = [
  { label: 'Home', to: '/', end: true },
  { label: 'Sign in', to: '/login' },
  { label: 'Create account', to: '/signup' },
];

// Header and footer for the pages a signed-out visitor sees outside the
// front page (sign in, create account, page not found).
export default function PublicChrome({ children }) {
  return (
    <div className="shell">
      <SiteHeader
        links={LINKS}
        right={
          <Link to="/login" className="icon-btn" aria-label="Sign in">
            <UserIcon />
          </Link>
        }
      />
      {children}
      <SiteFooter links={LINKS} />
    </div>
  );
}
