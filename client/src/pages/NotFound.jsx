import { Link } from 'react-router-dom';
import PublicChrome from '../components/PublicChrome.jsx';

export default function NotFound() {
  return (
    <PublicChrome>
      <main className="auth-page">
        <div className="auth-card">
          <p className="script-line">404</p>
          <h1>That shelf is empty.</h1>
          <p className="auth-text">There is no page at this address.</p>
          <p className="auth-foot">
            <Link to="/">Back to the front page</Link>
          </p>
        </div>
      </main>
    </PublicChrome>
  );
}
