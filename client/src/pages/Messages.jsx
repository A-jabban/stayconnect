import React from 'react'
import { apiFetch, getUserFromToken } from '../api'

export default function Messages() {
  const user = getUserFromToken();
  const [messages, setMessages] = React.useState([]);

  React.useEffect(() => { if (user) apiFetch('/api/messages').then(setMessages).catch(console.error); }, [user]);

  async function send(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = { to_user_id: form.get('to_user_id'), body: form.get('body') };
    try { const m = await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify(payload) }); setMessages(prev => [m, ...prev]); }
    catch (err) { alert(err.error || 'Error'); }
  }

  if (!user) return <p>Login to view messages</p>;
  return (
    <div>
      <h2>Inbox</h2>
      <form onSubmit={send}>
        <label>To user id: <input name="to_user_id" required /></label><br />
        <label>Message: <textarea name="body" required></textarea></label><br />
        <button type="submit">Send</button>
      </form>

      <ul>
        {messages.map(m => (
          <li key={m.id}><strong>{m.from_name}</strong> — {m.body} — {m.created_at}</li>
        ))}
      </ul>
    </div>
  )
}
