import LoginForm from './LoginForm.jsx';
import RegisterForm from './RegisterForm.jsx';

// "Sign in" and "Create account" in one place, switched by two tabs.
export default function AuthPanel({ mode, onModeChange, idPrefix = 'auth' }) {
  return (
    <div className="auth-panel">
      <div className="auth-tabs" role="tablist" aria-label="Account">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          className={mode === 'signin' ? 'is-active' : ''}
          onClick={() => onModeChange('signin')}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'register'}
          className={mode === 'register' ? 'is-active' : ''}
          onClick={() => onModeChange('register')}
        >
          Create account
        </button>
      </div>

      {mode === 'register' ? <RegisterForm idPrefix={`${idPrefix}-register`} /> : <LoginForm idPrefix={`${idPrefix}-login`} />}

      <p className="auth-switch">
        {mode === 'register' ? (
          <>
            Already have an account?{' '}
            <button type="button" className="link-btn" onClick={() => onModeChange('signin')}>
              Sign in
            </button>
          </>
        ) : (
          <>
            New here?{' '}
            <button type="button" className="link-btn" onClick={() => onModeChange('register')}>
              Create an account
            </button>
          </>
        )}
      </p>
    </div>
  );
}
