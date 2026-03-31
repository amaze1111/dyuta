/**
 * SHASN Bot Engine
 * Makes strategic decisions for the AI opponent (slot 2).
 * Called by the socket handler after the bot's ideology card is drawn.
 */

const engine = require('./gameEngine');

// ─── Bot difficulty levels ────────────────────────────────────────────────────
// easy:   random decisions
// medium: basic strategy (greedy)
// hard:   full strategy (zone control + blocking)

const DIFFICULTY = process.env.BOT_DIFFICULTY || 'medium';

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Run a full bot turn: answer ideology card + take all affordable actions.
 * Returns the final game state after all bot moves.
 */
async function runBotTurn(state, botSlot = 2) {
  let current = JSON.parse(JSON.stringify(state));

  // Step 1: Answer ideology card
  if (current.phase === 'ideology' && current.currentCard) {
    current = botAnswerCard(current, botSlot);
  }

  // Step 2: Take actions until bot decides to end turn
  let safetyLimit = 20; // prevent infinite loops
  while (current.phase === 'action' && current.currentSlot === botSlot && safetyLimit-- > 0) {
    const action = chooseBotAction(current, botSlot);
    if (!action) break; // bot chose to end turn

    const result = executeBotAction(current, botSlot, action);
    if (!result.ok) break; // action failed, end turn
    current = result.state;

    if (current.phase === 'finished') break;

    // Small delay feel (handled by caller via setTimeout)
  }

  // Step 3: End turn if still in action phase
  if (current.phase === 'action' && current.currentSlot === botSlot) {
    const endResult = engine.endTurn(current, botSlot);
    if (endResult.ok) current = endResult.state;
  }

  return current;
}

// ─── Answer ideology card ─────────────────────────────────────────────────────

function botAnswerCard(state, botSlot) {
  const card = state.currentCard;
  if (!card) return state;

  let choice;
  if (DIFFICULTY === 'easy') {
    choice = Math.random() < 0.5 ? 'a' : 'b';
  } else {
    // Medium/Hard: pick the option that gives the most total resources
    const aTotal = Object.values(card.a.resources).reduce((s, v) => s + v, 0);
    const bTotal = Object.values(card.b.resources).reduce((s, v) => s + v, 0);

    if (DIFFICULTY === 'hard') {
      // Also consider which ideology we want to build up
      const bot = state.players.find(p => p.slot === botSlot);
      const aScore = aTotal + ideologyBonus(bot, card.a.ideology);
      const bScore = bTotal + ideologyBonus(bot, card.b.ideology);
      choice = aScore >= bScore ? 'a' : 'b';
    } else {
      choice = aTotal >= bTotal ? 'a' : 'b';
    }
  }

  const result = engine.answerCard(state, botSlot, choice);
  return result.ok ? result.state : state;
}

// ─── Choose next action ───────────────────────────────────────────────────────

function chooseBotAction(state, botSlot) {
  const bot = state.players.find(p => p.slot === botSlot);
  const opponent = state.players.find(p => p.slot !== botSlot);
  if (!bot) return null;

  const affordableSoldierCards = state.SoldierCards.filter(c => canBotAfford(bot, c.cost));
  const canBuyConspiracy = bot.totalResources >= 4 || 
    Object.values(bot).filter(v => typeof v === 'number').some(() => false); // recalc below

  const totalRes = bot.funds + bot.clout + bot.media + bot.trust;
  const canBuyAnyConspiracy = totalRes >= 4;
  const hasConspiracies = bot.conspiracies && bot.conspiracies.length > 0;

  if (DIFFICULTY === 'easy') {
    return chooseEasyAction(state, botSlot, affordableSoldierCards, canBuyAnyConspiracy, hasConspiracies);
  } else if (DIFFICULTY === 'medium') {
    return chooseMediumAction(state, botSlot, bot, opponent, affordableSoldierCards, canBuyAnyConspiracy, hasConspiracies);
  } else {
    return chooseHardAction(state, botSlot, bot, opponent, affordableSoldierCards, canBuyAnyConspiracy, hasConspiracies);
  }
}

function chooseEasyAction(state, botSlot, affordableCards, canBuyConspiracy, hasConspiracies) {
  const options = [];
  if (affordableCards.length > 0) options.push('influence_Soldier');
  if (canBuyConspiracy) options.push('buy_conspiracy');
  if (hasConspiracies && Math.random() < 0.3) options.push('use_conspiracy');
  options.push(null); // end turn
  return options[Math.floor(Math.random() * options.length)];
}

