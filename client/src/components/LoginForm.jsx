import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from './Button.jsx';
import Field from './Field.jsx';
import { ArrowRightIcon, BookIcon, StackIcon } from './Icons.jsx';

const TYPES = [
  { value: 'member', label: 'Member', text: 'Readers', Icon: BookIcon },
  { value: 'staff', label: 'Staff', text: 'Librarians and admins', Icon: StackIcon },
];

// Sign in. Members use their membership ID and password; staff also enter
// the staff code the library gives them.
export default function LoginForm({ idPrefix = 'login' }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [type, setType] = useState('member');
  const [membershipId, setMembershipId] = useState('');
  const [password, setPassword] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!membershipId.trim() || !password) {
      setError('Enter your membership ID and password');
      return;
    }
    if (type === 'staff' && !staffCode.trim()) {
      setError('Enter the staff code');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await login(membershipId.trim(), password, type === 'staff' ? staffCode.trim() : undefined);
      navigate(location.state?.from || '/app');
    } catch (err) {
      if (err.status === 403 && type === 'member') setType('staff');
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="login-form" onSubmit={onSubmit} noValidate>
      <fieldset className="account-types">
        <legend>Signing in as</legend>
        {TYPES.map((t) => (
          <label key={t.value} className={`account-type${type === t.value ? ' is-active' : ''}`}>
            <input
              type="radio"
              name={`${idPrefix}-type`}
              value={t.value}
              checked={type === t.value}
              onChange={() => {
                setType(t.value);
                setError(null);
              }}
            />
            <span className="account-type-icon">
              <t.Icon />
            </span>
            <strong>{t.label}</strong>
            <span>{t.text}</span>
          </label>
        ))}
      </fieldset>

      <Field label="Membership ID" id={`${idPrefix}-id`}>
        <input
          id={`${idPrefix}-id`}
          className="input mono"
          value={membershipId}
          onChange={(e) => setMembershipId(e.target.value)}
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
        />
      </Field>
      <Field label="Password" id={`${idPrefix}-password`}>
        <input
          id={`${idPrefix}-password`}
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </Field>
      {type === 'staff' ? (
        <Field label="Staff code" id={`${idPrefix}-staff`} hint="The code the library gives its staff">
          <input
            id={`${idPrefix}-staff`}
            type="password"
            className="input mono"
            value={staffCode}
            onChange={(e) => setStaffCode(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
      ) : null}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" loading={busy} className="btn-block">
        Sign in <ArrowRightIcon />
      </Button>
    </form>
  );
}
