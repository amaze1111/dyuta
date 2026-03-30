const WebSocket = require('ws');
const jwt       = require('jsonwebtoken');
const pool      = require('../db/pool');
const engine    = require('../services/gameEngine');
const bot       = require('../services/botEngine');

const rooms          = new Map(); // roomCode → Set<WebSocket>
const activeSessions = new Map(); // roomCode → gameState
const matchmakingQueue = new Map(); // userId → { ws, user } — players waiting for a match

function send(ws, event, payload = {}) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, ...payload }));
  } else {
    console.warn(`⚠️ send(${event}) dropped — ws not OPEN (readyState=${ws.readyState}, slot=${ws._slot})`);
  }
}

function broadcast(roomCode, event, payload = {}) {
  const clients = rooms.get(roomCode);
  if (!clients) return;
  const msg = JSON.stringify({ event, ...payload });
  clients.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); });
}

// Check DB for bot room (survives server restarts)
async function isBotRoom(code) {
  const { rows: [room] } = await pool.query('SELECT is_bot FROM rooms WHERE code = $1', [code]);
  return room?.is_bot === true;
}

module.exports = function attachWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url   = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) { ws.close(4001, 'Missing token'); return; }

    let user;
    try { user = jwt.verify(token, process.env.JWT_SECRET); }
    catch { ws.close(4001, 'Invalid token'); return; }

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    // Store user info on ws directly for easy access
    ws._user = user;
    ws._roomCode = null;
    ws._slot = null;

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }
      const { event, ...payload } = msg;

      switch (event) {
        case 'room:join':             await handleRoomJoin(ws, user, payload); break;
        case 'room:ready':            await handleReady(ws, user, payload); break;
        case 'ping':                  break; // keepalive — no response needed
        case 'room:leave':            handleRoomLeave(ws); break;
        case 'queue:join':            await handleQueueJoin(ws, user); break;
        case 'queue:cancel':          handleQueueCancel(ws, user); break;
        case 'game:answer_card':      await handleMutate(ws, payload.roomCode, s => engine.answerCard(s, ws._slot, payload.choice)); break;
        case 'game:influence_voter':  await handleMutate(ws, payload.roomCode, s => engine.influencevoterCard(s, ws._slot, payload.voterCardId, payload.zoneIndex)); break;
        case 'game:gerrymander':      await handleMutate(ws, payload.roomCode, s => engine.gerrymander(s, ws._slot, payload.fromZoneIndex, payload.toZoneIndex, payload.pegOwnerSlot, payload.rightsZoneIndex)); break;
        case 'game:buy_conspiracy':   await handleMutate(ws, payload.roomCode, s => engine.buyConspiracy(s, ws._slot, payload.payment || null)); break;
        case 'game:use_conspiracy':   await handleMutate(ws, payload.roomCode, s => engine.useConspiracy(s, ws._slot, payload.instanceId, payload.params || {})); break;
        case 'game:convert_resource': await handleMutate(ws, payload.roomCode, s => engine.convertResource(s, ws._slot, payload.from, payload.to)); break;
        case 'game:prospecting':      await handleMutate(ws, payload.roomCode, s => engine.prospecting(s, ws._slot, payload.from, payload.to)); break;
        case 'game:donations':        await handleMutate(ws, payload.roomCode, s => engine.donations(s, ws._slot)); break;
        case 'game:payback':          await handleMutate(ws, payload.roomCode, s => engine.payback(s, ws._slot, payload.zoneIndex)); break;
        case 'game:breaking_ground':  await handleMutate(ws, payload.roomCode, s => engine.breakingGround(s, ws._slot, payload.zoneIndex)); break;
        case 'game:tough_love':       await handleMutate(ws, payload.roomCode, s => engine.toughLove(s, ws._slot, payload.zoneIndex)); break;
        case 'game:helping_hands':    await handleMutate(ws, payload.roomCode, s => engine.helpingHands(s, ws._slot)); break;
        case 'game:end_turn':         await handleMutate(ws, payload.roomCode, s => engine.endTurn(s, ws._slot)); break;
        default: send(ws, 'game:error', { message: `Unknown event: ${event}` });
      }
    });

    ws.on('close', () => {
      const code = ws._roomCode;
      if (code) {
        const clients = rooms.get(code);
        if (clients) { clients.delete(ws); if (clients.size === 0) rooms.delete(code); }
      }
      // Remove from matchmaking queue if disconnected while waiting
      if (ws._user) matchmakingQueue.delete(ws._user.userId);
    });
  });

  const pingInterval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) { ws.terminate(); return; }
      ws.isAlive = false; ws.ping();
    });
  }, 30_000);

  wss.on('close', () => clearInterval(pingInterval));
  console.log('🔌 WebSocket server ready at /ws');
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

