import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useReveal } from '../hooks/useReveal.js';
import { api } from '../lib/api.js';
import { BRAND, PHOTOS } from '../lib/brand.js';
import Banner from '../components/Banner.jsx';
import BookCard from '../components/BookCard.jsx';
import BottomNav from '../components/BottomNav.jsx';
import Button from '../components/Button.jsx';
import CategoryRow from '../components/CategoryRow.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  ArrowRightIcon,
  ArrowsIcon,
  BookIcon,
  ClockIcon,
  GridIcon,
  HomeIcon,
  LeafIcon,
  OpenBookIcon,
  SearchIcon,
  SlidersIcon,
  StackIcon,
  UserIcon,
  UsersIcon,
} from '../components/Icons.jsx';
import AuthPanel from '../components/AuthPanel.jsx';
import ProfileMenu from '../components/ProfileMenu.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import SiteHeader from '../components/SiteHeader.jsx';
import { Spinner } from '../components/Spinner.jsx';

const GENRE_ICONS = {
  Fiction: OpenBookIcon,
  Classic: BookIcon,
  Fantasy: LeafIcon,
  Technology: GridIcon,
  History: ClockIcon,
  Romance: UsersIcon,
};

const BADGES = ['Bestseller', "Librarian's pick", 'Popular'];

