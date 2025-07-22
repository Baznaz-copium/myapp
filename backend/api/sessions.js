const express = require('express');
const pool = require('./db');
const router = express.Router();

// CORS middleware
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// GET running sessions
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sessions WHERE running=1');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create session
router.post('/', async (req, res) => {
  const { consoleId, Player_1, Player_2, startTime, endTime, totalMinutes } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO sessions (consoleId, Player_1, Player_2, startTime, endTime, totalMinutes, running) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [consoleId, Player_1, Player_2, startTime, endTime, totalMinutes]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update session
router.put('/', async (req, res) => {
  const { id, endTime, totalMinutes, running } = req.body;
  try {
    await pool.execute(
      'UPDATE sessions SET endTime=?, totalMinutes=?, running=? WHERE id=?',
      [endTime, totalMinutes, running, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE session
router.delete('/', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.execute('DELETE FROM sessions WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH update session endTime and totalMinutes by id
router.patch('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { endTime, totalMinutes } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing session id' });
  try {
    await pool.execute(
      'UPDATE sessions SET endTime=?, totalMinutes=? WHERE id=?',
      [endTime, totalMinutes, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
