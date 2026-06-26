import React from 'react'
import { apiFetch, getUserFromToken } from '../api'

export default function Profile() {
  const user = getUserFromToken();
  const [profile, setProfile] = React.useState(null);
  React.useEffect(() => { if (user) apiFetch(`/api/users/${user.id}`).then(setProfile).catch(console.error); }, [user]);

  async function submitReview(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = { reviewee_id: user.id, rating: form.get('rating'), comment: form.get('comment') };
    try { await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify(payload) }); alert('Review submitted'); }
    catch (err) { alert(err.error || 'Error'); }
  }

  if (!user) return <p>Login to view profile</p>;
  if (!profile) return <div>Loading...</div>;
  return (
    <div>
      <h2>Your profile</h2>
      <p>{profile.user.name} ({profile.user.email})</p>

      <h3>Reviews</h3>
      <ul>
        {profile.reviews.map(r => <li key={r.id}>{r.reviewer_name} — {r.rating} — {r.comment}</li>)}
      </ul>

      <h3>Leave a review for yourself (demo)</h3>
      <form onSubmit={submitReview}>
        <label>Rating: <input name="rating" type="number" min="1" max="5" required /></label><br />
        <label>Comment: <textarea name="comment"></textarea></label><br />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}