function chooseMediumAction(state, botSlot, bot, opponent, affordableCards, canBuyConspiracy, hasConspiracies) {
  // Priority: influence Soldiers > use conspiracy if helpful > buy conspiracy > gerrymander > end turn

  // If we have a Soldier card that can lock a zone, do it immediately
  const urgentCard = findZoneLockingCard(state, botSlot, affordableCards);
  if (urgentCard) return { type: 'influence_Soldier', card: urgentCard };

  // Use conspiracy if we have one and it's useful
  if (hasConspiracies && bot.conspiracies.length > 0) {
    return { type: 'use_conspiracy', card: bot.conspiracies[0] };
  }

  // Place Soldiers in best zone
  if (affordableCards.length > 0) {
    const bestCard = chooseBestSoldierCard(state, botSlot, affordableCards);
    if (bestCard) return { type: 'influence_Soldier', card: bestCard };
  }

  // Buy conspiracy if we have enough resources and nothing else to do
  if (canBuyConspiracy && bot.funds + bot.clout + bot.media + bot.trust >= 6) {
    return { type: 'buy_conspiracy' };
  }

  // Gerrymander if possible
  const gerryMove = findGerrymanderMove(state, botSlot);
  if (gerryMove) return { type: 'gerrymander', ...gerryMove };

  return null; // end turn
}

function chooseHardAction(state, botSlot, bot, opponent, affordableCards, canBuyConspiracy, hasConspiracies) {
  // Hard bot: block opponent majorities, prioritise high-value zones

  // Emergency block: opponent is one peg away from majority in a high-value zone
  const blockMove = findBlockingMove(state, botSlot, affordableCards);
  if (blockMove) return blockMove;

  // Lock a zone we're leading in
  const lockCard = findZoneLockingCard(state, botSlot, affordableCards);
  if (lockCard) return { type: 'influence_Soldier', card: lockCard };

  // Use conspiracy strategically
  if (hasConspiracies) {
    const bestConspiracy = chooseBestConspiracy(state, botSlot);
    if (bestConspiracy) return { type: 'use_conspiracy', card: bestConspiracy };
  }

  // Place Soldiers in highest-value zone we can win
  if (affordableCards.length > 0) {
    const bestCard = chooseBestSoldierCard(state, botSlot, affordableCards);
    if (bestCard) return { type: 'influence_Soldier', card: bestCard };
  }

  // Gerrymander to disrupt opponent
  const gerryMove = findGerrymanderMove(state, botSlot);
  if (gerryMove) return { type: 'gerrymander', ...gerryMove };

  if (canBuyConspiracy) return { type: 'buy_conspiracy' };

  return null;
}

// ─── Execute bot action ───────────────────────────────────────────────────────

function executeBotAction(state, botSlot, action) {
  if (!action) return { ok: false };

  if (action.type === 'influence_Soldier') {
    const card = action.card;
    const zoneIndex = chooseBestZone(state, botSlot, card.SoldierCount);
    if (zoneIndex === -1) return { ok: false, error: 'No valid zone' };
    return engine.influenceSoldierCard(state, botSlot, card.id, zoneIndex);
  }

  if (action.type === 'gerrymander') {
    return engine.gerrymander(state, botSlot, action.fromZone, action.toZone, action.pegOwner);
  }

  if (action.type === 'buy_conspiracy') {
    // Pick a random conspiracy to buy
    const conspiracyIds = ['cc_01','cc_02','cc_03','cc_04','cc_05','cc_06','cc_07','cc_08','cc_09'];
    const pick = conspiracyIds[Math.floor(Math.random() * conspiracyIds.length)];
    return engine.buyConspiracy(state, botSlot, pick);
  }

  if (action.type === 'use_conspiracy') {
    const card = action.card;
    const params = buildConspiracyParams(state, botSlot, card);
    return engine.useConspiracy(state, botSlot, card.instanceId, params);
  }

  return { ok: false, error: 'Unknown action' };
}

// ─── Strategic helpers ────────────────────────────────────────────────────────

function canBotAfford(bot, cost) {
  return Object.entries(cost).every(([r, v]) => bot[r] >= v);
}

function ideologyBonus(bot, ideology) {
  // Slight bonus for building the ideology we're already invested in
  const counts = bot.ideologyCards;
  const dom = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  return ideology === dom ? 1 : 0;
}

function zoneScore(zone, botSlot) {
  // How desirable is this zone? Higher = better to place in
  if (engine.checkMajority(zone) !== null) return -1; // already decided

  const myPegs = zone.pegs.filter(p => p === botSlot).length;
  const oppPegs = zone.pegs.filter(p => p !== botSlot).length;
  const spacesLeft = zone.capacity - zone.pegs.length;

  // Score based on: point value, how close we are to majority, available space
  const proximityToMajority = myPegs / zone.majority;
  const leadBonus = myPegs > oppPegs ? 2 : 0;

  return zone.points * (1 + proximityToMajority) + leadBonus;
}

