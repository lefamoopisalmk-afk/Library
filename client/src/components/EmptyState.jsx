export default function EmptyState({ title, text, children }) {
  return (
    <div className="empty">
      <div className="empty-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h3>{title}</h3>
      {text ? <p>{text}</p> : null}
      {children}
    </div>
  );
}
