export function Spinner({ label = 'Loading' }) {
  return (
    <div className="spinner-row" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="full-page">
      <Spinner label="Opening Brew & Bind" />
    </div>
  );
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="note note-error" role="alert">
      <span>{error.message || String(error)}</span>
      {onRetry ? (
        <button type="button" className="link-btn" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
