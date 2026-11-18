import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import AppShell from './components/AppShell.jsx';
import Protected from './components/Protected.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Books from './pages/Books.jsx';
import Transactions from './pages/Transactions.jsx';
import Users from './pages/Users.jsx';
import NotFound from './pages/NotFound.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login key="signup" initialMode="register" />} />
          <Route
            path="/app"
            element={
              <Protected>
                <AppShell />
              </Protected>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="books" element={<Books />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="profile" element={<Profile />} />
            <Route
              path="users"
              element={
                <Protected roles={['admin']}>
                  <Users />
                </Protected>
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
