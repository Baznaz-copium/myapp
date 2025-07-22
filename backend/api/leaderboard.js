const express = require('express');
const pool = require('./db');
const router = express.Router();

// CORS middleware
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Helper: fetch all leaders
async function getLeaders() {
  const [rows] = await pool.query('SELECT * FROM leaderboard ORDER BY score DESC');
  let rank = 1;
  return rows.map(row => ({
    ...row,
    rank: rank++,
    achievements: row.achievements ? JSON.parse(row.achievements) : [],
    stats: row.stats ? JSON.parse(row.stats) : []
  }));
}

// GET /leaderboard or /leaderboard?id=3
router.get('/', async (req, res) => {
  try {
    if (req.query.id) {
      const [rows] = await pool.query('SELECT * FROM leaderboard WHERE id=? LIMIT 1', [req.query.id]);
      if (rows.length) {
        const row = rows[0];
        row.achievements = row.achievements ? JSON.parse(row.achievements) : [];
        row.stats = row.stats ? JSON.parse(row.stats) : [];
        res.json(row);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } else {
      res.json(await getLeaders());
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST add new leader
router.post('/', async (req, res) => {
  const { name, score = 0, avatar = '', achievements = [], stats = { gamesPlayed: 0, wins: 0, losses: 0 } } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO leaderboard (name, score, avatar, achievements, stats) VALUES (?, ?, ?, ?, ?)',
      [name, score, avatar, JSON.stringify(achievements), JSON.stringify(stats)]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update leader
router.put('/', async (req, res) => {
  const { id, name, score, avatar, achievements, stats } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name=?'); values.push(name); }
  if (score !== undefined) { fields.push('score=?'); values.push(score); }
  if (avatar !== undefined) { fields.push('avatar=?'); values.push(avatar); }
  if (achievements !== undefined) { fields.push('achievements=?'); values.push(JSON.stringify(achievements)); }
  if (stats !== undefined) { fields.push('stats=?'); values.push(JSON.stringify(stats)); }
  if (!fields.length) return res.status(400).json({ error: 'No valid fields' });
  values.push(id);
  try {
    await pool.execute(`UPDATE leaderboard SET ${fields.join(', ')} WHERE id=?`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE leader
router.delete('/', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  try {
    await pool.execute('DELETE FROM leaderboard WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
