const engine = require('./gameEngine');

// easy:   random decisions
// medium: basic strategy (greedy)
// hard:   full strategy (zone control + blocking)
const DIFFICULTY = process.env.BOT_DIFFICULTY || 'medium';

function availableCards(state) {
  return state.soldierCards || [];
}

function cardUnits(card) {
  return card?.soldierCount ?? 0;
}

function totalBotResources(player) {
  return (player?.swarna || 0) + (player?.shakti || 0) + (player?.kirti || 0) + (player?.satya || 0);
}

async function runBotTurn(state, botSlot = 2) {
  let current = JSON.parse(JSON.stringify(state));

  if (current.phase === 'ideology' && current.currentCard) {
    current = botAnswerCard(current, botSlot);
  }

  let safetyLimit = 20;
  while (current.phase === 'action' && current.currentSlot === botSlot && safetyLimit-- > 0) {
    const action = chooseBotAction(current, botSlot);
    if (!action) break;

    const result = executeBotAction(current, botSlot, action);
    if (!result.ok) break;
    current = result.state;

    if (current.phase === 'finished') break;
  }

  if (current.phase === 'action' && current.currentSlot === botSlot) {
    const endResult = engine.endTurn(current, botSlot);
    if (endResult.ok) current = endResult.state;
  }

  return current;
}

