// The database uses snake_case columns; the React app reads camelCase JSON.

export const BOOK_COLUMNS = 'id, title, author, genre, isbn, quantity, cover, created_at, updated_at';
export const USER_COLUMNS = 'id, name, membership_id, role, created_at';

export function toBook(row) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    genre: row.genre,
    isbn: row.isbn,
    quantity: row.quantity,
    cover: row.cover || null,
    lowStock: row.quantity < 2,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    membershipId: row.membership_id,
    role: row.role,
    createdAt: row.created_at,
  };
}

// A borrow that is still out and whose book is still in the catalogue.
function isOpenLoan(row) {
  return row.type === 'borrow' && !row.returned_at && row.book_id !== null && row.book_id !== undefined;
}

export function toTransaction(row, viewer) {
  return {
    id: row.id,
    bookId: row.book_id,
    bookTitle: row.book_title,
    bookAuthor: row.book_author || null,
    bookIsbn: row.book_isbn || null,
    bookCover: row.book_cover || null,
    userId: row.user_id,
    userName: row.user_name,
    type: row.type,
    quantity: row.quantity,
    quantityAfter: row.quantity_after,
    note: row.note,
    borrowerName: row.borrower_name || null,
    borrowerMembershipId: row.borrower_membership_id || null,
    loanId: row.loan_id || null,
    returnedAt: row.returned_at || null,
    mine: Boolean(viewer && row.borrower_id === viewer.id),
    canReturn: isOpenLoan(row),
    createdAt: row.created_at,
  };
}

// What a member may see of a stock movement: the book and what happened, but
// not stock counts, staff names or notes (notes can name other members).
// Their own loans also carry the number of copies, so they know what to return.
export function toPublicTransaction(row, viewer) {
  const mine = Boolean(viewer && row.borrower_id && row.borrower_id === viewer.id);
  return {
    id: row.id,
    bookId: row.book_id,
    bookTitle: row.book_title,
    bookAuthor: row.book_author || null,
    bookCover: row.book_cover || null,
    type: row.type,
    returnedAt: row.returned_at || null,
    mine,
    canReturn: mine && isOpenLoan(row),
    ...(mine ? { quantity: row.quantity } : {}),
    createdAt: row.created_at,
  };
}

// Members only see lending activity, never stock arriving.
export const MEMBER_VISIBLE_TYPES = ['borrow', 'return'];

export function isStaff(user) {
  return user?.role === 'admin' || user?.role === 'librarian';
}
