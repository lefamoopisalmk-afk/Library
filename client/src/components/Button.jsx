export default function Button({
  variant = 'primary',
  size,
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}) {
  const classes = ['btn', `btn-${variant}`, size ? `btn-${size}` : '', loading ? 'is-loading' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={classes} {...props} disabled={disabled || loading}>
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