// ─── Matchmaking Queue ────────────────────────────────────────────────────────

function generateCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function handleQueueJoin(ws, user) {
  // Already in queue — ignore
  if (matchmakingQueue.has(user.userId)) {
    return send(ws, 'queue:waiting', { position: matchmakingQueue.size });
  }

  // Check if another player is waiting
  const waiting = [...matchmakingQueue.values()].find(e => e.ws.readyState === WebSocket.OPEN);

  if (waiting) {
    // Match found — create a room for both players
    matchmakingQueue.delete(waiting.user.userId);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let code, exists = true;
      while (exists) {
        code = generateCode();
        const { rows } = await client.query("SELECT id FROM rooms WHERE code = $1 AND status != 'finished'", [code]);
        exists = rows.length > 0;
      }
      const { rows: [room] } = await client.query(
        `INSERT INTO rooms (code, host_id) VALUES ($1, $2) RETURNING *`,
        [code, waiting.user.userId]
      );
      await client.query(
        `INSERT INTO room_players (room_id, user_id, slot, ideology, is_ready) VALUES ($1, $2, 1, 'none', false)`,
        [room.id, waiting.user.userId]
      );
      await client.query(
        `INSERT INTO room_players (room_id, user_id, slot, ideology, is_ready) VALUES ($1, $2, 2, 'none', false)`,
        [room.id, user.userId]
      );
      await client.query('COMMIT');

      console.log(`🎯 Matched ${waiting.user.username} vs ${user.username} in room ${code}`);

      // Notify both players
      send(waiting.ws, 'queue:matched', { roomCode: code });
      send(ws,         'queue:matched', { roomCode: code });
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Matchmaking error:', e);
      send(ws, 'game:error', { message: 'Matchmaking failed. Please try again.' });
      // Put the waiting player back
      matchmakingQueue.set(waiting.user.userId, waiting);
    } finally {
      client.release();
    }
  } else {
    // No one waiting — add to queue
    matchmakingQueue.set(user.userId, { ws, user });
    send(ws, 'queue:waiting', { position: matchmakingQueue.size });
    console.log(`⏳ ${user.username} joined matchmaking queue (${matchmakingQueue.size} waiting)`);
  }
}

function handleQueueCancel(ws, user) {
  matchmakingQueue.delete(user.userId);
  send(ws, 'queue:cancelled', {});
  console.log(`❌ ${user.username} left matchmaking queue`);
}

// ─── Leave Room (client navigated away — keep room alive) ─────────────────────

function handleRoomLeave(ws) {
  const code = ws._roomCode;
  if (!code) return;
  const clients = rooms.get(code);
  if (clients) {
    clients.delete(ws);
    if (clients.size === 0) rooms.delete(code);
  }
  ws._roomCode = null;
  // Do NOT delete the room or game state — player can rejoin
}

