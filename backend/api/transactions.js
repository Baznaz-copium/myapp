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

// GET all transactions
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM transactions');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create transaction
router.post('/', async (req, res) => {
  const data = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO transactions (consoleId, consoleName, Player_1, Player_2, startTime, endTime, duration, amountPaid, amountDue, totalAmount, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.consoleId,
        data.consoleName,
        data.player_1,
        data.player_2,
        data.startTime,
        data.endTime,
        data.duration,
        data.amountPaid,
        data.amountDue,
        data.totalAmount,
        data.paymentMethod,
        data.status,
        data.createdAt
      ]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update transaction by id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  let sql = '', params = [];
  try {
    // 1. Session Stopped (Cancelled)
    if (
      data.status && data.status.toLowerCase() === 'cancelled' &&
      data.endTime !== undefined && data.duration !== undefined
    ) {
      sql = 'UPDATE transactions SET amountPaid=?, amountDue=?, totalAmount=?, status=? WHERE id=?';
      params = [data.amountPaid, data.amountDue, data.totalAmount, data.status, id];
    }
    // 2. General Edit (from table)
    else if (data.createdAt !== undefined) {
      // Convert ISO string to MySQL DATETIME format
      let createdAt = data.createdAt;
      if (typeof createdAt === 'string' && createdAt.includes('T')) {
        createdAt = createdAt.replace('T', ' ').replace('Z', '').split('.')[0];
      }
      sql = 'UPDATE transactions SET createdAt=?, consoleName=?, player_1=?, player_2=?, duration=?, amountPaid=?, paymentMethod=?, status=? WHERE id=?';
      params = [createdAt, data.consoleName, data.player_1, data.player_2, data.duration, data.amountPaid, data.paymentMethod, data.status, id];
    }
    // 4. Only paymentMethod update
    else if (data.paymentMethod !== undefined) {
      sql = 'UPDATE transactions SET paymentMethod=? WHERE id=?';
      params = [data.paymentMethod, id];
    }
    // 3. Session End (Completed)
    else if (data.status && data.status.toLowerCase() === 'completed') {
      sql = 'UPDATE transactions SET amountPaid=?, amountDue=?, totalAmount=?, paymentMethod=?, status=? WHERE id=?';
      params = [data.amountPaid, data.amountDue, data.totalAmount, 'cash', data.status, id];
    }
    // 4. Session Extension (only endTime and duration)
    else if (data.endTime !== undefined && data.duration !== undefined) {
      sql = 'UPDATE transactions SET endTime=?, duration=? WHERE id=?';
      params = [data.endTime, data.duration, id];
    }
    if (sql) {
      try {
        await pool.execute(sql, params);
        res.json({ success: true });
      } catch (sqlErr) {
        console.error('SQL error:', sql, params, sqlErr);
        res.status(500).json({ error: sqlErr.message, sql, params });
      }
    } else {
      res.status(400).json({ error: 'Invalid update parameters' });
    }
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE transaction
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing or invalid id' });
  try {
    await pool.execute('DELETE FROM transactions WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
