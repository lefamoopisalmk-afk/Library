# Brew & Bind, a library management system

A full-stack web application for running a small library: books, stock levels,
stock movements and user accounts. Built for the WEB 2 assignment.

## Frontend and backend

| Part | Code on GitHub | Live |
| --- | --- | --- |
| **Frontend** (React app) | [`frontend/`](https://github.com/lefamoopisalmk-afk/Library/tree/main/frontend) | https://brew-and-bind.onrender.com |
| **Backend** (Express + PostgreSQL) | [`backend/`](https://github.com/lefamoopisalmk-afk/Library/tree/main/backend) | https://brew-and-bind.onrender.com/api/health |

Each folder has its own README: [frontend/README.md](frontend/README.md) and
[backend/README.md](backend/README.md). In production one Render web service runs
the Express backend, which serves the built React frontend and the API from the same
address. The database is a Render PostgreSQL instance.

| Layer         | Technology                                              |
| ------------- | ------------------------------------------------------- |
| Front end     | React 19 (JSX, components, hooks, React Router)         |
| Styling       | Plain CSS with design tokens                            |
| State         | React hooks (`useState`, `useEffect`, context, custom)  |
| Back end      | Express 5 (Node.js)                                     |
| Database      | PostgreSQL (via the `pg` driver)                        |
| Communication | Fetch API: React calls Express, Express talks to the DB |

## Assignment requirements checklist

Every item below was checked in the running app (signed in as the admin) on 18 Nov
2026, and is also covered by the API smoke test (`npm run test:api`, 69 checks).
Staff pages need a staff sign-in: choose **Staff** and use `ADM-001` / `admin123`
or `LIB-001` / `library123` with the staff code `SHELF-STAFF`.

| Requirement | Where to find it |
| --- | --- |
| **1. Book management** | |
| Add new books with title, author, genre, ISBN, initial quantity | Books page, "Add a book" form (also takes a cover image) |
| Update existing book details | Books page, **Update** button on each row |
| Delete books no longer available | Books page, **Delete** button on each row (asks to confirm) |
| **2. Availability management** | |
| Track the quantity of each book in stock | "In stock" column and counts on the Dashboard, Books and Transactions pages |
| Add stock when new books arrive | Transactions page, **Add stock** in "Record a movement" |
| Deduct stock when books are borrowed | Transactions page, **Borrow** in "Record a movement" (cannot go below zero) |
| **3. User management** | |
| Login form for users | Sign-in form at `/login` and at the bottom of the front page |
| Add new users (name, membership ID, role) | Users page (admin), "Add a user" form |
| Update user details | Users page, **Update** button on each row |
| Delete users | Users page, **Delete** button on each row (asks to confirm) |
| **User interface** | |
| Dashboard: book availability in a table or card layout | Dashboard, "On the Shelf" with a **Cards / Table** switch |
| Dashboard: highlight low stock (fewer than 2 copies) | Red marking, "Low stock" badges, the Low stock tile and the "Running low" panel (shown to staff) |
| Book management page: add form and editable list | Books page: form on the left, list with Update and Delete on the right |
| Transactions page: add/deduct stock and a history log | Transactions page: "Record a movement" form and the full history table |
| User management page: login form and admin add/update/delete | Sign-in form at `/login`; Users page (admin only) with add, update and delete |

## How the build follows the technical brief

| Brief | Where it is |
| --- | --- |
| React hooks for state and lifecycle | `useState`, `useEffect`, `useCallback`, `useMemo`, `useContext` throughout; custom hooks in `frontend/src/hooks/` (`useAsync`, `useDebounce`, `useMediaQuery`, `useReveal`) |
| Reusable components | `frontend/src/components/`: `BookList`, `AddBookForm`, `BookForm`, `UserForm`, `BookCard`, `ActivityList`, `LoanDialog`, `SiteHeader`, `SiteFooter`, and more; pages in `frontend/src/pages/` (`Dashboard`, `Books`, `Transactions`, `Users`, `Profile`) |
| Controlled forms with validation | `BookForm`, `UserForm`, `LoginForm`, `RegisterForm`, the stock form on `Transactions`, and the password form on `Profile`: every input is bound to state, checked before submit, and shows the server's message on failure |
| React Router | `frontend/src/App.jsx`: `/` front page, `/login`, `/signup`, `/app` (Dashboard), `/app/books`, `/app/transactions`, `/app/users`, `/app/profile` |
| Fetch API | `frontend/src/lib/api.js` wraps `fetch` for every request from React to Express |
| RESTful Express API | `backend/src/routes/`: `books.js`, `transactions.js`, `users.js`, `auth.js`, `dashboard.js`, `public.js` |
| CRUD routes `/books`, `/transactions`, `/users` | Mounted at `/api/books`, `/api/transactions`, `/api/users` (used by the app) and also at `/books`, `/transactions`, `/users` as the brief names them (`backend/src/index.js`) |
| PostgreSQL storing books, users, transactions | `backend/src/db/schema.sql`: `books`, `users`, `transactions`, `covers` tables via the `pg` driver |
| Stock levels and borrowing history | `books.quantity`; every movement in `transactions`, with loans, borrowers and return dates |
| Middleware `express.json()` and `cors` | `backend/src/index.js`: `app.use(cors())` and `app.use(express.json(...))`, plus auth and role middleware in `backend/src/middleware/auth.js` |
| Styling | Plain CSS in `frontend/src/styles/` (design tokens, base, landing, app, header and footer) |

## What it does

- **Dashboard**: totals, a table or card view of every book, low-stock titles
  highlighted (fewer than 2 copies), and the latest stock movements.
- **Books**: add a book (cover image, title, author, genre, ISBN, initial quantity) with a live cover preview, update its
  details, delete it. Search and a low-stock filter.
- **Transactions**: add stock when new copies arrive, deduct stock when copies are
  borrowed, add it back when they return. A full history log with filters.
  Stock can never go below zero, and each movement is written in the same database
  transaction as the stock change.
- **Users**: sign in, create a member account, a profile page (the person icon in
  the header) with the user's details, membership ID, password (hidden until the eye
  icon is pressed) and a change-password form, plus an admin-only page
  to add, update and delete users (name, membership ID, role, password).
- **Roles**: `member` (read only), `librarian` (books and stock), `admin` (everything,
  including user accounts). Low-stock warnings are shown to librarians and admins only.
- **Front page**: banner, genre buttons, popular books and the sign-in / create
  account panel.

### Accounts and signing in

- **Create account** (front page, or `/signup`) makes a **member** account from a
  name and a password. The server gives it a membership ID (`MEM-002`, `MEM-003`,
  ...), which the member sees any time in the profile panel.
- **Members** sign in with their membership ID and password.
- **Staff** (librarians and admins) choose **Staff** on the sign-in form and also
  enter the staff code, set as `STAFF_SIGNIN_CODE` in `backend/.env` (default
  `SHELF-STAFF`).
- Librarian and admin accounts are created by an admin on the Users page.

## Run it

You need Node.js 20 or newer. You do **not** need to install PostgreSQL: the project
can start a real PostgreSQL server for you from an npm package.

```bash
npm install
npm run dev
```

That single command starts three things:

| Name  | What                                              | Where                   |
| ----- | ------------------------------------------------- | ----------------------- |
| `db`  | PostgreSQL (data lives in `backend/.pgdata`)       | `localhost:5433`        |
| `api` | The Express API (creates tables and demo accounts)| `http://localhost:4000` |
| `web` | The React app (Vite dev server, proxies `/api`)   | `http://localhost:5173` |

Open **http://localhost:5173** and create an account, or sign in with one of the
built-in accounts (these are not shown in the app):

| Membership ID | Password     | Role      |
| ------------- | ------------ | --------- |
| `ADM-001`     | `admin123`   | admin (Thomas Moopisa) |
| `LIB-001`     | `library123` | librarian |
| `MEM-001`     | `member123`  | member    |

The admin and librarian accounts sign in as **Staff** with the staff code `SHELF-STAFF`.

The first run takes a little longer because the database folder is created.
Press `Ctrl+C` once to stop everything.

### Using your own PostgreSQL instead

1. Create an empty database, for example `library`.
2. Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL`, for example
   `postgres://postgres:yourpassword@localhost:5432/library`.
3. Run `npm run dev:app` (API and web only). Tables and the demo accounts are created on
   first start. `npm run db:init` does the same without starting the servers.

### API smoke test

With the servers running, `npm run test:api` signs in with the demo accounts and
exercises every route (41 checks: validation, role limits, stock rules, and the
history surviving a deleted book). It adds and removes its own test records.

### Production build

```bash
npm run build
npm start
```

`npm run build` compiles the React app into `frontend/dist`, and `npm start` runs the
Express server, which then serves the built app and the API from one port (4000).

## Project structure

```
Library/
├── package.json            root scripts (npm workspaces: frontend, backend)
├── render.yaml             hosting blueprint for Render
├── cover-library/          cover images for the starting books
├── frontend/               React app (Vite), see frontend/README.md
│   ├── public/             favicon and site photos
│   └── src/
│       ├── main.jsx, App.jsx (routes)
│       ├── components/     BookList, AddBookForm, BookForm, UserForm, ...
│       ├── context/        AuthContext.jsx (sign-in state, authenticated fetch)
│       ├── hooks/          useAsync, useDebounce, useMediaQuery, useReveal
│       ├── lib/            api.js (Fetch wrapper), brand.js, format.js
│       ├── pages/          Landing, Login, Dashboard, Books, Transactions, Users, Profile
│       └── styles/         tokens, base, landing, app, chrome CSS
└── backend/                Express API + PostgreSQL, see backend/README.md
    ├── scripts/            local-db.js, seed-books.js, api-test.mjs
    └── src/
        ├── index.js        app setup, middleware, routes, static frontend
        ├── db/             pool.js, schema.sql, seed.js, init.js
        ├── lib/            errors, validate, serialize, covers, secret
        ├── middleware/     auth.js (JWT check, role check)
        └── routes/         auth, books, transactions, users, dashboard, public
```

## API

All routes are under `/api`. Every route except login needs the header
`Authorization: Bearer <token>`, where the token comes from the login response.

| Method | Route                   | Who                | Purpose                                      |
| ------ | ----------------------- | ------------------ | -------------------------------------------- |
| POST   | `/auth/login`           | anyone             | `{ membershipId, password, staffCode? }` → token + user (staff need `staffCode`) |
| POST   | `/auth/register`        | anyone             | `{ name, password }` → new member, token + user |
| GET    | `/auth/me`              | signed in          | The current user                             |
| GET    | `/auth/me/password`     | signed in          | Your own password, for the eye icon on the profile page |
| PUT    | `/auth/me/password`     | signed in          | `{ currentPassword, newPassword }` changes your password |
| GET    | `/dashboard`            | signed in          | Totals, low-stock books, recent movements    |
| GET    | `/books?q=&low=1`       | signed in          | List and search books                        |
| POST   | `/books`                | librarian, admin   | Add a book, optional `cover` image (data URL) |
| PUT    | `/books/:id`            | librarian, admin   | Update details, `cover` or `removeCover`     |
| DELETE | `/books/:id`            | librarian, admin   | Delete a book and its cover file            |
| GET    | `/transactions`         | signed in          | History, filter by `type`, `bookId`, `q`     |
| POST   | `/transactions`         | librarian, admin   | `{ bookId, type, quantity, note, borrowerId? }` |
| POST   | `/transactions/:id/return` | staff, or the borrower | Return a borrowed loan (marks it returned) |
| GET    | `/transactions/my-loans` | signed in          | The signed-in member's books still on loan  |
| GET    | `/users`                | admin              | List users                                   |
| POST   | `/users`                | admin              | `{ name, membershipId, role, password }`     |
| PUT    | `/users/:id`            | admin              | Update a user (password optional)            |
| DELETE | `/users/:id`            | admin              | Delete a user (not yourself)                 |

A borrow can name the member who took the books (`borrowerId` is their membership
ID). Clicking a borrowed book in the activity list or history opens its details with a
**Return book** button: staff can return any loan, members only loans in their name.
The loan is then marked returned and a Returned entry appears.

Transaction `type` is one of `stock_in` (add stock), `borrow` (deduct stock) or
`return` (add stock back).

## Database

Three tables, created from `backend/src/db/schema.sql`:

- `users` (id, name, membership_id, role, password_hash, created_at)
- `books` (id, title, author, genre, isbn, quantity, cover, created_at, updated_at)
- `transactions` (id, book_id, book_title, user_id, user_name, type, quantity,
  quantity_after, note, created_at)

Passwords are stored as bcrypt hashes. The transactions table keeps a copy of the
book title and user name so the history still reads well after a book or a user
is deleted.

## Troubleshooting

- **"Could not reach the database"**: the API waits about 30 seconds for the
  database. If the `db` process failed, run `npm run db:local` on its own to see
  the error.
- **Port 5433 already in use**: an earlier database process is still running.
  Stop it, or set `LOCAL_PG_PORT` and `DATABASE_URL` to another port.
- **Port 5173 or 4000 busy**: stop whatever is using it, or change `PORT` in
  `backend/.env` and the proxy target in `frontend/vite.config.js`.

## Passwords

Passwords are checked against a bcrypt hash. So that people can see their own
password on the profile page, an encrypted copy (AES-256-GCM) is also stored, sealed
with `PASSWORD_VIEW_KEY` from `backend/.env` (or `JWT_SECRET` if that is not set).
Only the signed-in owner can open it. Accounts created before this feature get their
copy the next time they sign in. Showing passwords is weaker than the usual
hash-only approach, and was added because the brief for this site asked for it.

## Book covers

- Covers are uploaded from the book form (choose a file or drop an image on the
  preview). The browser shrinks the image to at most 600 x 900 pixels before
  sending it, and the API stores it in the database (`covers` table), served at
  `/uploads/covers/...`. Books without a cover show a drawn cover instead.
- A fresh database gets the three demo accounts and the 12 starting books with
  their covers. `npm run db:seed-books` puts any missing starting books back.
- `cover-library/` holds the cover images the starting books are seeded from.

## Photos and name

- The library name lives in `frontend/src/lib/brand.js` (currently Brew & Bind). Change it there and the logo, titles and footer follow.
- Photos used in the design live in `frontend/public/images/` (front-page banner, promo band, sign-in page and dashboard).

## Deploy (make it live)

The project is ready for [Render](https://render.com), which can run the Express
server and a PostgreSQL database together. One web service builds the React app
and serves it from Express alongside the API, so the whole site has one address.

1. Sign in to Render with GitHub and open **New > Blueprint**.
2. Pick this repository. Render reads `render.yaml` and creates the web service
   and the database.
3. When asked, enter a **STAFF_SIGNIN_CODE** of your choice. Staff (librarians and
   admins) enter this code when they sign in. Keep it private.
4. Click **Apply**. The first build takes a few minutes. The site then lives at
   `https://brew-and-bind.onrender.com` (or the address Render shows).

On first start the server creates the tables and loads the demo accounts and the
12 starting books with their covers. Cover images are stored in the database, so
they survive redeploys. After going live, sign in as the admin and change the
admin password on the Profile page, because the demo passwords are public in
this README.

Free Render services sleep after a while without visitors, so the first visit
after a quiet spell can take up to a minute. Render's free databases also expire
after a limited time; upgrade the database plan to keep the data long term.
