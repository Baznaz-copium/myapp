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

// List all consumables
router.get('/list', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM consumables');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add consumable
router.post('/add', async (req, res) => {
  const { name, type, stock, unit_price, total_cost, sell_price } = req.body;
  if (!name || !type || stock === undefined || unit_price === undefined || total_cost === undefined || sell_price === undefined) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    await pool.execute(
      'INSERT INTO consumables (name, type, stock, unit_price, total_cost, sell_price) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type, stock, unit_price, total_cost, sell_price]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Sell consumable
router.post('/sell', async (req, res) => {
  const { id, amount, sell_price } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [update] = await conn.execute('UPDATE consumables SET stock = stock - ? WHERE id = ? AND stock >= ?', [amount, id, amount]);
    if (update.affectedRows > 0) {
      await conn.execute('INSERT INTO consumable_sales (consumable_id, amount, sell_price) VALUES (?, ?, ?)', [id, amount, sell_price]);
      const reason = 'sell';
      const negativeAmount = -Math.abs(amount);
      await conn.execute('INSERT INTO stock_moves (consumable_id, m_change, reason) VALUES (?, ?, ?)', [id, negativeAmount, reason]);
      await conn.commit();
      res.json({ success: true });
    } else {
      await conn.rollback();
      res.json({ success: false, error: 'Not enough stock' });
    }
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// Update consumable
router.put('/update', async (req, res) => {
  const { id, name, stock, unit_price, total_cost, sell_price } = req.body;
  try {
    await pool.execute(
      'UPDATE consumables SET name=?, stock=?, unit_price=?, total_cost=?, sell_price=? WHERE id=?',
      [name, stock, unit_price, total_cost, sell_price, id]
    );
    // Calculate stock change
    const [oldRows] = await pool.query('SELECT stock FROM consumables WHERE id=?', [id]);
    const oldStock = oldRows.length ? oldRows[0].stock : null;
    const change = stock - oldStock;
    if (change !== 0) {
      const reason = 'edit';
      await pool.execute('INSERT INTO stock_moves (consumable_id, m_change, reason) VALUES (?, ?, ?)', [id, change, reason]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Revenue
router.get('/revenue', async (req, res) => {
  const period = req.query.period || 'today';
  let where = '1';
  if (period === 'today') where = 'DATE(created_at) = CURDATE()';
  else if (period === 'week') where = 'YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
  else if (period === 'month') where = 'YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())';
  try {
    const [rows] = await pool.query(`SELECT SUM(sell_price * amount) as revenue FROM consumable_sales WHERE ${where}`);
    res.json({ revenue: rows[0]?.revenue || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search
router.get('/search', async (req, res) => {
  const q = req.query.q || '';
  const type = req.query.type || '';
  let where = '1';
  const params = [];
  if (q) { where += ' AND name LIKE ?'; params.push(`%${q}%`); }
  if (type) { where += ' AND type = ?'; params.push(type); }
  try {
    const [rows] = await pool.query(`SELECT * FROM consumables WHERE ${where}`, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Report
router.get('/report', async (req, res) => {
  const { type, from, to } = req.query;
  let where = '1';
  const params = [];
  if (type) { where += ' AND c.type=?'; params.push(type); }
  if (from) { where += ' AND cs.created_at >= ?'; params.push(from); }
  if (to) { where += ' AND cs.created_at <= ?'; params.push(`${to} 23:59:59`); }
  try {
    // Sales history
    const [sales] = await pool.query(`SELECT cs.*, c.name, c.type FROM consumable_sales cs JOIN consumables c ON cs.consumable_id = c.id WHERE ${where} ORDER BY cs.created_at DESC`, params);
    // Revenue/profit
    const [rev] = await pool.query(`SELECT SUM(cs.amount * cs.sell_price) as revenue, SUM(cs.amount * (cs.sell_price - c.unit_price) * cs.amount) as profit FROM consumable_sales cs JOIN consumables c ON cs.consumable_id = c.id WHERE ${where}`, params);
    // Stock movement
    const [stock_moves] = await pool.query(`SELECT sm.created_at as date, c.name, c.type, sm.m_change as change, sm.reason FROM stock_moves sm JOIN consumables c ON sm.consumable_id = c.id WHERE ${where} ORDER BY sm.created_at DESC`, params);
    res.json({
      sales,
      revenue: rev[0]?.revenue || 0,
      profit: rev[0]?.profit || 0,
      stock_moves
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete
router.delete('/delete', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing ID' });
  try {
    await pool.execute('DELETE FROM consumables WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
