const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { v4: uuidv4 } = require('uuid');
const pool     = require('../db/pool');

const router = express.Router();
const googleClient = new OAuth2Client();

function signToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(row) {
  if (!row) return row;
  const safeUser = { ...row };
  delete safeUser.password;
  delete safeUser.password_hash;
  delete safeUser.hashed_password;
  delete safeUser.passhash;
  delete safeUser.passwd;
  return {
    ...safeUser,
    wins: Number(safeUser.wins ?? 0),
    losses: Number(safeUser.losses ?? 0),
  };
}

function withDebug(req, payload, error, extra = {}) {
  if (req.get('x-debug-auth') !== '1') return payload;
  return {
    ...payload,
    debug: {
      code: error?.code ?? null,
      detail: error?.detail ?? null,
      constraint: error?.constraint ?? null,
      message: error?.message ?? null,
      ...extra,
    },
  };
}

async function getUserTableColumns() {
  const { rows } = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
  `);
  return rows.map((row) => row.column_name);
}

function pickFirstColumn(columns, candidates) {
  return candidates.find((candidate) => columns.includes(candidate)) ?? null;
}

async function insertUser({ username, email, hash, displayName = username, avatarSeed = username }) {
  const columns = await getUserTableColumns();
  const userId = uuidv4();
  const passwordColumn = pickFirstColumn(columns, [
    'password',
    'password_hash',
    'hashed_password',
    'passhash',
    'passwd',
  ]);

  if (!passwordColumn) {
    const error = new Error('No password column found on users table');
    error.code = 'NO_PASSWORD_COLUMN';
    error.columns = columns;
    throw error;
  }

  const insertColumns = ['id', 'username', 'email', passwordColumn];
  const values = [userId, username, email, hash];

  if (columns.includes('display_name')) {
    insertColumns.push('display_name');
    values.push(displayName);
  }

  if (columns.includes('avatar_seed')) {
    insertColumns.push('avatar_seed');
    values.push(avatarSeed);
  }

  const placeholders = insertColumns.map((_, index) => `$${index + 1}`).join(', ');
  const query = `INSERT INTO users (${insertColumns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function findUserByEmail(email) {
  const columns = await getUserTableColumns();
  const passwordColumn = pickFirstColumn(columns, [
    'password',
    'password_hash',
    'hashed_password',
    'passhash',
    'passwd',
  ]);
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return { user: rows[0], columns, passwordColumn };
}

function normalizeUsernameBase(value, fallback = 'player') {
  const cleaned = (value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return (cleaned || fallback).slice(0, 24);
}

async function ensureUniqueUsername(base) {
  const prefix = normalizeUsernameBase(base);
  for (let attempt = 0; attempt < 20; attempt++) {
    const suffix = attempt === 0 ? '' : `_${Math.random().toString(36).slice(2, 6)}`;
    const username = `${prefix}${suffix}`.slice(0, 32);
    const { rows } = await pool.query('SELECT 1 FROM users WHERE username = $1 LIMIT 1', [username]);
    if (rows.length === 0) return username;
  }
  return `${prefix}_${uuidv4().slice(0, 6)}`.slice(0, 32);
}

async function loginOrCreateSocialUser({ email, name, provider, providerUserId }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing.user) return existing.user;

  const username = await ensureUniqueUsername(name || normalizedEmail.split('@')[0] || provider);
  const hash = await bcrypt.hash(`social:${provider}:${providerUserId}:${uuidv4()}`, 12);
  return insertUser({
    username,
    email: normalizedEmail,
    hash,
    displayName: name || username,
    avatarSeed: username,
  });
}

async function verifyGoogleIdToken(idToken) {
  const audience = process.env.GOOGLE_WEB_CLIENT_ID;
  if (!audience) {
    const error = new Error('GOOGLE_WEB_CLIENT_ID is not configured');
    error.statusCode = 500;
    throw error;
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience,
  });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload?.sub) {
    const error = new Error('Google account is missing required identity fields');
    error.statusCode = 400;
    throw error;
  }
  return {
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    providerUserId: payload.sub,
  };
}

async function verifyFacebookAccessToken(accessToken) {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) {
    const error = new Error('Facebook app credentials are not configured');
    error.statusCode = 500;
    throw error;
  }

  const debugUrl = new URL('https://graph.facebook.com/debug_token');
  debugUrl.searchParams.set('input_token', accessToken);
  debugUrl.searchParams.set('access_token', `${appId}|${appSecret}`);
  const debugResp = await fetch(debugUrl);
  const debugJson = await debugResp.json();
  const debugData = debugJson?.data;
  if (!debugResp.ok || !debugData?.is_valid || debugData.app_id !== appId) {
    const error = new Error('Invalid Facebook access token');
    error.statusCode = 401;
    throw error;
  }

  const profileUrl = new URL('https://graph.facebook.com/me');
  profileUrl.searchParams.set('fields', 'id,name,email');
  profileUrl.searchParams.set('access_token', accessToken);
  const profileResp = await fetch(profileUrl);
  const profile = await profileResp.json();
  if (!profileResp.ok || !profile?.id) {
    const error = new Error('Could not fetch Facebook profile');
    error.statusCode = 400;
    throw error;
  }

  const email = profile.email || `facebook_${profile.id}@facebook.local`;
  return {
    email,
    name: profile.name || `facebook_${profile.id}`,
    providerUserId: profile.id,
  };
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
    const user = await insertUser({
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
    res.status(500).json(withDebug(req, { error: 'Registration failed' }, e, { columns: e.columns ?? null }));
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const { user, columns, passwordColumn } = await findUserByEmail(email.toLowerCase().trim());
    const storedHash = passwordColumn ? user?.[passwordColumn] : null;
    if (!user || !storedHash || !(await bcrypt.compare(password, storedHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ user: sanitizeUser(user), token: signToken(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json(withDebug(req, { error: 'Login failed' }, e, { columns: e.columns ?? null }));
  }
});

router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Google ID token is required' });
  }

  try {
    const profile = await verifyGoogleIdToken(idToken);
    const user = await loginOrCreateSocialUser({ ...profile, provider: 'google' });
    res.json({ user: sanitizeUser(user), token: signToken(user) });
  } catch (e) {
    console.error(e);
    const statusCode = e.statusCode || 500;
    const fallback = statusCode == 401 ? 'Google login failed' : 'Could not sign in with Google';
    res.status(statusCode).json(withDebug(req, { error: fallback }, e));
  }
});

router.post('/facebook', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: 'Facebook access token is required' });
  }

  try {
    const profile = await verifyFacebookAccessToken(accessToken);
    const user = await loginOrCreateSocialUser({ ...profile, provider: 'facebook' });
    res.json({ user: sanitizeUser(user), token: signToken(user) });
  } catch (e) {
    console.error(e);
    const statusCode = e.statusCode || 500;
    const fallback = statusCode == 401 ? 'Facebook login failed' : 'Could not sign in with Facebook';
    res.status(statusCode).json(withDebug(req, { error: fallback }, e));
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
