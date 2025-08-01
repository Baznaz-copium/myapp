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
  const { name, type, stock, unit_price, total_cost, sell_price, barcode } = req.body;
  if (!name || !type || stock === undefined || unit_price === undefined || total_cost === undefined || sell_price === undefined || !barcode) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    await pool.execute(
      'INSERT INTO consumables (name, type, stock, unit_price, total_cost, sell_price, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, type, stock, unit_price, total_cost, sell_price, barcode]
    );
    res.json({ success: true });
    const io = req.app.get('io');
    io.emit('consumables-updated');
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

    // 1. Check stock
    const [rows] = await conn.query('SELECT stock FROM consumables WHERE id=? FOR UPDATE', [id]);
    if (!rows.length || Number(rows[0].stock) < Number(amount)) {
      await conn.rollback();
      return res.json({ success: false, error: 'Not enough stock' });
    }

    // 2. Create a new sale
    const [saleResult] = await conn.execute('INSERT INTO sales () VALUES ()');
    const sale_id = saleResult.insertId;

    // 3. Update stock
    await conn.execute('UPDATE consumables SET stock = stock - ? WHERE id = ?', [amount, id]);

    // 4. Insert sale item
    await conn.execute(
      'INSERT INTO sale_items (sale_id, consumable_id, amount, sell_price) VALUES (?, ?, ?, ?)',
      [sale_id, id, amount, sell_price]
    );

    // 5. Stock move
    await conn.execute(
      'INSERT INTO stock_moves (consumable_id, m_change, reason) VALUES (?, ?, ?)',
      [id, -Math.abs(amount), 'sell']
    );

    await conn.commit();
    res.json({ success: true, sale_id });
    const io = req.app.get('io');
    io.emit('consumables-updated');
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// Update consumable
router.put('/update', async (req, res) => {
  const { id, name, stock, unit_price, total_cost, sell_price, barcode } = req.body;
  try {
    await pool.execute(
      'UPDATE consumables SET name=?, stock=?, unit_price=?, total_cost=?, sell_price=?, barcode=? WHERE id=?',
      [name, stock, unit_price, total_cost, sell_price, barcode, id]
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
    const io = req.app.get('io');
    io.emit('consumables-updated');
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// (Removed duplicate/legacy /revenue endpoint using consumable_sales)

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
  try {
    // Fetch all sales (from sales_items and sales tables)
    const [sales] = await pool.query(
      `SELECT si.*, c.name, c.type, s.created_at
       FROM sale_items si
       JOIN consumables c ON si.consumable_id = c.id
       JOIN sales s ON si.sale_id = s.id
       ORDER BY s.created_at DESC`
    );

    // Fetch all stock moves
    const [stock_moves] = await pool.query(
      `SELECT sm.created_at as date, c.name, c.type, sm.m_change as \`change\`, sm.reason
       FROM stock_moves sm
       JOIN consumables c ON sm.consumable_id = c.id
       ORDER BY sm.created_at DESC`
    );

    // Calculate total revenue and profit for all time
    const [rev] = await pool.query(
      `SELECT 
         SUM(si.amount * si.sell_price) as revenue, 
         SUM(si.amount * (si.sell_price - c.unit_price)) as profit
       FROM sale_items si
       JOIN consumables c ON si.consumable_id = c.id`
    );

    res.json({
      sales,
      revenue: rev[0]?.revenue || 0,
      profit: rev[0]?.profit || 0,
      stock_moves
    });
  } catch (err) {
    console.error("REPORT ERROR:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Revenue
router.get('/revenue', async (req, res) => {
  const period = req.query.period || 'today';
  let where = '1';
  if (period === 'today') where = 'DATE(s.created_at) = CURDATE()';
  else if (period === 'week') where = 'YEARWEEK(s.created_at, 1) = YEARWEEK(CURDATE(), 1)';
  else if (period === 'month') where = 'YEAR(s.created_at) = YEAR(CURDATE()) AND MONTH(s.created_at) = MONTH(CURDATE())';
  try {
    const [rows] = await pool.query(`
      SELECT SUM(si.sell_price * si.amount) as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE ${where}
    `);
    res.json({ revenue: rows[0]?.revenue || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Multi-item sale (receipt)
router.post('/multi-sell', async (req, res) => {
  const { items } = req.body; // items: [{ consumable_id, amount, sell_price }]
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items to sell' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Create a new sale
    const [saleResult] = await conn.execute('INSERT INTO sales () VALUES ()');
    const sale_id = saleResult.insertId;

    // 2. For each item, update stock and insert into sale_items
    for (const item of items) {
      // Check stock
      const [rows] = await conn.query('SELECT stock FROM consumables WHERE id=? FOR UPDATE', [item.consumable_id]);
      if (!rows.length || Number(rows[0].stock) < Number(item.amount)) {
        await conn.rollback();
        return res.status(400).json({ error: `Not enough stock for item ID ${item.consumable_id}` });
      }
      // Update stock
      await conn.execute('UPDATE consumables SET stock = stock - ? WHERE id = ?', [item.amount, item.consumable_id]);
      // Insert sale item
      await conn.execute(
        'INSERT INTO sale_items (sale_id, consumable_id, amount, sell_price) VALUES (?, ?, ?, ?)',
        [sale_id, item.consumable_id, item.amount, item.sell_price]
      );
      // Stock move
      await conn.execute(
        'INSERT INTO stock_moves (consumable_id, m_change, reason) VALUES (?, ?, ?)',
        [item.consumable_id, -Math.abs(item.amount), 'multi-sell']
      );
    }

    await conn.commit();
    const io = req.app.get('io');
    io.emit('consumables-updated');
    res.json({ success: true, sale_id });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