async function handleRoomJoin(ws, user, { roomCode }) {
  const code = roomCode?.toUpperCase();
  if (!code) return send(ws, 'game:error', { message: 'roomCode required' });
  try {
    const { rows: [room] } = await pool.query('SELECT * FROM rooms WHERE code = $1', [code]);
    if (!room) return send(ws, 'game:error', { message: 'Room not found' });

    const { rows: players } = await pool.query(
      `SELECT rp.slot, rp.ideology, rp.is_ready, u.username, u.id as user_id
       FROM room_players rp JOIN users u ON rp.user_id = u.id
       WHERE rp.room_id = $1 ORDER BY rp.slot`, [room.id]
    );

    const me = players.find(p => p.user_id === user.userId);
    if (!me) return send(ws, 'game:error', { message: 'You are not in this room' });

    if (!rooms.has(code)) rooms.set(code, new Set());
    // Remove any stale ws for this same slot (reconnection case)
    const existingClients = rooms.get(code);
    for (const existing of existingClients) {
      if (existing._slot === me.slot && existing !== ws) {
        existingClients.delete(existing);
      }
    }
    existingClients.add(ws);
    ws._roomCode = code;
    ws._slot = me.slot;

    if (room.status === 'playing') {
      let state = activeSessions.get(code);
      if (!state) {
        const { rows: [game] } = await pool.query(
          'SELECT state, id FROM games WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1', [room.id]
        );
        if (game) {
          const parsed = typeof game.state === 'string' ? JSON.parse(game.state) : game.state;
          state = { ...parsed, gameId: game.id };
          activeSessions.set(code, state);
        }
      }
      if (state) {
        // Sanitize state for this player (hide opponent conspiracies, add conspiracyCost)
        const mySlot = ws._slot;
        const sanitizedPlayers = state.players.map(p => {
          if (p.slot === mySlot) return p;
          return { ...p, conspiracies: p.conspiracies.map(() => ({ id: 'hidden', instanceId: 'hidden', name: '???', desc: 'Hidden', effect: 'hidden', cost: 0 })) };
        });
        const myPlayer = state.players.find(p => p.slot === mySlot);
        let conspiracyCost = 4;
        if (myPlayer && state.conspiracyDeck && state.conspiracyDeck.length > 0) {
          const topCard = engine.CONSPIRACY_CARDS.find(c => c.id === state.conspiracyDeck[0]);
          if (topCard) conspiracyCost = engine.getConspiracyCost(myPlayer, topCard.cost);
        }
        send(ws, 'game:state', { state: { ...state, currentCard: null, players: sanitizedPlayers, conspiracyCost }, mySlot });
        // If it's this player's turn and there's a card waiting, send it
        if (state.currentCard && state.currentSlot === ws._slot) {
          send(ws, 'game:card', { card: state.currentCard });
        }
      }
    }

    const botRoom = room.is_bot === true;
    // Send room:state to each player individually so we can include their mySlot
    const wsSet = rooms.get(code) || new Set();
    const roomPayload = {
      room: { id: room.id, code: room.code, status: room.status },
      players: players.map(p => ({
        slot: p.slot,
        username: p.slot === 2 && botRoom ? '🤖 Bot' : p.username,
        isReady: p.is_ready
      })),
      isBotRoom: botRoom,
    };
    for (const client of wsSet) {
      send(client, 'room:state', { ...roomPayload, mySlot: client._slot });
    }
    // Also send to the current ws if not in room set yet
    if (ws._slot && ![...wsSet].includes(ws)) {
      send(ws, 'room:state', { ...roomPayload, mySlot: ws._slot });
    }
  } catch (e) {
    console.error('room:join error', e);
    send(ws, 'game:error', { message: 'Failed to join room' });
  }
}

