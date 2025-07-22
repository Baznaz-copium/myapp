const express = require('express');
const pool = require('./db');
const bcrypt = require('bcryptjs');
const router = express.Router();

// CORS middleware
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// GET all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, email, password_hash, role, created_at, updated_at, active FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single user
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, email, password_hash, role, created_at, updated_at, active FROM users WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create user
router.post('/', async (req, res) => {
  const { username, email, password, role, active } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const hash = await bcrypt.hash(password, 10);
  const userRole = ['admin', 'staff'].includes(role) ? role : 'staff';
  const isActive = active ? 1 : 0;
  try {
    await pool.execute(
      'INSERT INTO users (username, email, password_hash, role, active) VALUES (?, ?, ?, ?, ?)',
      [username, email, hash, userRole, isActive]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  const { username, email, password, role, active } = req.body;
  const fields = [];
  const values = [];
  if (username) { fields.push('username=?'); values.push(username); }
  if (email) { fields.push('email=?'); values.push(email); }
  if (password) { fields.push('password_hash=?'); values.push(await bcrypt.hash(password, 10)); }
  if (role && ['admin','staff'].includes(role)) { fields.push('role=?'); values.push(role); }
  if (active !== undefined) { fields.push('active=?'); values.push(active ? 1 : 0); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  values.push(req.params.id);
  try {
    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id=?`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
