import React from 'react'
import { apiFetch, saveAuth } from '../api'

export default function Login() {
  const [mode, setMode] = React.useState('login');

  async function submit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await apiFetch(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(payload) });
      saveAuth(res.user, res.token);
      window.location.href = '/';
    } catch (err) {
      alert(err.error || 'Error');
    }
  }

  return (
    <div>
      <h2>{mode === 'login' ? 'Login' : 'Sign up'}</h2>
      <form onSubmit={submit}>
        {mode === 'signup' && <div><label>Name: <input name="name" required /></label></div>}
        <div><label>Email: <input name="email" type="email" required /></label></div>
        <div><label>Password: <input name="password" type="password" required /></label></div>
        <button type="submit">{mode === 'login' ? 'Login' : 'Sign up'}</button>
      </form>
      <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>Switch to {mode === 'login' ? 'Sign up' : 'Login'}</button>
    </div>
  )
}