async function handleReady(ws, user, { roomCode }) {
  const code = roomCode?.toUpperCase();
  try {
    const { rows: [room] } = await pool.query("SELECT * FROM rooms WHERE code = $1 AND status = 'waiting'", [code]);
    if (!room) return send(ws, 'game:error', { message: 'Room not found or already started' });

    // Toggle human player ready
    await pool.query(
      'UPDATE room_players SET is_ready = NOT is_ready WHERE room_id = $1 AND user_id = $2',
      [room.id, user.userId]
    );

    const { rows: players } = await pool.query(
      `SELECT rp.slot, rp.ideology, rp.is_ready, u.username, u.id as user_id
       FROM room_players rp JOIN users u ON rp.user_id = u.id WHERE rp.room_id = $1`, [room.id]
    );

    const botRoom = room.is_bot === true;
    // Send room:state to each player individually so we can include their mySlot
    const wsSet = rooms.get(code) || new Set();
    const roomPayload = {
      room: { id: room.id, code: room.code, status: room.status },
      players: players.map(p => ({
        slot: p.slot,
        username: p.slot === 2 && botRoom ? '🤖 Bot' : p.username,
        isReady: p.is_ready
      })),
      isBotRoom: botRoom,
    };
    for (const client of wsSet) {
      send(client, 'room:state', { ...roomPayload, mySlot: client._slot });
    }
    // Also send to the current ws if not in room set yet
    if (ws._slot && ![...wsSet].includes(ws)) {
      send(ws, 'room:state', { ...roomPayload, mySlot: ws._slot });
    }

    if (botRoom) {
      // Bot room: start as soon as human is ready (bot slot is always ready)
      const humanPlayer = players.find(p => p.user_id === user.userId);
      if (humanPlayer?.is_ready) {
        console.log(`🤖 Starting bot game in room ${code}`);
        await startGame(code, room, players);
      }
    } else {
      // Multiplayer: all players must be ready
      const allReady = players.length === room.max_players && players.every(p => p.is_ready);
      if (allReady) await startGame(code, room, players);
    }
  } catch (e) {
    console.error('room:ready error', e);
    send(ws, 'game:error', { message: 'Failed to toggle ready' });
  }
}

async function handleMutate(ws, roomCode, mutateFn) {
  const code = roomCode?.toUpperCase();
  if (!ws._slot) return send(ws, 'game:error', { message: 'Not in a room' });

  let state = activeSessions.get(code);
  if (!state) return send(ws, 'game:error', { message: 'No active game' });

  const result = mutateFn(state);
  if (!result.ok) return send(ws, 'game:error', { message: result.error });

  let newState = result.state;

  // Auto-draw ideology card when switching to ideology phase
  if (newState.phase === 'ideology' && !newState.currentCard && newState.winner === null) {
    const drawn = engine.drawCard(newState);
    if (drawn.ok) newState = drawn.state;
  }

  newState = await persistAndBroadcast(code, newState, state.gameId);

  // If it's now the bot's turn, run bot after short delay
  const { rows: [room] } = await pool.query('SELECT is_bot FROM rooms WHERE code = $1', [code]);
  if (room?.is_bot && newState.currentSlot === 2 && newState.phase !== 'finished' && newState.winner === null) {
    setTimeout(() => runBotTurnForRoom(code, newState.gameId), 1200);
  }
}

async function runBotTurnForRoom(code, gameId) {
  let state = activeSessions.get(code);
  if (!state || state.winner !== null || state.phase === 'finished') return;
  if (state.currentSlot !== 2) return;

  try {

    if (state.phase === 'ideology' && !state.currentCard) {
      const drawn = engine.drawCard(state);
      if (drawn.ok) state = drawn.state;
    }

    let finalState = await bot.runBotTurn(state, 2);

    if (finalState.phase === 'ideology' && !finalState.currentCard && finalState.winner === null) {
      const drawn = engine.drawCard(finalState);
      if (drawn.ok) finalState = drawn.state;
    }

    await persistAndBroadcast(code, finalState, gameId);
  } catch (e) {
    console.error('Bot turn error:', e);
  }
}

