require('dotenv').config();

const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const helmet   = require('helmet');
const pool     = require('./db/pool');

const authRoutes      = require('./routes/auth');
const roomRoutes      = require('./routes/rooms');
const attachWebSocket = require('./socket/gameHandler');

const app    = express();
const server = http.createServer(app);

// Ensure bot user exists in DB (placeholder for bot slot in rooms)
async function seedBotUser() {
  try {
    await pool.query(`
      INSERT INTO users (id, username, email, password)
      VALUES ('00000000-0000-0000-0000-000000000001', 'BOT', 'bot@shasn.internal', 'no-auth')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('Bot user ready');
  } catch (e) { console.error('Bot user seed failed:', e.message); }
}
seedBotUser();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  return next(err);
});

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next(); });
}

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
app.use('/auth',  authRoutes);
app.use('/rooms', roomRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Internal server error' }); });

attachWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
Backend ready
HTTP -> http://localhost:${PORT}
WS   -> ws://localhost:${PORT}/ws
  `);
});

module.exports = { app, server };
