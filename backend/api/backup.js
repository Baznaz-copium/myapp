/**
 * Backup API routes for exporting, importing, and clearing database data.
 * 
 * Usage:
 *   - GET /api/backup/export: Download all data as JSON.
 *   - POST /api/backup/import: Upload a JSON backup to restore data.
 *   - POST /api/backup/clear: Dangerously clear all data from tables.
 * 
 * This module uses Express, Multer for file uploads, and a database pool.
 */

const express = require('express');
const pool = require('./db');
const multer = require('multer');
const fs = require('fs');
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

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

// Helper: Convert ISO string to MySQL DATETIME
function isoToMysqlDatetime(isoString) {
  if (!isoString || typeof isoString !== 'string') return isoString;
  if (!isoString.includes('T')) return isoString;
  return isoString.replace('T', ' ').replace('Z', '').split('.')[0];
}

// GET /api/backup/export - Export all data as JSON
router.get('/export', async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM settings');
    const [users] = await pool.query('SELECT * FROM users');
    const [transactions] = await pool.query('SELECT * FROM transactions');
    const [consoles] = await pool.query('SELECT * FROM consoles');
    const [consumables] = await pool.query('SELECT * FROM consumables');
    const [stock_moves] = await pool.query('SELECT * FROM stock_moves');
    const [consumable_sales] = await pool.query('SELECT * FROM consumable_sales');
    const [sessions] = await pool.query('SELECT * FROM sessions');
    const [money_logs] = await pool.query('SELECT * FROM money_logs');
    const [leaderboard] = await pool.query('SELECT * FROM leaderboard');
    // Add more tables as needed

    const backup = {
      settings,
      users,
      transactions,
      consoles,
      consumables,
      stock_moves,
      consumable_sales,
      leaderboard,
      sessions,
      money_logs
      // Add more tables as needed
    };

    res.setHeader('Content-Disposition', 'attachment; filename=backup.json');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to clear and restore a table, with DATETIME fix
async function clearAndRestoreTable(tableName, rows) {
  await pool.query(`DELETE FROM \`${tableName}\``);
  for (const row of rows) {
    const newRow = { ...row };
    for (const key in newRow) {
      if (
        key.endsWith('_at') ||
        key === 'createdAt' ||
        key === 'updatedAt' ||
        key === 'created_at' ||
        key === 'updated_at' ||
        key === 'startTime' ||
        key === 'endTime'   ||
        key == 'date' ||
        key === 'sessionDate' 
      ) {
        newRow[key] = isoToMysqlDatetime(newRow[key]);
      }
    }
    await pool.query(`INSERT INTO \`${tableName}\` SET ?`, newRow);
  }
}

// POST /api/backup/import - Import data from uploaded JSON file
router.post('/import', upload.single('backup'), async (req, res) => {
  try {
    const fileContent = await fs.promises.readFile(req.file.path, 'utf8');
    const data = JSON.parse(fileContent);

    // List of tables to restore
    const tables = [
      'settings',
      'users',
      'transactions',
      'consoles',
      'consumables',
      'stock_moves',
      'consumable_sales',
      'sessions',
      'money_logs',
      'leaderboard'
    ];

    for (const table of tables) {
      if (data[table]) {
        await clearAndRestoreTable(table, data[table]);
      }
    }

    await fs.promises.unlink(req.file.path); // Clean up uploaded file asynchronously
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/backup/clear - Clear all data (dangerous!)
router.post('/clear', async (req, res) => {
  let connection;
  try {

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Example: clear all tables (customize as needed)
    await connection.query('DELETE FROM settings');
    await connection.query('DELETE FROM users');
    await connection.query('DELETE FROM transactions');
    await connection.query('DELETE FROM consoles');
    await connection.query('DELETE FROM sessions');
    await connection.query('DELETE FROM leaderboard');
    await connection.query('DELETE FROM money_logs');
    await connection.query('DELETE FROM consumables');
    await connection.query('DELETE FROM stock_moves');
    await connection.query('DELETE FROM consumable_sales');
    // Add more tables as needed

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;