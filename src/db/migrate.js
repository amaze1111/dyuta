require('dotenv').config();
const pool = require('./pool');

const schema = `
-- ─── Users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    VARCHAR(32) UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  avatar_seed VARCHAR(64),                    -- used for procedural avatar generation
  wins        INTEGER DEFAULT 0,
  losses      INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Rooms ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(6) UNIQUE NOT NULL,     -- human-readable join code e.g. "KQXZ72"
  host_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  status      VARCHAR(20) DEFAULT 'waiting',  -- waiting | playing | finished
  max_players INTEGER DEFAULT 2,
  is_bot      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- ─── Room Players (join table) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_players (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  slot       INTEGER NOT NULL,               -- 1 or 2 (player order)
  ideology   VARCHAR(20) NOT NULL DEFAULT 'capitalist',
  is_ready   BOOLEAN DEFAULT FALSE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id),
  UNIQUE(room_id, slot)
);

-- ─── Games ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS games (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID REFERENCES rooms(id) ON DELETE CASCADE,
  state        JSONB NOT NULL DEFAULT '{}',  -- full serialised game state
  turn         INTEGER DEFAULT 1,
  current_slot INTEGER DEFAULT 1,           -- whose turn (1 or 2)
  phase        VARCHAR(20) DEFAULT 'ideology', -- ideology | action
  winner_slot  INTEGER,                     -- null until game ends
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Game Events (audit / replay log) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id    UUID REFERENCES games(id) ON DELETE CASCADE,
  slot       INTEGER NOT NULL,
  event_type VARCHAR(50) NOT NULL,          -- answer_card | place_voter | gerrymander | use_conspiracy | buy_conspiracy | end_turn
  payload    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_room_players_room ON room_players(room_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_seed VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;

ALTER TABLE room_players ADD COLUMN IF NOT EXISTS ideology VARCHAR(20) NOT NULL DEFAULT 'capitalist';
ALTER TABLE room_players ADD COLUMN IF NOT EXISTS is_ready BOOLEAN DEFAULT FALSE;
ALTER TABLE room_players ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE games ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('⟳ Running migrations...');
    await client.query(schema);
    console.log('✓ Database schema ready');
  } catch (err) {
    console.error('✗ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
