# Frontend: Brew & Bind React app

The user interface of the Brew & Bind library management system.

- **Live site:** https://brew-and-bind.onrender.com
- **Backend it talks to:** [`../backend`](../backend) (Express + PostgreSQL), live at
  https://brew-and-bind.onrender.com/api/health
- **Main project README:** [`../README.md`](../README.md)

## Stack

| Part | Used here |
| --- | --- |
| Framework | React 19 with JSX, built with Vite |
| Components | Reusable components in `src/components/` (`BookList`, `AddBookForm`, `BookForm`, `UserForm`, `BookCard`, `ActivityList`, `LoanDialog`, `SiteHeader`, `SiteFooter`, ...) |
| Pages | `src/pages/`: `Dashboard`, `Books`, `Transactions`, `Users`, `Profile`, `Landing`, `Login` |
| Routing | React Router (`src/App.jsx`) |
| State | React hooks (`useState`, `useEffect`, `useContext`, ...) and custom hooks in `src/hooks/` |
| Forms | Controlled components with validation and submit handling |
| Talking to the backend | Fetch API, wrapped in `src/lib/api.js` |
| Styling | Plain CSS in `src/styles/` |

## Folder layout

```
frontend/
├── index.html          page shell and fonts
├── vite.config.js      dev server; proxies /api and /uploads to the backend
├── public/             favicon and the site photos (public/images/)
└── src/
    ├── main.jsx        entry point
    ├── App.jsx         routes
    ├── components/     reusable UI pieces
    ├── context/        AuthContext (sign-in state, authenticated fetch)
    ├── hooks/          useAsync, useDebounce, useMediaQuery, useReveal
    ├── lib/            api.js (Fetch wrapper), brand.js (name and photos), format.js
    ├── pages/          one file per page
    └── styles/         tokens, base, landing, app, header and footer CSS
```

## Run it

From the project root (it also starts the backend and the database):

```bash
npm install
npm run dev
```

The app opens at http://localhost:5173. To build it for production, run
`npm run build` from the root; the output goes to `frontend/dist`, which the
backend serves.
