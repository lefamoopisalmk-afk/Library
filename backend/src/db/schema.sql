-- Brew & Bind database schema (PostgreSQL). Safe to run more than once.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  membership_id TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'librarian', 'member')),
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  author     TEXT NOT NULL,
  genre      TEXT NOT NULL,
  isbn       TEXT NOT NULL UNIQUE,
  quantity   INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every stock movement. book_id and user_id are kept as references, but the
-- title and name are copied in so the history still reads well after a
-- book or a user is deleted.
CREATE TABLE IF NOT EXISTS transactions (
  id             SERIAL PRIMARY KEY,
  book_id        INTEGER REFERENCES books(id) ON DELETE SET NULL,
  book_title     TEXT NOT NULL,
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name      TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('stock_in', 'borrow', 'return')),
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  quantity_after INTEGER NOT NULL CHECK (quantity_after >= 0),
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_book_id ON transactions (book_id);
CREATE INDEX IF NOT EXISTS idx_books_quantity ON books (quantity);

-- Added for cover images: the public path of the uploaded cover file.
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover TEXT;

-- Loans: a borrow can name the member who took the books, and is marked
-- returned when its return is recorded (the return points back via loan_id).
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS borrower_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS borrower_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS loan_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_transactions_open_loans ON transactions (borrower_id) WHERE type = 'borrow' AND returned_at IS NULL;

-- Encrypted copy of the password so its owner can view it on the profile page.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_secret TEXT;

-- Cover images, stored in the database so they survive redeploys.
CREATE TABLE IF NOT EXISTS covers (
  name       TEXT PRIMARY KEY,
  mime       TEXT NOT NULL,
  data       BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
