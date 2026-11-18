import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PHOTOS } from '../lib/brand.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { LOW_STOCK_LIMIT, pluralize } from '../lib/format.js';
import { StockBadge } from '../components/Badge.jsx';
import ActivityList from '../components/ActivityList.jsx';
import LoanDialog from '../components/LoanDialog.jsx';
import Banner from '../components/Banner.jsx';
import BookCard from '../components/BookCard.jsx';
import BookCover from '../components/BookCover.jsx';
import CategoryRow from '../components/CategoryRow.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  AlertIcon,
  ArrowRightIcon,
  InboxInIcon,
  OutIcon,
  ReturnIcon,
  StackIcon,
  UsersIcon,
} from '../components/Icons.jsx';
import { ErrorNote, Spinner } from '../components/Spinner.jsx';
import StatTile from '../components/StatTile.jsx';

const VIEW_KEY = 'shelfwise.dashboard-view';

function readView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'cards';
  } catch {
    return 'cards';
  }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { request, canEdit, isAdmin, user } = useAuth();
  const summary = useAsync(() => request('/dashboard'), [request]);
  const books = useAsync(() => request('/books'), [request]);
  const myLoans = useAsync(() => request('/transactions/my-loans'), [request]);
  const [view, setView] = useState(readView);
  const [selected, setSelected] = useState(null);

  // After a return, refresh everything the return touched.
  const afterReturn = () => {
    summary.reload();
    books.reload();
    myLoans.reload();
  };

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      // Remembering the view is a convenience only.
    }
  }, [view]);

  const totals = summary.data?.totals;
  const lowStock = summary.data?.lowStockBooks || [];
  const recent = summary.data?.recentTransactions || [];
  const list = books.data?.books || [];
  const firstName = user.name.split(' ')[0];

  const shortcuts = [
    { key: 'all', label: 'All Books', Icon: StackIcon, to: '/app/books', active: true },
    ...(canEdit
      ? [
          { key: 'low', label: 'Low Stock', Icon: AlertIcon, to: '/app/books?low=1' },
          { key: 'in', label: 'Add Stock', Icon: InboxInIcon, to: '/app/transactions?type=stock_in' },
          { key: 'out', label: 'Borrow', Icon: OutIcon, to: '/app/transactions?type=borrow' },
          { key: 'back', label: 'Return', Icon: ReturnIcon, to: '/app/transactions?type=return' },
        ]
      : []),
    ...(isAdmin ? [{ key: 'users', label: 'Users', Icon: UsersIcon, to: '/app/users' }] : []),
  ];

  return (
    <div className="page">
      <Banner
        image={PHOTOS.coffeeBooks}
        slides={[
          {
            asHeading: true,
            kicker: `${greeting()}, ${firstName}`,
            lines: canEdit ? ['Your shelf, your stock,', 'all in order.'] : ['Find your', 'next good read.'],
            text: totals
              ? `${pluralize(totals.titles, 'title')} and ${pluralize(totals.copies, 'copy', 'copies')} on the shelf right now.`
              : 'Counting the shelf...',
            cta: canEdit ? { label: 'Record stock', to: '/app/transactions' } : { label: 'Browse books', to: '/app/books' },
          },
        ]}
      />

      <CategoryRow items={shortcuts} label="Shortcuts" />

      {!canEdit ? (
        <section className="panel" aria-label="Your borrowed books">
          <div className="panel-head">
            <div>
              <h2>Your borrowed books</h2>
              <p className="muted">Books on loan in your name. Open one to return it.</p>
            </div>
          </div>
          {myLoans.loading && !myLoans.data ? <Spinner label="Loading your loans" /> : null}
          {myLoans.data && myLoans.data.loans.length === 0 ? (
            <EmptyState title="Nothing on loan" text="Books you borrow at the desk will show up here." />
          ) : null}
          {myLoans.data && myLoans.data.loans.length > 0 ? (
            <ActivityList items={myLoans.data.loans} staff={false} onSelect={setSelected} />
          ) : null}
        </section>
      ) : null}

      <ErrorNote error={summary.error} onRetry={summary.reload} />

      <section className="stats" aria-label="Totals">
        <StatTile label="Titles" value={totals ? totals.titles : '…'} note="in the catalogue" />
        <StatTile label="Copies in stock" value={totals ? totals.copies : '…'} note="across all titles" />
        {canEdit ? (
        <StatTile
          label="Low stock"
          value={totals ? totals.lowStock : '…'}
          note={
            totals && totals.outOfStock
              ? `${pluralize(totals.outOfStock, 'title')} out of stock`
              : `fewer than ${LOW_STOCK_LIMIT} copies`
          }
          tone={totals && totals.lowStock > 0 ? 'ember' : undefined}
        />
        ) : null}
        <StatTile
          label="Borrowed this week"
          value={totals ? totals.borrowedThisWeek : '…'}
          note={totals ? `${totals.returnedThisWeek} returned` : ''}
        />
      </section>

      {canEdit && lowStock.length > 0 ? (
        <section className="callout callout-ember" aria-label="Low stock">
          <div className="callout-head">
            <AlertIcon />
            <h2>Running low</h2>
          </div>
          <ul className="chip-list">
            {lowStock.map((b) => (
              <li key={b.id} className="chip chip-ember">
                <span>{b.title}</span>
                <strong>{b.quantity === 0 ? 'none left' : pluralize(b.quantity, 'copy', 'copies')}</strong>
                {canEdit ? (
                  <Link to={`/app/transactions?book=${b.id}&type=stock_in`} className="chip-link">
                    Restock
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Books on the shelf">
        <div className="section-head">
          <h2>On the Shelf</h2>
          <div className="panel-head-actions">
            <div className="segmented" role="group" aria-label="Layout">
              <button type="button" className={view === 'cards' ? 'is-active' : ''} onClick={() => setView('cards')}>
                Cards
              </button>
              <button type="button" className={view === 'table' ? 'is-active' : ''} onClick={() => setView('table')}>
                Table
              </button>
            </div>
            <Link to="/app/books" className="view-all">
              View All <ArrowRightIcon />
            </Link>
          </div>
        </div>
        {canEdit ? (
          <p className="muted section-note">Anything with fewer than {LOW_STOCK_LIMIT} copies is marked in red.</p>
        ) : null}

        <ErrorNote error={books.error} onRetry={books.reload} />
        {books.loading && !books.data ? <Spinner label="Loading books" /> : null}
        {books.data && list.length === 0 ? <EmptyState title="No books yet" text="Add the first title on the Books page." /> : null}

        {list.length > 0 && view === 'cards' ? (
          <div className="card-grid">
            {list.map((b) => (
              <BookCard
                key={b.id}
                book={b}
                badge={b.quantity === 0 ? 'Out of stock' : canEdit && b.lowStock ? 'Low stock' : null}
                showStockAlerts={canEdit}
                action={
                  canEdit
                    ? {
                        label: b.quantity > 0 ? `Lend ${b.title}` : `Restock ${b.title}`,
                        to: `/app/transactions?book=${b.id}&type=${b.quantity > 0 ? 'borrow' : 'stock_in'}`,
                      }
                    : null
                }
              />
            ))}
          </div>
        ) : null}

        {list.length > 0 && view === 'table' ? (
          <div className="panel">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Genre</th>
                    <th>ISBN</th>
                    <th className="num">In stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((b) => (
                    <tr key={b.id} className={canEdit && b.lowStock ? 'row-low' : ''}>
                      <td>
                        <div className="title-cell">
                          <BookCover title={b.title} src={b.cover} size="sm" />
                          <span>
                            <strong>{b.title}</strong>
                            <span className="muted block">{b.author}</span>
                          </span>
                        </div>
                      </td>
                      <td>{b.genre}</td>
                      <td className="mono">{b.isbn}</td>
                      <td className="num">
                        <span className="qty">{b.quantity}</span>
                      </td>
                      <td>
                        <StockBadge quantity={b.quantity} showLow={canEdit} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{canEdit ? 'Recent activity' : 'Recently borrowed and returned'}</h2>
            <p className="muted">{canEdit ? 'The last few stock movements.' : 'What readers have been taking home lately.'}</p>
          </div>
          <Link to="/app/transactions" className="view-all">
            {canEdit ? 'Full history' : 'See all'} <ArrowRightIcon />
          </Link>
        </div>
        {summary.loading && !summary.data ? <Spinner label="Loading activity" /> : null}
        {summary.data && recent.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            text={canEdit ? 'Stock movements will show up here.' : 'Borrowed and returned books will show up here.'}
          />
        ) : null}
        {recent.length > 0 ? <ActivityList items={recent} staff={canEdit} onSelect={setSelected} /> : null}
      </section>
      <LoanDialog entry={selected} onClose={() => setSelected(null)} onReturned={afterReturn} />
    </div>
  );
}