function botAnswerCard(state, botSlot) {
  const card = state.currentCard;
  if (!card) return state;

  let choice;
  if (DIFFICULTY === 'easy') {
    choice = Math.random() < 0.5 ? 'a' : 'b';
  } else {
    const aTotal = Object.values(card.a.resources).reduce((s, v) => s + v, 0);
    const bTotal = Object.values(card.b.resources).reduce((s, v) => s + v, 0);

    if (DIFFICULTY === 'hard') {
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

function chooseBotAction(state, botSlot) {
  const bot = state.players.find(p => p.slot === botSlot);
  const opponent = state.players.find(p => p.slot !== botSlot);
  if (!bot) return null;

  const affordableCards = availableCards(state).filter(c => canBotAfford(bot, c.cost));
  const totalRes = totalBotResources(bot);
  const canBuyConspiracy = totalRes >= 4;
  const hasConspiracies = bot.conspiracies && bot.conspiracies.length > 0;

  if (DIFFICULTY === 'easy') {
    return chooseEasyAction(affordableCards, canBuyConspiracy, hasConspiracies);
  } else if (DIFFICULTY === 'medium') {
    return chooseMediumAction(state, botSlot, bot, opponent, affordableCards, canBuyConspiracy, hasConspiracies);
  } else {
    return chooseHardAction(state, botSlot, bot, opponent, affordableCards, canBuyConspiracy, hasConspiracies);
  }
}

function chooseEasyAction(affordableCards, canBuyConspiracy, hasConspiracies) {
  const options = [];
  if (affordableCards.length > 0) options.push({ type: 'influence_soldier', card: affordableCards[0] });
  if (canBuyConspiracy) options.push({ type: 'buy_conspiracy' });
  if (hasConspiracies && Math.random() < 0.3) options.push({ type: 'use_conspiracy' });
  options.push(null);
  return options[Math.floor(Math.random() * options.length)];
}

function chooseMediumAction(state, botSlot, bot, opponent, affordableCards, canBuyConspiracy, hasConspiracies) {
  const urgentCard = findZoneLockingCard(state, botSlot, affordableCards);
  if (urgentCard) return { type: 'influence_soldier', card: urgentCard };

  if (hasConspiracies && bot.conspiracies.length > 0) {
    return { type: 'use_conspiracy', card: bot.conspiracies[0] };
  }

  if (affordableCards.length > 0) {
    const bestCard = chooseBestSoldierCard(affordableCards);
    if (bestCard) return { type: 'influence_soldier', card: bestCard };
  }

  if (canBuyConspiracy && totalBotResources(bot) >= 6) {
    return { type: 'buy_conspiracy' };
  }

  const incursionMove = findIncursionMove(state, botSlot);
  if (incursionMove) return { type: 'incursion', ...incursionMove };

  return null;
}

function chooseHardAction(state, botSlot, bot, opponent, affordableCards, canBuyConspiracy, hasConspiracies) {
  const blockMove = findBlockingMove(state, botSlot, affordableCards);
  if (blockMove) return blockMove;

  const lockCard = findZoneLockingCard(state, botSlot, affordableCards);
  if (lockCard) return { type: 'influence_soldier', card: lockCard };

  if (hasConspiracies) {
    const bestConspiracy = chooseBestConspiracy(state, botSlot);
    if (bestConspiracy) return { type: 'use_conspiracy', card: bestConspiracy };
  }

  if (affordableCards.length > 0) {
    const bestCard = chooseBestSoldierCard(affordableCards);
    if (bestCard) return { type: 'influence_soldier', card: bestCard };
  }

  const incursionMove = findIncursionMove(state, botSlot);
  if (incursionMove) return { type: 'incursion', ...incursionMove } ;
  if (canBuyConspiracy) return { type: 'buy_conspiracy' };
  return null;
}

function executeBotAction(state, botSlot, action) {
  if (!action) return { ok: false }

  if (action.type === 'influence_soldier') {
    const card = action.card;
    const zoneIndex = action.zoneIndex ?? chooseBestZone(state, botSlot, cardUnits(card));
    if (zoneIndex === -1) return { ok: false, error: 'No valid zone' };
    return engine.influenceSoldierCard(state, botSlot, card.id, zoneIndex);
  }

  if (action.type === 'incursion') {
    return engine.incursion(state, botSlot, action.fromZone, action.toZone, action.pegOwner);
  }

  if (action.type === 'buy_conspiracy') {
    return engine.buyConspiracy(state, botSlot);
  }

  if (action.type === 'use_conspiracy') {
    const card = action.card;
    const params = buildConspiracyParams(state, botSlot, card);
    return engine.useConspiracy(state, botSlot, card.instanceId, params);
  }

  return { ok: false, error: 'Unknown action' };
}

function canBotAfford(bot, cost) {
  return Object.entries(cost).every(([r, v]) => (bot[r] || 0) >= v);
}

function ideologyBonus(bot, ideology) {
  const counts = bot.ideologyCards;
  const dom = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  return ideology === dom ? 1 : 0;
}

function zoneScore(zone, botSlot) {
  if (engine.checkMajority(zone) !== null) return -1;

  const myPegs = zone.pegs.filter(p => p === botSlot).length;
  const oppPegs = zone.pegs.filter(p => p !== botSlot).length;
  const proximityToMajority = myPegs / zone.majority;
  const leadBonus = myPegs > oppPegs ? 2 : 0;

  return zone.points * (1 + proximityToMajority) + leadBonus;
}

function chooseBestZone(state, botSlot, soldierCount) {
  let best = -1;
  let bestScore = -Infinity;
  state.zones.forEach((zone, index) => {
    if (engine.checkMajority(zone) !== null) return;
    if (zone.capacity - zone.pegs.length < soldierCount) return;
    const score = zoneScore(zone, botSlot);
    if (score > bestScore) {
      bestScore = score;
      best = index;
    }
  });
  return best;
}

function chooseBestSoldierCard(affordableCards) {
  return affordableCards.reduce((best, card) => {
    if (!best) return card;
    return cardUnits(card) > cardUnits(best) ? card : best;
  }, null);
}

function findZoneLockingCard(state, botSlot, affordableCards) {
  for (const card of affordableCards) {
    for (const zone of state.zones) {
      if (engine.checkMajority(zone) !== null) continue;
      const myPegs = zone.pegs.filter(p => p === botSlot).length;
      const spacesLeft = zone.capacity - zone.pegs.length;
      const units = cardUnits(card);
      if (spacesLeft >= units && myPegs + units >= zone.majority) {
        return card;
      }
    }
  }
  return null;
}

function findBlockingMove(state, botSlot, affordableCards) {
  const oppSlot = botSlot === 1 ? 2 : 1;
  for (const [zoneIndex, zone] of state.zones.entries()) {
    if (engine.checkMajority(zone) !== null) continue;
    const oppPegs = zone.pegs.filter(p => p === oppSlot).length;
    const spacesLeft = zone.capacity - zone.pegs.length;
    const oppNeedsMore = zone.majority - oppPegs;

    if (oppNeedsMore <= 2 && spacesLeft > 0) {
      const card = affordableCards.find(c => cardUnits(c) <= spacesLeft);
      if (card) return { type: 'influence_soldier', card, zoneIndex };
    }
  }
  return null;
}

function findIncursionMove(state, botSlot) {
  const oppSlot = botSlot === 1 ? 2 : 1;

  for (const [fromIndex, fromZone] of state.zones.entries()) {
    if (engine.incursionRights(fromZone) !== botSlot) continue;
    if (engine.checkMajority(fromZone) !== null) continue;

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
  return bot.conspiracies[0];
}

function buildConspiracyParams(state, botSlot, card) {
  const oppSlot = botSlot === 1 ? 2 : 1;
  const params = {};

  if (card.effect === 'remove_opponent_soldier') {
    const target = state.zones
      .map((z, i) => ({ z, i }))
      .filter(({ z }) => z.pegs.includes(oppSlot) && engine.checkMajority(z) === null)
      .sort((a, b) => b.z.pegs.filter(p => p === oppSlot).length - a.z.pegs.filter(p => p === oppSlot).length)[0];
    if (target) params.zoneIndex = target.i;
  }

  if (card.effect === 'place_free_soldiers') {
    const best = chooseBestZone(state, botSlot, 3);
    if (best !== -1) params.zoneIndex = best;
  }

  if (card.effect === 'defect_soldier') {
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

  if (card.effect === 'convert_soldier') {
    const zoneIdx = state.zones.findIndex(z => engine.incursionRights(z) === botSlot && z.pegs.includes(oppSlot));
    if (zoneIdx !== -1) params.zoneIndex = zoneIdx;
  }

  return params;
}

module.exports = { runBotTurn };
