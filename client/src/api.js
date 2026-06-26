const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = opts.headers || {};
  headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export function saveAuth(user, token) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
export function getUserFromToken() {
  const t = localStorage.getItem('token');
  const u = localStorage.getItem('user');
  if (t && u) return JSON.parse(u);
  return null;
}
