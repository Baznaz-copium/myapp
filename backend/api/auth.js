const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const router = express.Router();

// MySQL connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

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

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, email, password_hash, role, active FROM users WHERE username = ?',
      [username]
    );
    const user = rows[0];
    if (user && await bcrypt.compare(password, user.password_hash)) {
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          active: user.active
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