export default function Landing() {
  const { user, logout, canEdit } = useAuth();
  const [authMode, setAuthMode] = useState('signin');
  const openAuth = (mode) => () => setAuthMode(mode);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const q = useDebounce(search.trim(), 250);

  const shelf = useAsync(() => {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (genre) qs.set('genre', genre);
    const s = qs.toString();
    return api(`/public/shelf${s ? `?${s}` : ''}`);
  }, [q, genre]);

  const steps = useReveal();
  const signin = useReveal();

  const totals = shelf.data?.totals;
  const genres = shelf.data?.genres || [];
  const allBooks = shelf.data?.books || [];
  const books = inStockOnly ? allBooks.filter((b) => b.quantity > 0) : allBooks;
  const filtered = Boolean(q || genre || inStockOnly);

  const appLink = (path) => (user ? { to: path } : { href: '#signin' });

  const slides = [
    {
      asHeading: true,
      kicker: `Welcome to ${BRAND.name}`,
      lines: ['Find your', 'next chapter.'],
      text: 'A warm corner for good books. Every copy counted, every loan on record.',
      image: PHOTOS.cozyReading,
      cta: user ? { label: 'Open the app', to: '/app' } : { label: 'Join the library', to: '/signup' },
    },
    {
      kicker: 'Never run out',
      lines: ['Count it in, lend it out,', 'bring it back.'],
      text: 'Stock arriving, copies borrowed, copies returned. One tap each.',
      image: PHOTOS.coffeeBooks,
      cta: user ? { label: 'Record stock', to: '/app/transactions' } : { label: 'Sign in', href: '#signin' },
    },
    {
      kicker: 'Borrow with ease',
      lines: ['Pick a book,', 'take it home.'],
      text: 'Browse the shelf, then borrow at the desk. Every loan is on record.',
      image: PHOTOS.cozyReading,
      cta: user ? { label: 'See the dashboard', to: '/app' } : { label: 'Sign in', href: '#signin' },
    },
  ];

  const categories = [
    { key: 'all', label: 'All Books', Icon: StackIcon, active: !genre, onClick: () => setGenre('') },
    ...genres.slice(0, 5).map((g) => ({
      key: g,
      label: g,
      Icon: GENRE_ICONS[g] || BookIcon,
      active: genre === g,
      onClick: () => setGenre(genre === g ? '' : g),
    })),
  ];

  return (
    <div className="landing" id="top">
      <SiteHeader
        links={[
          { label: 'The Shelf', href: '#shelf' },
          { label: 'How it works', href: '#how' },
          ...(user
            ? [{ label: 'Dashboard', to: '/app', end: true }]
            : [
                { label: 'Sign in', href: '#signin', onClick: openAuth('signin') },
                { label: 'Create account', href: '#signin', onClick: openAuth('register') },
              ]),
        ]}
        right={
          <>
            {user ? (
              <ProfileMenu showAppLink />
            ) : (
              <a href="#signin" className="icon-btn" aria-label="Sign in" onClick={openAuth('signin')}>
                <UserIcon />
              </a>
            )}
            {user ? (
              <Link to="/app" className="btn btn-primary btn-sm header-cta">
                Open app
              </Link>
            ) : (
              <a href="#signin" className="btn btn-primary btn-sm header-cta" onClick={openAuth('signin')}>
                Sign in
              </a>
            )}
          </>
        }
      />

      <main className="container landing-main">
        <div className="searchbar">
          <label className="search-pill">
            <SearchIcon />
            <input
              type="search"
              placeholder="Search for books, authors, genres..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search the shelf"
            />
          </label>
          <button
            type="button"
            className={`filter-btn${inStockOnly ? ' is-active' : ''}`}
            onClick={() => setInStockOnly((v) => !v)}
            aria-pressed={inStockOnly}
            title={inStockOnly ? 'Showing books in stock only' : 'Show books in stock only'}
          >
            <SlidersIcon />
            <span className="visually-hidden">In stock only</span>
          </button>
        </div>

        <Banner slides={slides} />

        {genres.length ? <CategoryRow items={categories} label="Genres" /> : null}

        <section id="shelf" className="section-block">
          <div className="section-head">
            <h2>{filtered ? 'On the Shelf' : 'Popular Books'}</h2>
            {user ? (
              <Link to="/app/books" className="view-all">
                View All <ArrowRightIcon />
              </Link>
            ) : (
              <a href="#signin" className="view-all">
                View All <ArrowRightIcon />
              </a>
            )}
          </div>
          {inStockOnly ? <p className="muted section-note">Showing titles with at least one copy in stock.</p> : null}

          {shelf.loading && !shelf.data ? <Spinner label="Loading the shelf" /> : null}
          {shelf.error ? (
            <p className="note note-error">The shelf could not be loaded. Is the API running?</p>
          ) : null}
          {shelf.data && books.length === 0 ? (
            filtered ? (
              <EmptyState title="No matches" text="Try another search or pick a different genre." />
            ) : (
              <EmptyState title="The shelf is empty for now" text="New books will appear here as soon as the library adds them." />
            )
          ) : null}

          {books.length ? (
            <div className="card-grid">
              {books.map((b, i) => (
                <BookCard
                  key={b.id}
                  book={b}
                  badge={!filtered && i < BADGES.length ? BADGES[i] : null}
                  showStockAlerts={canEdit}
                  action={
                    user && !canEdit
                      ? null
                      : {
                          label: b.quantity > 0 ? `Borrow ${b.title}` : `Restock ${b.title}`,
                          ...appLink(`/app/transactions?book=${b.id}&type=${b.quantity > 0 ? 'borrow' : 'stock_in'}`),
                        }
                  }
                />
              ))}
            </div>
          ) : null}
        </section>

        <Banner
          compact
          tone="dark"
          image={PHOTOS.coffeeBooks}
          slides={[
            {
              kicker: 'This week on the shelf',
              // Low-stock news is for staff only; everyone else sees the shelf.
              lines: canEdit
                ? totals && totals.titles === 0
                  ? ['A fresh shelf,', 'ready to fill']
                  : totals && totals.lowStock
                    ? [`${totals.lowStock} ${totals.lowStock === 1 ? 'title' : 'titles'}`, 'running low']
                    : ['Every title', 'well stocked']
                : totals && totals.titles > 0
                  ? [`${totals.titles} titles`, 'ready to borrow']
                  : ['New books', 'coming soon'],
              cta: canEdit
                ? totals && totals.titles === 0
                  ? { label: 'Add the first book', to: '/app/books' }
                  : { label: 'Restock now', to: '/app/transactions?type=stock_in' }
                : user
                  ? { label: 'Browse the shelf', to: '/app/books' }
                  : { label: 'Join the library', to: '/signup' },
            },
          ]}
        />

        <section id="how" className="section-block">
          <div className="section-head">
            <h2>How It Works</h2>
          </div>
          <div className="steps" ref={steps}>
            {[
              { n: '01', t: 'Sign in', d: 'Use your membership ID. Your role decides what you can change.', Icon: UserIcon },
              { n: '02', t: 'Add your books', d: 'Title, author, genre, ISBN and how many copies you hold.', Icon: BookIcon },
              { n: '03', t: 'Record every move', d: 'Stock in, copies out, copies back. Every move is logged.', Icon: ArrowsIcon },
            ].map((s) => (
              <div className="step" key={s.n} data-reveal>
                <span className="step-icon">
                  <s.Icon />
                </span>
                <span className="step-num">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="signin" className="section-block signin" ref={signin}>
          <div className="signin-copy" data-reveal>
            <p className="script-line">{authMode === 'register' ? 'Join the library' : 'Welcome back'}</p>
            <h2 className="serif-caps">
              Your shelf <span className="is-gold">is waiting.</span>
            </h2>
            <p className="muted">
              New here? Create a free member account in a minute. Already have an account? Sign in with your
              membership ID. Library staff choose Staff and add the staff code.
              {totals ? ` Right now there are ${totals.titles} titles and ${totals.copies} copies on the shelf.` : ''}
            </p>
            <div className="signin-photo">
              <img src={PHOTOS.libraryStack} alt="A stack of books in front of library shelves" loading="lazy" />
            </div>
          </div>
          <div className="signin-card" data-reveal>
            {user ? (
              <div className="signed-in">
                <h3>Signed in as {user.name}</h3>
                <p className="muted">You are a {user.role}. The app is one tap away.</p>
                <Link to="/app" className="btn btn-primary btn-lg">
                  Open the app <ArrowRightIcon />
                </Link>
                <Button variant="ghost" size="sm" type="button" onClick={logout}>
                  Sign out
                </Button>
              </div>
            ) : (
              <AuthPanel mode={authMode} onModeChange={setAuthMode} idPrefix="landing" />
            )}
          </div>
        </section>
      </main>

      <SiteFooter
        links={[
          { label: 'The Shelf', href: '#shelf' },
          { label: 'How it works', href: '#how' },
          ...(user
            ? [{ label: 'Dashboard', to: '/app' }]
            : [
                { label: 'Sign in', href: '#signin', onClick: openAuth('signin') },
                { label: 'Create account', href: '#signin', onClick: openAuth('register') },
              ]),
        ]}
      />

      <BottomNav
        items={[
          { key: 'home', label: 'Home', Icon: HomeIcon, href: '#top', active: true },
          { key: 'shelf', label: 'Shelf', Icon: BookIcon, href: '#shelf' },
          { key: 'how', label: 'How', Icon: ArrowsIcon, href: '#how' },
          user
            ? { key: 'me', label: 'Account', Icon: UserIcon, to: '/app' }
            : { key: 'me', label: 'Account', Icon: UserIcon, href: '#signin' },
        ]}
        center={user ? { label: 'Open app', Icon: OpenBookIcon, to: '/app' } : { label: 'Sign in', Icon: OpenBookIcon, href: '#signin' }}
      />
    </div>
  );
}
