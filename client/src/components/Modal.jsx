import { useEffect, useRef } from 'react';
import Button from './Button.jsx';

export function Modal({ open, title, onClose, children, width }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = panelRef.current?.querySelector('input, select, textarea, button');
    first?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={width ? { maxWidth: width } : undefined}
      >
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', busy, onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose} width={440}>
      <p className="modal-text">{message}</p>
      <div className="modal-actions">
        <Button variant="ghost" type="button" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" type="button" onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
