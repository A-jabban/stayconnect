import React from 'react'
import { apiFetch } from '../api'

export default function CreateListing() {
  async function submit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = { title: form.get('title'), location: form.get('location'), description: form.get('description') };
    try {
      const res = await apiFetch('/api/listings', { method: 'POST', body: JSON.stringify(payload) });
      window.location.href = `/listing/${res.id}`;
    } catch (err) { alert(err.error || 'Error'); }
  }

  return (
    <div>
      <h2>Create listing</h2>
      <form onSubmit={submit}>
        <div><label>Title: <input name="title" required /></label></div>
        <div><label>Location: <input name="location" /></label></div>
        <div><label>Description: <textarea name="description"></textarea></label></div>
        <button type="submit">Create</button>
      </form>
    </div>
  )
}
