const express = require('express');
const pool = require('./db');

// DB connection test (runs once when this file is loaded)
pool.getConnection()
  .then(conn => {
    console.log('MySQL connection to consoles.js: SUCCESS');
    conn.release();
  })
  .catch(err => {
    console.error('MySQL connection to consoles.js: FAILED', err);
  });
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

// GET all consoles
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM consoles');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create console
router.post('/', async (req, res) => {
  const { name, status, pricePerHour } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO consoles (name, status, pricePerHour) VALUES (?, ?, ?)',
      [name, status, pricePerHour]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update console
router.put('/', async (req, res) => {
  const { id, name, status, pricePerHour } = req.body;
  try {
    await pool.execute(
      'UPDATE consoles SET name=?, status=?, pricePerHour=? WHERE id=?',
      [name, status, pricePerHour, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE console
router.delete('/', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.execute('DELETE FROM consoles WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
