import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { FullPageSpinner } from './Spinner.jsx';

// Wraps anything that needs a signed-in user. Pass `roles` to limit it further.
export default function Protected({ roles, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="page">
        <div className="note note-warn" role="alert">
          <strong>Admins only.</strong> This page manages user accounts, and your role is {user.role}.{' '}
          <Link to="/app">Back to the dashboard</Link>
        </div>
      </div>
    );
  }

  return children;
}
