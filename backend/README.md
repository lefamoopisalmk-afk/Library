# Backend: Brew & Bind API (Express + PostgreSQL)

The REST API and database of the Brew & Bind library management system. In
production it also serves the built React app from [`../frontend`](../frontend).

- **Live API health check:** https://brew-and-bind.onrender.com/api/health
- **Live public shelf (no sign-in):** https://brew-and-bind.onrender.com/api/public/shelf
- **Live database status:** https://brew-and-bind.onrender.com/api/health/db (connected, record counts)
- **Database schema:** [`src/db/schema.sql`](src/db/schema.sql)
- **Database on Render (owner sign-in):** https://dashboard.render.com/d/dpg-dbumd61srm7s73fb42p0-a
- **Frontend that uses it:** [`../frontend`](../frontend), live at https://brew-and-bind.onrender.com
- **Main project README:** [`../README.md`](../README.md)

## Stack

| Part | Used here |
| --- | --- |
| Server | Express 5 (Node.js), RESTful routes in `src/routes/` |
| Database | PostgreSQL through the `pg` driver; schema in `src/db/schema.sql` |
| Middleware | `express.json()` for request bodies, `cors` for cross-origin requests, plus sign-in and role checks in `src/middleware/auth.js` |
| Auth | JSON Web Tokens; passwords hashed with bcrypt |

## REST routes

The React app calls the routes under `/api`. The same routers also answer at
`/books`, `/transactions` and `/users`, as the assignment brief names them.

| Resource | Routes |
| --- | --- |
| Books | `GET /api/books`, `GET /api/books/:id`, `POST /api/books`, `PUT /api/books/:id`, `DELETE /api/books/:id` |
| Transactions | `GET /api/transactions`, `POST /api/transactions`, `POST /api/transactions/:id/return`, `GET /api/transactions/my-loans` |
| Users | `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id` |
| Sign-in and profile | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`, `GET`/`PUT /api/auth/me/password` |
| Other | `GET /api/dashboard`, `GET /api/public/shelf`, `GET /api/health`, `GET /api/health/db`, `GET /uploads/covers/:name` |

## Database

Tables (created automatically on first start from `src/db/schema.sql`):

- `books`: title, author, genre, ISBN, quantity in stock, cover
- `users`: name, membership ID, role, password hash
- `transactions`: every stock movement (stock added, borrowed, returned), with
  borrower and return date, so stock levels and borrowing history are tracked
- `covers`: the book cover images

## Folder layout

```
backend/
├── .env.example        settings to copy into .env
├── scripts/
│   ├── local-db.js     starts PostgreSQL locally with no install (embedded-postgres)
│   ├── seed-books.js   puts the 12 starting books back
│   └── api-test.mjs    API smoke test (npm run test:api)
└── src/
    ├── index.js        Express app: middleware, routes, static frontend
    ├── db/             pool.js, schema.sql, seed.js, init.js
    ├── lib/            errors, validation, serializers, covers, secret
    ├── middleware/     auth.js (token check, role check)
    └── routes/         auth, books, transactions, users, dashboard, public
```

## Run it

From the project root:

```bash
npm install
npm run dev
```

The API listens on http://localhost:4000, with PostgreSQL on port 5433. To use
your own PostgreSQL instead, copy `.env.example` to `.env`, set `DATABASE_URL`,
and run `npm run dev:app` from the root.
