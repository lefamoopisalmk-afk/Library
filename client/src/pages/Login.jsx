import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { BRAND, PHOTOS } from '../lib/brand.js';
import AuthPanel from '../components/AuthPanel.jsx';
import Logo from '../components/Logo.jsx';
import PublicChrome from '../components/PublicChrome.jsx';
import { FullPageSpinner } from '../components/Spinner.jsx';

// Serves both /login and /signup; the tab can be switched either way.
// A warm photo fills the left half on wide screens, the form sits on the right.
export default function Login({ initialMode = 'signin' }) {
  const { user, ready } = useAuth();
  const [mode, setMode] = useState(initialMode);

  if (!ready) return <FullPageSpinner />;
  if (user) return <Navigate to="/app" replace />;

  return (
    <PublicChrome>
    <main className="auth-page">
      <div className="auth-split">
        <aside className="auth-visual" style={{ backgroundImage: `url(${PHOTOS.cozyReading})` }}>
          <div className="auth-visual-copy">
            <Logo light />
            <p>A warm corner for good books. Sign in to see what is on the shelf today.</p>
          </div>
        </aside>

        <div className="auth-card">
          <p className="script-line">{mode === 'register' ? `Join ${BRAND.name}` : 'Welcome back'}</p>
          <h1>{mode === 'register' ? 'Create your account' : 'Sign in'}</h1>
          <p className="auth-text">
            {mode === 'register'
              ? 'Create a free member account to browse the shelf.'
              : 'Use your membership ID and password. Staff also enter the staff code.'}
          </p>
          <AuthPanel mode={mode} onModeChange={setMode} idPrefix="page" />
          <p className="auth-foot">
            <Link to="/">Back to the front page</Link>
          </p>
        </div>
      </div>
    </main>
    </PublicChrome>
  );
}
