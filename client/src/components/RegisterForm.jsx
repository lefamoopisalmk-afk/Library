import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from './Button.jsx';
import Field from './Field.jsx';
import { ArrowRightIcon } from './Icons.jsx';

// Create a member account. Staff accounts are made by an admin, not here.
// The membership ID is chosen by the server; members see it any time in the
// profile panel (the profile icon in the header).
export default function RegisterForm({ idPrefix = 'register' }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  function validate() {
    const next = {};
    if (values.name.trim().length < 2) next.name = 'Enter your full name';
    if (values.password.length < 6) next.password = 'Use at least 6 characters';
    if (values.confirm !== values.password) next.confirm = 'The two passwords do not match';
    return next;
  }

  async function submit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setServerError(null);
    try {
      await register({ name: values.name.trim(), password: values.password });
      navigate('/app');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="login-form" onSubmit={submit} noValidate>
      <Field label="Full name" id={`${idPrefix}-name`} error={errors.name}>
        <input
          id={`${idPrefix}-name`}
          className="input"
          value={values.name}
          onChange={set('name')}
          autoComplete="name"
        />
      </Field>

      <div className="form-row">
        <Field label="Password" id={`${idPrefix}-password`} error={errors.password} hint={errors.password ? null : 'At least 6 characters'}>
          <input
            id={`${idPrefix}-password`}
            type="password"
            className="input"
            value={values.password}
            onChange={set('password')}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm password" id={`${idPrefix}-confirm`} error={errors.confirm}>
          <input
            id={`${idPrefix}-confirm`}
            type="password"
            className="input"
            value={values.confirm}
            onChange={set('confirm')}
            autoComplete="new-password"
          />
        </Field>
      </div>

      {serverError ? (
        <p className="form-error" role="alert">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" size="lg" loading={busy} className="btn-block">
        Create member account <ArrowRightIcon />
      </Button>
    </form>
  );
}
