// A labelled form control with room for a hint or an error line.
export default function Field({ label, id, hint, error, className = '', children }) {
  return (
    <div className={['field', error ? 'has-error' : '', className].filter(Boolean).join(' ')}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}
