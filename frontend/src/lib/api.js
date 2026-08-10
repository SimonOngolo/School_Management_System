const BASE = import.meta.env.VITE_API_URL || '/api';

// Export a small wrapper around fetch for GET/POST with JSON handling
export async function apiFetch(path, options = {}) {
  const url = `${BASE}${path}`;
  const opts = Object.assign({
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  }, options);
  if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
  if (!res.ok) {
    const err = new Error(body && body.error ? body.error : `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}
