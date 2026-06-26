import React from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'

export default function Listings() {
  const [listings, setListings] = React.useState([]);
  React.useEffect(() => { apiFetch('/api/listings').then(setListings).catch(console.error); }, []);
  return (
    <div>
      <h2>Listings</h2>
      <ul>
        {listings.map(l => (
          <li key={l.id}>
            <h3><Link to={`/listing/${l.id}`}>{l.title}</Link></h3>
            <p>{l.location}</p>
            <p>Host: {l.owner_name}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
