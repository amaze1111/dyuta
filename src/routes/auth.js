const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool     = require('../db/pool');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(row) {
  if (!row) return row;
  const { password: _password, ...safeUser } = row;
  return {
    ...safeUser,
    wins: Number(safeUser.wins ?? 0),
    losses: Number(safeUser.losses ?? 0),
  };
}

function withDebug(req, payload, error) {
  if (req.get('x-debug-auth') !== '1') return payload;
  return {
    ...payload,
    debug: {
      code: error?.code ?? null,
      detail: error?.detail ?? null,
      constraint: error?.constraint ?? null,
      message: error?.message ?? null,
    },
  };
}

async function insertUserWithFallback({ username, email, hash }) {
  const userId = uuidv4();
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (id, username, email, password, avatar_seed)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, username, email, hash, username]
    );
    return rows[0];
  } catch (e) {
    // Older production schemas may not yet have avatar_seed.
    if (e.code !== '42703') throw e;
    const { rows } = await pool.query(
      `INSERT INTO users (id, username, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, username, email, hash]
    );
    return rows[0];
  }
}

// POST /auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }
  if (username.length < 3 || username.length > 32) {
    return res.status(400).json({ error: 'username must be 3–32 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const user = await insertUserWithFallback({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      hash,
    });
    res.status(201).json({ user: sanitizeUser(user), token: signToken(user) });
  } catch (e) {
    if (e.code === '23505') { // unique violation
      const field = e.constraint?.includes('email') ? 'email' : 'username';
      return res.status(409).json({ error: `That ${field} is already taken` });
    }
    console.error(e);
    res.status(500).json(withDebug(req, { error: 'Registration failed' }, e));
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ user: sanitizeUser(user), token: signToken(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json(withDebug(req, { error: 'Login failed' }, e));
  }
});

// GET /auth/me  (requires token)
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, wins, losses, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not fetch user' });
  }
});

module.exports = router;
