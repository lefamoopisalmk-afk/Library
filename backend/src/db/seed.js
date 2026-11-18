import bcrypt from 'bcryptjs';
import { saveLibraryCover } from '../lib/covers.js';
import { seal } from '../lib/secret.js';

// Demo accounts, created the first time the database is empty.
// Passwords are hashed before they reach the database.
export const demoUsers = [
  { name: 'Thomas Moopisa', membershipId: 'ADM-001', role: 'admin', password: 'admin123' },
  { name: 'Sam Reyes', membershipId: 'LIB-001', role: 'librarian', password: 'library123' },
  { name: 'Priya Nair', membershipId: 'MEM-001', role: 'member', password: 'member123' },
];

// The starting shelf. Each cover comes from the cover-library folder at the
// project root and is stored in the database with the book.
export const demoBooks = [
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', isbn: '9780061120084', quantity: 4, cover: 'to-kill-a-mockingbird.webp' },
  { title: '1984', author: 'George Orwell', genre: 'Dystopian', isbn: '9780451524935', quantity: 1, cover: '1984.png' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Classic', isbn: '9780743273565', quantity: 3, cover: 'the-great-gatsby.png' },
  { title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Romance', isbn: '9780141439518', quantity: 5, cover: 'pride-and-prejudice.png' },
  { title: 'The Hobbit', author: 'J. R. R. Tolkien', genre: 'Fantasy', isbn: '9780547928227', quantity: 0, cover: 'the-hobbit.png' },
  { title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', isbn: '9780062315007', quantity: 2, cover: 'the-alchemist.webp' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', isbn: '9780062316097', quantity: 6, cover: 'sapiens.png' },
  { title: 'Clean Code', author: 'Robert C. Martin', genre: 'Technology', isbn: '9780132350884', quantity: 1, cover: 'clean-code.png' },
  { title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction', isbn: '9780441172719', quantity: 3, cover: 'dune.webp' },
  { title: 'Educated', author: 'Tara Westover', genre: 'Memoir', isbn: '9780399590504', quantity: 2, cover: 'educated.webp' },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt and David Thomas', genre: 'Technology', isbn: '9780135957059', quantity: 2, cover: 'the-pragmatic-programmer.png' },
  { title: 'Things Fall Apart', author: 'Chinua Achebe', genre: 'Classic', isbn: '9780385474542', quantity: 4, cover: 'things-fall-apart.webp' },
];

export async function seedUsers(client) {
  for (const u of demoUsers) {
    const hash = await bcrypt.hash(u.password, 10);
    await client.query('INSERT INTO users (name, membership_id, role, password_hash, password_secret) VALUES ($1, $2, $3, $4, $5)', [
      u.name,
      u.membershipId,
      u.role,
      hash,
      seal(u.password),
    ]);
  }
}

// Adds the starting books (skipping any ISBN already on the shelf) with their
// covers and a little history: every title arrived as stock, and the low ones
// have been borrowed since.
export async function seedBooks(client) {
  const { rows: staff } = await client.query("SELECT id, name FROM users WHERE membership_id = 'LIB-001'");
  const by = staff[0] || { id: null, name: 'Library' };
  let added = 0;

  for (const b of demoBooks) {
    const exists = await client.query('SELECT 1 FROM books WHERE isbn = $1', [b.isbn]);
    if (exists.rows.length) continue;

    const cover = await saveLibraryCover(b.cover, client);
    const { rows } = await client.query(
      'INSERT INTO books (title, author, genre, isbn, quantity, cover) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [b.title, b.author, b.genre, b.isbn, b.quantity, cover],
    );
    const bookId = rows[0].id;
    const arrived = b.quantity + (b.quantity < 3 ? 2 : 0);

    await client.query(
      `INSERT INTO transactions (book_id, book_title, user_id, user_name, type, quantity, quantity_after, note, created_at)
       VALUES ($1, $2, $3, $4, 'stock_in', $5, $5, 'Initial stock', now() - interval '12 days')`,
      [bookId, b.title, by.id, by.name, arrived],
    );
    if (arrived !== b.quantity) {
      await client.query(
        `INSERT INTO transactions (book_id, book_title, user_id, user_name, type, quantity, quantity_after, note, created_at)
         VALUES ($1, $2, $3, $4, 'borrow', 2, $5, 'Borrowed by a member', now() - interval '3 days')`,
        [bookId, b.title, by.id, by.name, b.quantity],
      );
    }
    added += 1;
  }
  return added;
}

export async function seed(client) {
  await seedUsers(client);
  await seedBooks(client);
}
