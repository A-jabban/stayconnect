require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const SALT_ROUNDS = 10;

function generateToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid auth' });
  jwt.verify(parts[1], JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = payload;
    next();
  });
}

// Auth
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    db.run(`INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`, [name, email, hash], function(err) {
      if (err) return res.status(400).json({ error: 'Email already used or DB error' });
      const user = { id: this.lastID, name, email };
      const token = generateToken(user);
      res.json({ user, token });
    });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const payload = { id: user.id, name: user.name, email: user.email };
    const token = generateToken(payload);
    res.json({ user: payload, token });
  });
});

// Listings
app.get('/api/listings', (req, res) => {
  db.all(`SELECT l.*, u.name as owner_name FROM listings l JOIN users u ON l.owner_id = u.id ORDER BY l.created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

app.post('/api/listings', authMiddleware, (req, res) => {
  const { title, location, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  db.run(`INSERT INTO listings (owner_id, title, location, description) VALUES (?, ?, ?, ?)`, [req.user.id, title, location || '', description || ''], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    db.get(`SELECT l.*, u.name as owner_name FROM listings l JOIN users u ON l.owner_id = u.id WHERE l.id = ?`, [this.lastID], (e, row) => {
      if (e) return res.status(500).json({ error: 'DB error' });
      res.json(row);
    });
  });
});

app.get('/api/listings/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT l.*, u.name as owner_name, u.id as owner_id FROM listings l JOIN users u ON l.owner_id = u.id WHERE l.id = ?`, [id], (err, listing) => {
    if (err || !listing) return res.status(404).json({ error: 'Listing not found' });
    db.all(`SELECT r.*, u.name as requester_name FROM requests r JOIN users u ON r.requester_id = u.id WHERE r.listing_id = ? ORDER BY r.created_at DESC`, [id], (err2, requests) => {
      if (err2) requests = [];
      res.json({ listing, requests });
    });
  });
});

// Requests
app.post('/api/requests', authMiddleware, (req, res) => {
  const { listing_id, message } = req.body;
  if (!listing_id) return res.status(400).json({ error: 'Missing listing_id' });
  db.run(`INSERT INTO requests (listing_id, requester_id, message) VALUES (?, ?, ?)`, [listing_id, req.user.id, message || ''], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    db.get(`SELECT r.*, u.name as requester_name FROM requests r JOIN users u ON r.requester_id = u.id WHERE r.id = ?`, [this.lastID], (e, row) => {
      if (e) return res.status(500).json({ error: 'DB error' });
      res.json(row);
    });
  });
});

app.get('/api/requests', authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.all(`SELECT r.*, l.title as listing_title, u.name as owner_name FROM requests r JOIN listings l ON r.listing_id = l.id JOIN users u ON l.owner_id = u.id WHERE r.requester_id = ? ORDER BY r.created_at DESC`, [userId], (err, myRequests) => {
    if (err) myRequests = [];
    db.all(`SELECT r.*, l.title as listing_title, ur.name as requester_name FROM requests r JOIN listings l ON r.listing_id = l.id JOIN users ur ON r.requester_id = ur.id WHERE l.owner_id = ? ORDER BY r.created_at DESC`, [userId], (err2, ownerRequests) => {
      if (err2) ownerRequests = [];
      res.json({ myRequests, ownerRequests });
    });
  });
});

// Change request status (owner only)
app.post('/api/requests/:id/status', authMiddleware, (req, res) => {
  const status = req.body.status;
  const requestId = req.params.id;
  const userId = req.user.id;
  db.get(`SELECT r.*, l.owner_id FROM requests r JOIN listings l ON r.listing_id = l.id WHERE r.id = ?`, [requestId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Not found' });
    if (row.owner_id !== userId) return res.status(403).json({ error: 'Not allowed' });
    db.run(`UPDATE requests SET status = ? WHERE id = ?`, [status, requestId], function(err2) {
      if (err2) return res.status(500).json({ error: 'DB error' });
      res.json({ ok: true });
    });
  });
});

// Users and reviews
app.get('/api/users/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT id, name, email FROM users WHERE id = ?`, [id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    db.all(`SELECT r.*, u.name as reviewer_name FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.reviewee_id = ? ORDER BY r.created_at DESC`, [id], (err2, reviews) => {
      if (err2) reviews = [];
      res.json({ user, reviews });
    });
  });
});

app.post('/api/reviews', authMiddleware, (req, res) => {
  const { reviewee_id, rating, comment } = req.body;
  if (!reviewee_id || !rating) return res.status(400).json({ error: 'Missing fields' });
  db.run(`INSERT INTO reviews (reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?)`, [req.user.id, reviewee_id, rating, comment || ''], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    db.get(`SELECT r.*, u.name as reviewer_name FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.id = ?`, [this.lastID], (e, row) => {
      if (e) return res.status(500).json({ error: 'DB error' });
      res.json(row);
    });
  });
});

// Messages (simple DB-backed inbox)
app.post('/api/messages', authMiddleware, (req, res) => {
  const { to_user_id, body } = req.body;
  if (!to_user_id || !body) return res.status(400).json({ error: 'Missing fields' });
  db.run(`INSERT INTO messages (from_user_id, to_user_id, body) VALUES (?, ?, ?)`, [req.user.id, to_user_id, body], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    db.get(`SELECT m.*, uf.name as from_name, ut.name as to_name FROM messages m JOIN users uf ON m.from_user_id = uf.id JOIN users ut ON m.to_user_id = ut.id WHERE m.id = ?`, [this.lastID], (e, row) => {
      if (e) return res.status(500).json({ error: 'DB error' });
      res.json(row);
    });
  });
});

app.get('/api/messages', authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.all(`SELECT m.*, uf.name as from_name FROM messages m JOIN users uf ON m.from_user_id = uf.id WHERE m.to_user_id = ? ORDER BY m.created_at DESC`, [userId], (err, rows) => {
    if (err) rows = [];
    res.json(rows);
  });
});

// Start
app.listen(PORT, () => console.log(`API server running at http://localhost:${PORT}`));
