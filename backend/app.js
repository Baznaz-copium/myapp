// backend/app.js
// Main Express app entry point. Loads all routers and middleware.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRouter = require('./api/auth');
const consolesRouter = require('./api/consoles');
const leaderboardRouter = require('./api/leaderboard');
const moneyLogsRouter = require('./api/money_logs');
const sessionsRouter = require('./api/sessions');
const settingsRouter = require('./api/settings');
const transactionsRouter = require('./api/transactions');
const usersRouter = require('./api/users');
const consumationRouter = require('./api/consumation');
const backupRouter = require('./api/backup'); // Import backup router
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/consoles', consolesRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/money_logs', moneyLogsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/consumation', consumationRouter);
app.use('/api/backup', backupRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;
app.listen(3001, '0.0.0.0', () => {
  console.log('Server running on port 3001');
});
