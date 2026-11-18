import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './Icons.jsx';

// A password box with an eye button that shows or hides what was typed.
export default function PasswordInput({ id, value, onChange, autoComplete = 'current-password', className = '' }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`password-input ${className}`}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className="input"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        spellCheck={false}
      />
      <button
        type="button"
        className="password-eye"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