async function persistAndBroadcast(code, state, gameId) {
  await pool.query(
    `UPDATE games SET state = $1, turn = $2, current_slot = $3, phase = $4, winner_slot = $5, updated_at = NOW() WHERE id = $6`,
    [JSON.stringify(state), state.turn, state.currentSlot, state.phase, state.winner ?? null, gameId]
  );
  activeSessions.set(code, { ...state, gameId });

  // Broadcast state to each player — strip currentCard + hide opponent conspiracy contents
  const wsSet = rooms.get(code) || new Set();
  for (const ws of wsSet) {
    if (!ws._slot) continue; // skip ws that haven't completed room:join yet
    const mySlot = ws._slot;
    const sanitizedPlayers = state.players.map(p => {
      if (p.slot === mySlot) return p; // own player: full data
      // Opponent: replace conspiracy cards with blind placeholders
      return {
        ...p,
        conspiracies: p.conspiracies.map(() => ({
          id: 'hidden', instanceId: 'hidden',
          name: '???', desc: 'Hidden', effect: 'hidden', cost: 0
        }))
      };
    });
    // Compute actual conspiracy cost for this player (peek top card)
    const myPlayer = state.players.find(p => p.slot === mySlot);
    let conspiracyCost = 4; // default
    if (myPlayer && state.conspiracyDeck && state.conspiracyDeck.length > 0) {
      const topCardId = state.conspiracyDeck[0];
      const topCard = engine.CONSPIRACY_CARDS.find(c => c.id === topCardId);
      if (topCard) conspiracyCost = engine.getConspiracyCost(myPlayer, topCard.cost);
    }
    const stateForPlayer = { ...state, currentCard: null, players: sanitizedPlayers, conspiracyCost };
    send(ws, 'game:state', { state: stateForPlayer, mySlot });
  }

  // Send card ONLY to the current player via separate event
  if (state.currentCard) {
        const currentWs = [...wsSet].find(w => w._slot === state.currentSlot);
    if (currentWs) {
      send(currentWs, 'game:card', { card: state.currentCard });
    } else {
      console.log(`❌ No WebSocket found for slot ${state.currentSlot}!`);
    }
  }

  if (state.winner !== null) await handleGameOver(code, state, gameId);
  return state;
}

async function startGame(code, room, players) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("UPDATE rooms SET status = 'playing', started_at = NOW() WHERE id = $1", [room.id]);

    const initialState = engine.createInitialState(
      players.map(p => ({
        slot: p.slot,
        userId: p.user_id,
        username: room.is_bot && p.slot === 2 ? 'Bot' : p.username
      }))
    );
    const { state } = engine.drawCard(initialState);

    const { rows: [game] } = await client.query(
      'INSERT INTO games (room_id, state, turn, current_slot, phase) VALUES ($1, $2, 1, 1, $3) RETURNING id',
      [room.id, JSON.stringify(state), state.phase]
    );

    activeSessions.set(code, { ...state, gameId: game.id });
    await client.query('COMMIT');

    // Send sanitized state to each player (no currentCard, no opponent conspiracies)
    const startWsSet = rooms.get(code) || new Set();
    for (const ws of startWsSet) {
      const stateForPlayer = { ...state, currentCard: null };
      send(ws, 'game:state', { state: stateForPlayer, mySlot: ws._slot });
    }
    // Send card only to slot 1 (first player)
    const slot1Ws = [...startWsSet].find(w => w._slot === 1);
    if (slot1Ws) send(slot1Ws, 'game:card', { card: state.currentCard });
    console.log(`🎮 Game started in room ${code} (bot: ${room.is_bot})`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('startGame error', e);
    broadcast(code, 'game:error', { message: 'Failed to start game' });
  } finally {
    client.release();
  }
}

async function handleGameOver(code, state, gameId) {
  const scores = engine.getScores(state.zones);
  await pool.query("UPDATE games SET phase = 'finished', winner_slot = $1 WHERE id = $2", [state.winner || null, gameId]);
  await pool.query("UPDATE rooms SET status = 'finished', finished_at = NOW() WHERE code = $1", [code]);
  const { rows: [room] } = await pool.query('SELECT is_bot FROM rooms WHERE code = $1', [code]);
  if (!room?.is_bot) {
    for (const player of state.players) {
      if (state.winner !== 0 && state.winner !== null) {
        const won = state.winner === player.slot;
        await pool.query(`UPDATE users SET ${won ? 'wins' : 'losses'} = ${won ? 'wins' : 'losses'} + 1 WHERE id = $1`, [player.userId]).catch(() => {});
      }
    }
  }
  broadcast(code, 'game:over', { winner: state.winner, scores });
  activeSessions.delete(code);
}

// Keep for backwards compatibility
module.exports.markAsBotRoom = function(code) {
  // No-op — bot status now stored in DB
};
