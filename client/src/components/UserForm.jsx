import { useState } from 'react';
import { ROLE_LABELS } from '../lib/format.js';
import Button from './Button.jsx';
import Field from './Field.jsx';

const ROLES = ['member', 'librarian', 'admin'];

function emptyValues() {
  return { name: '', membershipId: '', role: 'member', password: '' };
}

export default function UserForm({ mode = 'add', initial, onSubmit, onCancel, idPrefix = 'user' }) {
  const [values, setValues] = useState(() => ({ ...emptyValues(), ...initial, password: '' }));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  function validate() {
    const next = {};
    if (!values.name.trim()) next.name = 'Name is required';
    const id = values.membershipId.trim().toUpperCase();
    if (id.length < 3) next.membershipId = 'Membership ID needs at least 3 characters';
    else if (!/^[A-Z0-9][A-Z0-9-]*$/.test(id)) next.membershipId = 'Letters, numbers and hyphens only';
    if (mode === 'add' && values.password.length < 6) next.password = 'Password needs at least 6 characters';
    if (mode === 'edit' && values.password && values.password.length < 6) next.password = 'Password needs at least 6 characters';
    return next;
  }

  async function submit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      name: values.name.trim(),
      membershipId: values.membershipId.trim().toUpperCase(),
      role: values.role,
    };
    if (values.password) payload.password = values.password;

    setBusy(true);
    setServerError(null);
    try {
      await onSubmit(payload);
      if (mode === 'add') setValues(emptyValues());
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field label="Full name" id={`${idPrefix}-name`} error={errors.name}>
        <input id={`${idPrefix}-name`} className="input" value={values.name} onChange={set('name')} placeholder="Thomas Moopisa" />
      </Field>
      <div className="form-row">
        <Field label="Membership ID" id={`${idPrefix}-membership`} error={errors.membershipId} hint={errors.membershipId ? null : 'Used to sign in'}>
          <input
            id={`${idPrefix}-membership`}
            className="input mono"
            value={values.membershipId}
            onChange={set('membershipId')}
            placeholder="MEM-042"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </Field>
        <Field label="Role" id={`${idPrefix}-role`}>
          <select id={`${idPrefix}-role`} className="input select" value={values.role} onChange={set('role')}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field
        label={mode === 'add' ? 'Password' : 'New password'}
        id={`${idPrefix}-password`}
        error={errors.password}
        hint={errors.password ? null : mode === 'add' ? 'At least 6 characters' : 'Leave blank to keep the current password'}
      >
        <input
          id={`${idPrefix}-password`}
          className="input"
          type="password"
          value={values.password}
          onChange={set('password')}
          autoComplete="new-password"
        />
      </Field>

      {serverError ? (
        <p className="form-error" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="form-actions">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={busy}>
          {mode === 'add' ? 'Add user' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
