# Brew & Bind, a library management system

A full-stack web application for running a small library: books, stock levels,
stock movements and user accounts. Built for the WEB 2 assignment.

## Frontend, backend and database

| Part | Code on GitHub | Live |
| --- | --- | --- |
| **Frontend** (React app) | [`frontend/`](https://github.com/lefamoopisalmk-afk/Library/tree/main/frontend) | https://brew-and-bind.onrender.com |
| **Backend** (Express + PostgreSQL) | [`backend/`](https://github.com/lefamoopisalmk-afk/Library/tree/main/backend) | https://brew-and-bind.onrender.com/api/health |
| **Database** (PostgreSQL on Render) | [`backend/src/db/schema.sql`](https://github.com/lefamoopisalmk-afk/Library/blob/main/backend/src/db/schema.sql) | https://brew-and-bind.onrender.com/api/health/db (status) · [Render database page](https://dashboard.render.com/d/dpg-dbumd61srm7s73fb42p0-a) (sign-in) |

Each folder has its own README: [frontend/README.md](frontend/README.md) and
[backend/README.md](backend/README.md). In production one Render web service runs
the Express backend, which serves the built React frontend and the API from the same
address. The database is a Render PostgreSQL instance.

The database's connection string is a secret (it contains the password), so it is
not published here. The public status link shows the database is connected and how
many books, users and transactions it holds. The Render database page opens only for
the account owner.

| Layer         | Technology                                              |
| ------------- | ------------------------------------------------------- |
| Front end     | React 19 (JSX, components, hooks, React Router)         |
| Styling       | Plain CSS with design tokens                            |
| State         | React hooks (`useState`, `useEffect`, context, custom)  |
| Back end      | Express 5 (Node.js)                                     |
| Database      | PostgreSQL (via the `pg` driver)                        |
| Communication | Fetch API: React calls Express, Express talks to the DB |



| Membership ID | Password     | Role      |
| ------------- | ------------ | --------- |
| `ADM-001`     | `admin123`   | admin (Thomas Moopisa) |
| `LIB-001`     | `library123` | librarian |
| `MEM-001`     | `member123`  | member    |

The admin and librarian accounts sign in as **Staff** with the staff code `MOOPISA_901021212`.

