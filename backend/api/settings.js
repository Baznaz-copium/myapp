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

// GET settings
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings LIMIT 1');
    if (rows.length) {
      const settings = rows[0];
      settings.soundEffects = Number(settings.soundEffects) === 1;
      res.json(settings);
    } else {
      res.status(404).json({ error: 'Settings not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST/PUT update settings
router.post('/', updateSettings);
router.put('/', updateSettings);

async function updateSettings(req, res) {
  const data = req.body;
  data.soundEffects = data.soundEffects ? 1 : 0;
  try {
    await pool.execute(
      `UPDATE settings SET pricePerHour=?, currency=?, businessName=?, businessPhone=?, businessAddress=?, taxRate=?, autoStopOnTimeUp=?, allowExtensions=?, requireCustomerInfo=?, language=?, theme=?, soundEffects=?`,
      [
        data.pricePerHour,
        data.currency,
        data.businessName,
        data.businessPhone,
        data.businessAddress,
        data.taxRate,
        data.autoStopOnTimeUp,
        data.allowExtensions,
        data.requireCustomerInfo,
        data.language,
        data.theme,
        data.soundEffects
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = router;
