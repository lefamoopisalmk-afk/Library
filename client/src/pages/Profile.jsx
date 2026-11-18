import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, initials, ROLE_LABELS } from '../lib/format.js';
import { RoleBadge } from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Field from '../components/Field.jsx';
import { EyeIcon, EyeOffIcon, SignOutIcon } from '../components/Icons.jsx';
import PageHeader from '../components/PageHeader.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { useToast } from '../components/Toast.jsx';

const ROLE_TEXT = {
  admin: 'Manages books, stock and user accounts.',
  librarian: 'Manages books and stock.',
  member: 'Browses the shelf and borrows books.',
};

// The signed-in person's own page: their details, their password (hidden
// until the eye icon is pressed) and a form to change the password.
export default function Profile() {
  const { user, request, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [revealError, setRevealError] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function togglePassword() {
    if (showPassword) {
      setShowPassword(false);
      return;
    }
    if (password === null) {
      setRevealing(true);
      setRevealError(null);
      try {
        const data = await request('/auth/me/password');
        setPassword(data.password);
      } catch (err) {
        setRevealError(err.message);
        setRevealing(false);
        return;
      }
      setRevealing(false);
    }
    setShowPassword(true);
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(user.membershipId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the ID is still on screen.
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function changePassword(e) {
    e.preventDefault();
    const next = {};
    if (!form.current) next.current = 'Enter your current password';
    if (form.next.length < 6) next.next = 'Use at least 6 characters';
    if (form.confirm !== form.next) next.confirm = 'The two new passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setServerError(null);
    try {
      await request('/auth/me/password', { method: 'PUT', body: { currentPassword: form.current, newPassword: form.next } });
      setPassword(form.next);
      setShowPassword(false);
      setForm({ current: '', next: '', confirm: '' });
      toast('Your password has been changed', 'success');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function signOut() {
    logout();
    navigate('/');
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Your account" title="Profile" text="Your details and password." />

      <div className="profile-layout">
        <section className="panel profile-card">
          <div className="profile-card-head">
            <span className="avatar profile-avatar" aria-hidden="true">
              {initials(user.name)}
            </span>
            <div>
              <h2>{user.name}</h2>
              <RoleBadge role={user.role} />
              <p className="muted">{ROLE_TEXT[user.role]}</p>
            </div>
          </div>

          <dl className="profile-list">
            <div>
              <dt>Full name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Membership ID</dt>
              <dd>
                <span className="profile-id">{user.membershipId}</span>
                <button type="button" className="link-btn" onClick={copyId}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </dd>
            </div>
            <div>
              <dt>Account type</dt>
              <dd>{ROLE_LABELS[user.role] || user.role}</dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt>Password</dt>
              <dd>
                <span className={`profile-password${showPassword ? ' is-visible' : ''}`}>
                  {showPassword ? password : '••••••••••'}
                </span>
                <button
                  type="button"
                  className="icon-btn profile-eye"
                  onClick={togglePassword}
                  disabled={revealing}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </dd>
            </div>
          </dl>
          {revealError ? (
            <p className="field-error" role="alert">
              {revealError}
            </p>
          ) : null}

          <Button variant="ghost" type="button" onClick={signOut} className="profile-signout">
            <SignOutIcon /> Sign out
          </Button>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Change password</h2>
              <p className="muted">Enter your current password, then the new one twice.</p>
            </div>
          </div>
          <form className="form" onSubmit={changePassword} noValidate>
            <Field label="Current password" id="pw-current" error={errors.current}>
              <PasswordInput id="pw-current" value={form.current} onChange={set('current')} />
            </Field>
            <Field label="New password" id="pw-next" error={errors.next} hint={errors.next ? null : 'At least 6 characters'}>
              <PasswordInput id="pw-next" value={form.next} onChange={set('next')} autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password" id="pw-confirm" error={errors.confirm}>
              <PasswordInput id="pw-confirm" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
            </Field>

            {serverError ? (
              <p className="form-error" role="alert">
                {serverError}
              </p>
            ) : null}

            <div className="form-actions">
              <Button type="submit" loading={saving}>
                Update password
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
