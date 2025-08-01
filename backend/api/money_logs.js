const express = require('express');
const pool = require('./db');
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

// GET all logs
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM money_logs ORDER BY date DESC, id DESC');
    const logs = rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount),
      recurring: !!row.recurring
    }));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create log
router.post('/', async (req, res) => {
  const { type, source, amount, note, date, recurring } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO money_logs (type, source, amount, note, date, recurring) VALUES (?, ?, ?, ?, ?, ?)',
      [type, source, amount, note, date || new Date().toISOString().slice(0,10), recurring ? 1 : 0]
    );
    res.json({ success: true, id: result.insertId });
    const io = req.app.get('io');
    io.emit('money-logs-updated');
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update log
router.put('/', async (req, res) => {
  const { id, type, source, amount, note, date, recurring } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const fields = [];
  const values = [];
  if (type !== undefined) { fields.push('type=?'); values.push(type); }
  if (source !== undefined) { fields.push('source=?'); values.push(source); }
  if (amount !== undefined) { fields.push('amount=?'); values.push(amount); }
  if (note !== undefined) { fields.push('note=?'); values.push(note); }
  if (date !== undefined) { fields.push('date=?'); values.push(date); }
  if (recurring !== undefined) { fields.push('recurring=?'); values.push(recurring ? 1 : 0); }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(id);
  try {
    await pool.execute(`UPDATE money_logs SET ${fields.join(', ')} WHERE id=?`, values);
    res.json({ success: true });
    const io = req.app.get('io');
    io.emit('money-logs-updated');
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE log
router.delete('/', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  try {
    await pool.execute('DELETE FROM money_logs WHERE id=?', [id]);
    res.json({ success: true });
    const io = req.app.get('io');
    io.emit('money-logs-updated');
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
