// A small error type that carries an HTTP status, so route code can say
// exactly what went wrong and the error handler turns it into a response.
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
}

function uniqueViolationMessage(err) {
  const c = err.constraint || '';
  if (c.includes('isbn')) return 'A book with this ISBN already exists';
  if (c.includes('membership')) return 'That membership ID is already in use';
  return 'That value is already in use';
}

// Express 5 passes rejected promises here automatically.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.code === '23505') return res.status(409).json({ error: uniqueViolationMessage(err) });
  if (err.code === '23514') return res.status(400).json({ error: 'That change would break a stock rule (stock can never go below zero)' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'The request body is not valid JSON' });

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong on the server' : err.message,
    details: err.details,
  });
}
