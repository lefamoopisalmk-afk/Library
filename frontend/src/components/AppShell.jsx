import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import BottomNav from './BottomNav.jsx';
import { ArrowsIcon, BookIcon, GlobeIcon, HomeIcon, OpenBookIcon, UsersIcon } from './Icons.jsx';
import ProfileMenu from './ProfileMenu.jsx';
import SiteFooter from './SiteFooter.jsx';
import SiteHeader from './SiteHeader.jsx';

// The signed-in layout: the same glass header and footer as the front page,
// the current page in between, and the phone bottom bar.
export default function AppShell() {
  const { isAdmin, canEdit } = useAuth();

  const links = [
    { label: 'Dashboard', to: '/app', end: true },
    { label: 'Books', to: '/app/books' },
    { label: canEdit ? 'Transactions' : 'Activity', to: '/app/transactions' },
    ...(isAdmin ? [{ label: 'Users', to: '/app/users' }] : []),
  ];

  return (
    <div className="shell">
      <SiteHeader
        homeTo="/app"
        links={links}
        right={<ProfileMenu />}
      />

      <main className="main container">
        <Outlet />
      </main>

      <SiteFooter
        links={[
          { label: 'Front page', to: '/' },
          ...links.map(({ label, to }) => ({ label, to })),
        ]}
      />

      <BottomNav
        items={[
          { key: 'home', to: '/app', end: true, label: 'Home', Icon: HomeIcon },
          canEdit
            ? { key: 'books', to: '/app/books', label: 'Books', Icon: BookIcon }
            : { key: 'stock', to: '/app/transactions', label: 'History', Icon: ArrowsIcon },
          ...(isAdmin ? [{ key: 'users', to: '/app/users', label: 'Users', Icon: UsersIcon }] : []),
          { key: 'site', to: '/', end: true, label: 'Front page', Icon: GlobeIcon },
        ]}
        center={
          canEdit
            ? { label: 'Record', Icon: ArrowsIcon, to: '/app/transactions' }
            : { label: 'Shelf', Icon: OpenBookIcon, to: '/app/books' }
        }
      />
    </div>
  );
}
