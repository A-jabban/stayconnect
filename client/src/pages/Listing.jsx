import React from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch, getUserFromToken } from '../api'

export default function Listing() {
  const { id } = useParams();
  const [data, setData] = React.useState(null);
  const user = getUserFromToken();

  React.useEffect(() => { apiFetch(`/api/listings/${id}`).then(setData).catch(console.error); }, [id]);

  async function sendRequest(e) {
    e.preventDefault();
    const body = { listing_id: id, message: e.target.message.value };
    try {
      await apiFetch('/api/requests', { method: 'POST', body: JSON.stringify(body) });
      alert('Request sent');
    } catch (err) { alert(err.error || 'Error'); }
  }

  if (!data) return <div>Loading...</div>;
  const { listing, requests } = data;
  return (
    <div>
      <h2>{listing.title}</h2>
      <p>{listing.location}</p>
      <p>Host: {listing.owner_name}</p>
      <p>{listing.description}</p>

      <h3>Request to stay</h3>
      {!user ? <p>Login to request</p> : user.id === listing.owner_id ? <p>This is your listing</p> : (
        <form onSubmit={sendRequest}>
          <textarea name="message" placeholder="Message to host"></textarea>
          <br />
          <button type="submit">Send request</button>
        </form>
      )}

      <h3>Requests</h3>
      <ul>
        {requests.map(r => (
          <li key={r.id}>{r.requester_name} — {r.status} — {r.message}</li>
        ))}
      </ul>
    </div>
  )
}