function chooseBestZone(state, botSlot, SoldierCount) {
  let best = -1, bestScore = -Infinity;
  state.zones.forEach((zone, index) => {
    if (engine.checkMajority(zone) !== null) return;
    if (zone.capacity - zone.pegs.length < SoldierCount) return;
    const score = zoneScore(zone, botSlot);
    if (score > bestScore) { bestScore = score; best = index; }
  });
  return best;
}

function chooseBestSoldierCard(state, botSlot, affordableCards) {
  // Pick the card that gives the most Soldiers going to our best zone
  return affordableCards.reduce((best, card) => {
    if (!best) return card;
    return card.SoldierCount > best.SoldierCount ? card : best;
  }, null);
}

function findZoneLockingCard(state, botSlot, affordableCards) {
  // Find a Soldier card that would complete a majority in a zone we're leading
  for (const card of affordableCards) {
    for (const zone of state.zones) {
      if (engine.checkMajority(zone) !== null) continue;
      const myPegs = zone.pegs.filter(p => p === botSlot).length;
      const spacesLeft = zone.capacity - zone.pegs.length;
      if (spacesLeft >= card.SoldierCount && myPegs + card.SoldierCount >= zone.majority) {
        return card;
      }
    }
  }
  return null;
}

function findBlockingMove(state, botSlot, affordableCards) {
  const oppSlot = botSlot === 1 ? 2 : 1;
  // Find zones where opponent is close to majority
  for (const [zoneIndex, zone] of state.zones.entries()) {
    if (engine.checkMajority(zone) !== null) continue;
    const oppPegs = zone.pegs.filter(p => p === oppSlot).length;
    const spacesLeft = zone.capacity - zone.pegs.length;
    const oppNeedsMore = zone.majority - oppPegs;

    if (oppNeedsMore <= 2 && spacesLeft > 0) {
      // Opponent is close — place our Soldiers here
      const card = affordableCards.find(c => c.SoldierCount <= spacesLeft);
      if (card) return { type: 'influence_Soldier', card, zoneIndex };
    }
  }
  return null;
}

function findGerrymanderMove(state, botSlot) {
  const oppSlot = botSlot === 1 ? 2 : 1;

  for (const [fromIndex, fromZone] of state.zones.entries()) {
    if (engine.gerrymanderRights(fromZone) !== botSlot) continue;
    if (engine.checkMajority(fromZone) !== null) continue;

    // Look for opponent pegs we can move OUT to a bad zone
    if (fromZone.pegs.includes(oppSlot)) {
      for (const toIndex of fromZone.adjacentZones) {
        const toZone = state.zones[toIndex];
        if (engine.checkMajority(toZone) !== null) continue;
        if (toZone.pegs.length >= toZone.capacity) continue;
        return { fromZone: fromIndex, toZone: toIndex, pegOwner: oppSlot };
      }
    }
  }
  return null;
}

function chooseBestConspiracy(state, botSlot) {
  const bot = state.players.find(p => p.slot === botSlot);
  if (!bot?.conspiracies?.length) return null;
  // Prefer attack cards over resource gain
  const priority = ['remove_opponent_Soldier', 'steal_funds', 'steal_media', 'place_free_Soldiers', 'gain_funds', 'gain_clout'];
  for (const effect of priority) {
    const card = bot.conspiracies.find(c => c.effect === effect);
    if (card) return card;
  }
  return bot.conspiracies[0];
}

function buildConspiracyParams(state, botSlot, card) {
  const oppSlot = botSlot === 1 ? 2 : 1;
  const params = {};

  if (card.effect === 'remove_opponent_Soldier') {
    // Target zone where opponent has most pegs but no majority
    const target = state.zones
      .map((z, i) => ({ z, i }))
      .filter(({ z }) => z.pegs.includes(oppSlot) && engine.checkMajority(z) === null)
      .sort((a, b) => b.z.pegs.filter(p => p === oppSlot).length - a.z.pegs.filter(p => p === oppSlot).length)[0];
    if (target) params.zoneIndex = target.i;
  }

  if (card.effect === 'place_free_Soldiers') {
    const best = chooseBestZone(state, botSlot, 3);
    if (best !== -1) params.zoneIndex = best;
  }

  if (card.effect === 'swing_vote') {
    // Move opponent peg from their strong zone to a worse one
    for (const [fromIndex, fromZone] of state.zones.entries()) {
      if (!fromZone.pegs.includes(oppSlot)) continue;
      if (engine.checkMajority(fromZone) !== null) continue;
      for (const toIndex of fromZone.adjacentZones) {
        const toZone = state.zones[toIndex];
        if (toZone.pegs.length < toZone.capacity && engine.checkMajority(toZone) === null) {
          params.fromZone = fromIndex;
          params.toZone = toIndex;
          params.pegOwner = oppSlot;
          break;
        }
      }
      if (params.fromZone !== undefined) break;
    }
  }

  return params;
}

module.exports = { runBotTurn };
