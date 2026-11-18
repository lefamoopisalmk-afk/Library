// API smoke test. Run with the API on http://localhost:4000:  npm run test:api
// It signs in with the demo accounts, creates its own test books and users,
// exercises every route, then removes everything it created (including the
// history rows), so the library is left exactly as it was.
import 'dotenv/config';
import pg from 'pg';

const BASE = 'http://localhost:4000';
const API = BASE + '/api';
const PREFIX = 'API Test ';
const STAFF = process.env.STAFF_SIGNIN_CODE || process.env.LIBRARIAN_SIGNUP_CODE || 'SHELF-STAFF';
let pass = 0;
let fail = 0;

// 1 x 1 pixel PNG, small enough to send as a test cover.
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function call(method, path, { body, token } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const fileStatus = (p) => fetch(BASE + p).then((r) => r.status);

function check(name, ok, extra = '') {
  if (ok) {
    pass += 1;
    console.log('  ok   ' + name + (extra ? '  [' + extra + ']' : ''));
  } else {
    fail += 1;
    console.log('  FAIL ' + name + '  ' + extra);
  }
}

async function cleanup() {
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/library' });
  await db.connect();
  await db.query('DELETE FROM transactions WHERE book_title LIKE $1', [PREFIX + '%']);
  await db.query('DELETE FROM books WHERE title LIKE $1', [PREFIX + '%']);
  await db.query("DELETE FROM users WHERE membership_id LIKE 'TST-%' OR name LIKE $1", [PREFIX + '%']);
  await db.end();
}

try {
  const health = await call('GET', '/health');
  check('health', health.status === 200 && health.data.ok);

  const bad = await call('POST', '/auth/login', { body: { membershipId: 'ADM-001', password: 'wrong' } });
  check('login rejects wrong password', bad.status === 401, bad.data.error);
  check('books need a token', (await call('GET', '/books')).status === 401);

  const noCode = await call('POST', '/auth/login', { body: { membershipId: 'LIB-001', password: 'library123' } });
  check('staff sign-in needs the staff code', noCode.status === 403, noCode.data.error);
  const wrongCode = await call('POST', '/auth/login', { body: { membershipId: 'LIB-001', password: 'library123', staffCode: 'nope' } });
  check('wrong staff code rejected', wrongCode.status === 403, wrongCode.data.error);
  const admin = await call('POST', '/auth/login', { body: { membershipId: 'adm-001', password: 'admin123', staffCode: STAFF } });
  check('admin login with staff code (case-insensitive id)', admin.status === 200 && admin.data.user.role === 'admin');
  const A = admin.data.token;
  const L = (await call('POST', '/auth/login', { body: { membershipId: 'LIB-001', password: 'library123', staffCode: STAFF } })).data.token;
  const M = (await call('POST', '/auth/login', { body: { membershipId: 'MEM-001', password: 'member123' } })).data.token;
  check('librarian and member login', Boolean(L && M));
  check('me', (await call('GET', '/auth/me', { token: A })).data.user?.membershipId === 'ADM-001');

  const before = (await call('GET', '/dashboard', { token: M })).data.totals;

  // Books, with covers
  check('member cannot add books', (await call('POST', '/books', { token: M, body: {} })).status === 403);
  const invalid = await call('POST', '/books', { token: L, body: { title: '', author: 'Y', genre: 'Z', isbn: '12', quantity: -1 } });
  check('validation message', invalid.status === 400, invalid.data.error);
  const badCover = await call('POST', '/books', {
    token: L,
    body: { title: PREFIX + 'Bad', author: 'Y', genre: 'Z', isbn: '9799999000009', quantity: 1, cover: 'data:text/plain;base64,aGk=' },
  });
  check('non-image cover rejected', badCover.status === 400, badCover.data.error);

  const added = await call('POST', '/books', {
    token: L,
    body: { title: PREFIX + 'Driven Development', author: 'Kent Beck', genre: 'Technology', isbn: '979-9-9990-0001-6', quantity: 3, cover: PNG },
  });
  const book = added.data.book || {};
  check('add book with cover (isbn normalised)', added.status === 201 && book.isbn === '9799999000016' && book.quantity === 3);
  check('cover saved and served', Boolean(book.cover) && (await fileStatus(book.cover)) === 200, book.cover);
  const bookId = book.id;

  const plain = await call('POST', '/books', {
    token: L,
    body: { title: PREFIX + 'No Cover', author: 'Someone', genre: 'Fiction', isbn: '9799999000023', quantity: 1 },
  });
  check('add book without cover', plain.status === 201 && plain.data.book.cover === null);

  const dup = await call('POST', '/books', { token: L, body: { title: PREFIX + 'Dup', author: 'Y', genre: 'Z', isbn: '9799999000016', quantity: 1 } });
  check('duplicate isbn -> 409', dup.status === 409, dup.data.error);

  const search = await call('GET', '/books?q=' + encodeURIComponent(PREFIX + 'Driven'), { token: M });
  check('books search', search.data.books.length === 1 && search.data.books[0].cover === book.cover);
  const all = (await call('GET', '/books', { token: M })).data.books;
  const low = (await call('GET', '/books?low=1', { token: M })).data.books;
  check('books low filter', low.every((b) => b.quantity < 2) && low.length === all.filter((b) => b.quantity < 2).length);

  const renamed = await call('PUT', '/books/' + bookId, {
    token: L,
    body: { title: PREFIX + 'Driven Development 2e', author: 'Kent Beck', genre: 'Technology', isbn: '9799999000016' },
  });
  check('update keeps the cover', renamed.status === 200 && renamed.data.book.cover === book.cover);
  const swapped = await call('PUT', '/books/' + bookId, {
    token: L,
    body: { title: PREFIX + 'Driven Development 2e', author: 'Kent Beck', genre: 'Technology', isbn: '9799999000016', cover: PNG },
  });
  const newCover = swapped.data.book?.cover;
  check(
    'replace cover removes the old file',
    newCover && newCover !== book.cover && (await fileStatus(newCover)) === 200 && (await fileStatus(book.cover)) === 404,
  );
  const removed = await call('PUT', '/books/' + bookId, {
    token: L,
    body: { title: PREFIX + 'Driven Development 2e', author: 'Kent Beck', genre: 'Technology', isbn: '9799999000016', removeCover: true },
  });
  check('remove cover', removed.data.book?.cover === null && (await fileStatus(newCover)) === 404);
  await call('PUT', '/books/' + bookId, {
    token: L,
    body: { title: PREFIX + 'Driven Development 2e', author: 'Kent Beck', genre: 'Technology', isbn: '9799999000016', cover: PNG },
  });

  // Stock movements
  const over = await call('POST', '/transactions', { token: L, body: { bookId, type: 'borrow', quantity: 5 } });
  check('borrow more than stock -> 400', over.status === 400, over.data.error);
  const stockIn = await call('POST', '/transactions', { token: L, body: { bookId, type: 'stock_in', quantity: 2, note: 'API test delivery' } });
  check('add stock', stockIn.status === 201 && stockIn.data.book.quantity === 5);
  const borrow = await call('POST', '/transactions', { token: A, body: { bookId, type: 'borrow', quantity: 4 } });
  check('borrow', borrow.status === 201 && borrow.data.book.quantity === 1 && borrow.data.book.lowStock === true);
  const ret = await call('POST', '/transactions', { token: L, body: { bookId, type: 'return', quantity: 1 } });
  check('return', ret.status === 201 && ret.data.book.quantity === 2);
  check('member cannot record movements', (await call('POST', '/transactions', { token: M, body: { bookId, type: 'borrow', quantity: 1 } })).status === 403);
  const hist = await call('GET', '/transactions?bookId=' + bookId, { token: L });
  check('history for book', hist.data.transactions.length === 4 && hist.data.transactions[0].type === 'return');
  const histType = await call('GET', '/transactions?type=borrow', { token: M });
  check('history type filter', histType.data.transactions.every((t) => t.type === 'borrow') && histType.data.transactions.length > 0);
  const histQ = await call('GET', '/transactions?q=' + encodeURIComponent('API test delivery'), { token: L });
  check('history search', histQ.data.transactions.length === 1);
  check('staff history includes covers', hist.data.transactions.every((t) => 'bookCover' in t) && Boolean(hist.data.transactions[0].bookCover));

  // What members may see of the history
  const memberHist = (await call('GET', '/transactions?bookId=' + bookId, { token: M })).data.transactions;
  check(
    'member sees borrows and returns only',
    memberHist.length === 2 && memberHist.every((t) => t.type === 'borrow' || t.type === 'return'),
    memberHist.map((t) => t.type).join(','),
  );
  check(
    'member history has no counts, staff names or notes',
    memberHist.every((t) => !('quantityAfter' in t) && !('userName' in t) && !('note' in t) && !('quantity' in t)),
  );
  check('member cannot filter stock arrivals', (await call('GET', '/transactions?type=stock_in', { token: M })).status === 400);
  const memberDash = (await call('GET', '/dashboard', { token: M })).data;
  check(
    'member dashboard hides low stock and stock arrivals',
    memberDash.totals.lowStock === null &&
      memberDash.lowStockBooks.length === 0 &&
      memberDash.recentTransactions.every((t) => t.type !== 'stock_in' && !('userName' in t)),
  );

  const dash = await call('GET', '/dashboard', { token: L });
  check('dashboard counts the new titles', dash.data.totals.titles === before.titles + 2);
  check(
    'dashboard low stock list',
    dash.data.lowStockBooks.length === dash.data.totals.lowStock && dash.data.lowStockBooks.every((b) => b.quantity < 2),
  );

  // Public shelf, no sign-in
  const shelf = await fetch(API + '/public/shelf?q=' + encodeURIComponent(PREFIX)).then((r) => r.json());
  check(
    'public shelf (no sign-in) with covers, no isbn',
    shelf.books.length === 2 && shelf.books.some((b) => b.cover) && !('isbn' in shelf.books[0]),
  );

  // Self sign-up
  const regMember = await call('POST', '/auth/register', { body: { name: PREFIX + 'Reader', password: 'reader12' } });
  const memberId = regMember.data.user?.membershipId || '';
  check('sign up as member', regMember.status === 201 && regMember.data.user.role === 'member' && /^MEM-\d{3,}$/.test(memberId), memberId);
  const memberLogin = await call('POST', '/auth/login', { body: { membershipId: memberId, password: 'reader12' } });
  check('new member can sign in', memberLogin.status === 200 && memberLogin.data.user.name === PREFIX + 'Reader');
  check('new member cannot add books', (await call('POST', '/books', { token: memberLogin.data.token, body: {} })).status === 403);
  const regShort = await call('POST', '/auth/register', { body: { name: PREFIX + 'Short', password: '12' } });
  check('sign up rejects short password', regShort.status === 400, regShort.data.error);
  const regAdmin = await call('POST', '/auth/register', { body: { name: PREFIX + 'Boss', password: 'secret12', role: 'admin' } });
  check('cannot sign up as admin', regAdmin.status === 400, regAdmin.data.error);
  const regLib = await call('POST', '/auth/register', {
    body: { name: PREFIX + 'Staff', password: 'secret12', role: 'librarian', staffCode: STAFF },
  });
  check('cannot sign up as librarian (members only)', regLib.status === 400, regLib.data.error);
  const second = await call('POST', '/auth/register', { body: { name: PREFIX + 'Reader Two', password: 'reader12' } });
  check('IDs count up', second.data.user?.membershipId !== memberId, second.data.user?.membershipId);

  // Profile: view and change your own password
  const RT = memberLogin.data.token;
  const seen = await call('GET', '/auth/me/password', { token: RT });
  check('member can view their own password', seen.status === 200 && seen.data.password === 'reader12');
  const wrongCurrent = await call('PUT', '/auth/me/password', { token: RT, body: { currentPassword: 'nope', newPassword: 'reader34' } });
  check('change password needs the current one', wrongCurrent.status === 400, wrongCurrent.data.error);
  const tooShort = await call('PUT', '/auth/me/password', { token: RT, body: { currentPassword: 'reader12', newPassword: '12' } });
  check('new password must be long enough', tooShort.status === 400, tooShort.data.error);
  const changed = await call('PUT', '/auth/me/password', { token: RT, body: { currentPassword: 'reader12', newPassword: 'reader34' } });
  check('change password', changed.status === 200);
  const oldPw = await call('POST', '/auth/login', { body: { membershipId: memberId, password: 'reader12' } });
  const newPw = await call('POST', '/auth/login', { body: { membershipId: memberId, password: 'reader34' } });
  check('old password stops working, new one works', oldPw.status === 401 && newPw.status === 200);
  check('profile shows the new password', (await call('GET', '/auth/me/password', { token: RT })).data.password === 'reader34');
  check('viewing a password needs sign-in', (await call('GET', '/auth/me/password')).status === 401);

  // Loans and returns
  const R = memberLogin.data.token;
  const R2 = second.data.token;
  const unknownBorrower = await call('POST', '/transactions', { token: L, body: { bookId, type: 'borrow', quantity: 1, borrowerId: 'MEM-99999' } });
  check('borrow for an unknown member is refused', unknownBorrower.status === 400, unknownBorrower.data.error);
  const loan = await call('POST', '/transactions', { token: L, body: { bookId, type: 'borrow', quantity: 1, borrowerId: memberId.toLowerCase() } });
  const loanTx = loan.data.transaction || {};
  check(
    'borrow in a member name',
    loan.status === 201 && loanTx.borrowerMembershipId === memberId && loanTx.canReturn === true && loanTx.returnedAt === null,
    loanTx.note,
  );
  const stockAfterLoan = loan.data.book?.quantity;
  const myLoans = (await call('GET', '/transactions/my-loans', { token: R })).data.loans || [];
  check('member sees the loan in their account', myLoans.length === 1 && myLoans[0].id === loanTx.id && myLoans[0].canReturn && myLoans[0].quantity === 1);
  check('other members do not see it as theirs', ((await call('GET', '/transactions/my-loans', { token: R2 })).data.loans || []).length === 0);
  const notYours = await call('POST', `/transactions/${loanTx.id}/return`, { token: R2 });
  check('member cannot return someone else\'s loan', notYours.status === 403, notYours.data.error);
  const back = await call('POST', `/transactions/${loanTx.id}/return`, { token: R });
  check(
    'member returns their own loan',
    back.status === 201 && back.data.book.quantity === stockAfterLoan + 1 && back.data.transaction.type === 'return',
  );
  const loanRow = (await call('GET', '/transactions?bookId=' + bookId, { token: L })).data.transactions.find((t) => t.id === loanTx.id);
  check('loan is marked returned', Boolean(loanRow?.returnedAt) && loanRow.canReturn === false);
  const again = await call('POST', `/transactions/${loanTx.id}/return`, { token: L });
  check('cannot return the same loan twice', again.status === 409, again.data.error);
  const deskLoan = await call('POST', '/transactions', { token: L, body: { bookId, type: 'borrow', quantity: 2 } });
  const deskBack = await call('POST', `/transactions/${deskLoan.data.transaction.id}/return`, { token: L });
  check('staff can return any loan', deskBack.status === 201 && deskBack.data.book.quantity === deskLoan.data.book.quantity + 2);
  const notALoan = await call('POST', `/transactions/${deskBack.data.transaction.id}/return`, { token: L });
  check('only borrows can be returned', notALoan.status === 400, notALoan.data.error);

  // Users
  check('librarian cannot list users', (await call('GET', '/users', { token: L })).status === 403);
  check('admin lists users', (await call('GET', '/users', { token: A })).data.users?.length >= 3);
  const newUser = await call('POST', '/users', { token: A, body: { name: 'Test Person', membershipId: 'tst-999', role: 'member', password: 'secret12' } });
  check('add user (id upper-cased)', newUser.status === 201 && newUser.data.user.membershipId === 'TST-999');
  const uid = newUser.data.user?.id;
  const dupUser = await call('POST', '/users', { token: A, body: { name: 'Again', membershipId: 'TST-999', role: 'member', password: 'secret12' } });
  check('duplicate membership id -> 409', dupUser.status === 409, dupUser.data.error);
  const shortPw = await call('POST', '/users', { token: A, body: { name: 'Short', membershipId: 'TST-998', role: 'member', password: '123' } });
  check('short password rejected', shortPw.status === 400, shortPw.data.error);
  const updUser = await call('PUT', '/users/' + uid, { token: A, body: { name: 'Test Person', membershipId: 'TST-999', role: 'librarian', password: 'newpass1' } });
  check('update user role + password', updUser.data.user?.role === 'librarian');
  const newLogin = await call('POST', '/auth/login', { body: { membershipId: 'TST-999', password: 'newpass1', staffCode: STAFF } });
  check('login with new password', newLogin.status === 200);
  const selfDel = await call('DELETE', '/users/' + admin.data.user.id, { token: A });
  check('cannot delete yourself', selfDel.status === 400, selfDel.data.error);
  check('delete user', (await call('DELETE', '/users/' + uid, { token: A })).status === 200);
  check('deleted user token rejected', (await call('GET', '/auth/me', { token: newLogin.data.token })).status === 401);

  // Deleting a book removes its cover file but keeps its history
  const finalCover = (await call('GET', '/books/' + bookId, { token: M })).data.book.cover;
  check('delete book', (await call('DELETE', '/books/' + bookId, { token: L })).status === 200);
  check('cover file removed with the book', (await fileStatus(finalCover)) === 404);
  const histAfter = await call('GET', '/transactions?q=' + encodeURIComponent(PREFIX + 'Driven'), { token: L });
  check('history survives deletion', histAfter.data.transactions.length >= 4 && histAfter.data.transactions.every((t) => t.bookId === null));
  check('deleted book -> 404', (await call('GET', '/books/' + bookId, { token: M })).status === 404);
  await call('DELETE', '/books/' + plain.data.book?.id, { token: L });

  check('unknown route -> 404 json', (await call('GET', '/nope', { token: M })).status === 404);
  const badJson = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' }).then((r) => r.status);
  check('invalid json -> 400', badJson === 400);
} finally {
  await cleanup();
}

console.log('\n' + pass + ' passed, ' + fail + ' failed (test data removed)');
process.exit(fail ? 1 : 0);
