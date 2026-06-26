import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Listings from './pages/Listings'
import Listing from './pages/Listing'
import Login from './pages/Login'
import CreateListing from './pages/CreateListing'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import { getUserFromToken, logout } from './api'

export default function App() {
  const [user, setUser] = React.useState(getUserFromToken());

  React.useEffect(() => {
    setUser(getUserFromToken());
  }, []);

  return (
    <div className="app">
      <header>
        <h1><Link to="/">StayConnect</Link></h1>
        <nav>
          {user ? (
            <>
              <span>Hi, {user.name}</span>
              <Link to="/listing/new">Create</Link>
              <Link to="/requests">Requests</Link>
              <Link to="/messages">Messages</Link>
              <Link to="/profile">Profile</Link>
              <button onClick={() => { logout(); setUser(null); window.location.href = '/'; }}>Logout</button>
            </>
          ) : (
            <Link to="/login">Login / Signup</Link>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Listings />} />
          <Route path="/listing/:id" element={<Listing />} />
          <Route path="/listing/new" element={<CreateListing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
        </Routes>
      </main>
    </div>
  )
}
