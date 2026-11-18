export default function StatTile({ label, value, note, tone }) {
  return (
    <div className={['stat', tone ? `stat-${tone}` : ''].filter(Boolean).join(' ')}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {note ? <span className="stat-note">{note}</span> : null}
    </div>
  );
}
