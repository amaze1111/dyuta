/**
 * SHASN Game Engine — full rules implementation
 *
 * Fixes in this version:
 *  - Headline cards: triggered when voter enters volatile zone
 *  - Conspiracy cards: bought blind (random from deck), revealed on use
 *  - Level 3 + Level 5 ideology powers fully active
 *  - Voter card flow simplified (no double-selection)
 *  - Passive income correctly calculated per turn start
 */

// ─── Zones ────────────────────────────────────────────────────────────────────

const ZONES = [
  { name: 'Northgate',      capacity: 11, majority: 6,  points: 11, adjacentZones: [1, 2, 4],          volatile: true },
  { name: 'Millbrook',      capacity: 9,  majority: 5,  points: 9,  adjacentZones: [0, 2, 3],          volatile: true },
  { name: 'Harborview',     capacity: 6,  majority: 4,  points: 6,  adjacentZones: [0, 1, 4, 5],       volatile: true },
  { name: 'Westfield',      capacity: 9,  majority: 5,  points: 9,  adjacentZones: [1, 2, 4, 6],       volatile: true },
  { name: 'Capitol Hill',   capacity: 5,  majority: 3,  points: 5,  adjacentZones: [0, 2, 3, 5, 6, 7], volatile: true },
  { name: 'Eastport',       capacity: 9,  majority: 5,  points: 9,  adjacentZones: [2, 4, 7, 8],       volatile: true },
  { name: 'Riverside',      capacity: 6,  majority: 4,  points: 6,  adjacentZones: [3, 4, 7],          volatile: true },
  { name: 'Southdown',      capacity: 11, majority: 6,  points: 11, adjacentZones: [4, 5, 6, 8],       volatile: true },
  { name: 'Bayshore',       capacity: 6,  majority: 4,  points: 6,  adjacentZones: [5, 7],             volatile: true },
];

// ─── Ideology Cards ───────────────────────────────────────────────────────────

const IDEOLOGY_CARDS = [
  { id: 'ic_01', question: 'Should corporations be allowed to fund political campaigns without limits?',
    a: { text: 'Yes — money is speech, and free markets fuel democracy.', ideology: 'corporatist', resources: { gold: 2, sway: 1 } },
    b: { text: 'No — it corrupts democracy and silences ordinary citizens.', ideology: 'progressive', resources: { cred: 2, press: 1 } } },
  { id: 'ic_02', question: 'Should the government prioritize national identity over multiculturalism?',
    a: { text: 'Yes — a shared identity unifies and strengthens the nation.', ideology: 'nationalist', resources: { sway: 2, gold: 1 } },
    b: { text: 'No — diversity is our strength and must be celebrated.', ideology: 'progressive', resources: { cred: 2, sway: 1 } } },
  { id: 'ic_03', question: 'A scandal breaks. Do you hold a press conference or let allies spin it?',
    a: { text: 'Hold a dramatic press conference — dominate the narrative!', ideology: 'populist', resources: { press: 3 } },
    b: { text: 'Quietly manage it. cred the people to see through the noise.', ideology: 'progressive', resources: { cred: 2, gold: 1 } } },
  { id: 'ic_04', question: 'Should universal basic income replace traditional welfare programs?',
    a: { text: 'Yes — streamline the system and let markets do the rest.', ideology: 'corporatist', resources: { gold: 2, press: 1 } },
    b: { text: 'No — targeted support serves the vulnerable better.', ideology: 'progressive', resources: { cred: 3 } } },
  { id: 'ic_05', question: 'A rival spreads misinformation about you. Your response?',
    a: { text: 'Launch a counter-campaign — louder, bolder, trending.', ideology: 'populist', resources: { press: 2, sway: 1 } },
    b: { text: 'Publicly call it out with facts — integrity wins long-term.', ideology: 'progressive', resources: { cred: 2, gold: 1 } } },
  { id: 'ic_06', question: 'Should immigration be restricted to protect national interests?',
    a: { text: 'Yes — our people come first. Jobs, security, identity.', ideology: 'nationalist', resources: { sway: 3 } },
    b: { text: 'No — open borders drive innovation and economic growth.', ideology: 'corporatist', resources: { gold: 2, press: 1 } } },
  { id: 'ic_07', question: 'A major factory is polluting a river. What do you do?',
    a: { text: 'Fine them but let them operate — jobs matter more.', ideology: 'corporatist', resources: { gold: 3 } },
    b: { text: 'Shut it down. No compromise on the environment.', ideology: 'progressive', resources: { cred: 2, press: 1 } } },
  { id: 'ic_08', question: 'Should the voting age be lowered to 16?',
    a: { text: 'Absolutely — youth voices deserve to shape their future.', ideology: 'progressive', resources: { cred: 2, sway: 1 } },
    b: { text: 'No — maturity and experience should be prerequisites.', ideology: 'nationalist', resources: { sway: 2, gold: 1 } } },
  { id: 'ic_09', question: 'A celebrity endorses your campaign. Do you accept?',
    a: { text: 'Yes! Reach millions — culture IS politics now.', ideology: 'populist', resources: { press: 2, sway: 1 } },
    b: { text: 'Only if they genuinely believe in your platform.', ideology: 'progressive', resources: { cred: 2, gold: 1 } } },
  { id: 'ic_10', question: 'Should healthcare be fully privatized for better efficiency?',
    a: { text: 'Yes — competition drives quality and innovation.', ideology: 'corporatist', resources: { gold: 2, press: 1 } },
    b: { text: 'Never — health is a right, not a commodity.', ideology: 'progressive', resources: { cred: 3 } } },
  { id: 'ic_11', question: 'A rival politician makes a major gaffe. How do you respond?',
    a: { text: 'Turn it into a meme — dominate social press for a week.', ideology: 'populist', resources: { press: 3 } },
    b: { text: "Focus on your policies. Their mistakes aren't your platform.", ideology: 'progressive', resources: { cred: 2, sway: 1 } } },
  { id: 'ic_12', question: 'Should the state control key industries like energy and telecom?',
    a: { text: 'Yes — essential services must serve the people, not shareholders.', ideology: 'nationalist', resources: { sway: 2, cred: 1 } },
    b: { text: 'No — private ownership and competition delivers better results.', ideology: 'corporatist', resources: { gold: 3 } } },
  { id: 'ic_13', question: 'Should social press platforms be regulated by the government?',
    a: { text: 'Yes — unchecked platforms spread misinformation and hatred.', ideology: 'nationalist', resources: { sway: 2, press: 1 } },
    b: { text: 'No — free speech must be protected at all costs.', ideology: 'corporatist', resources: { gold: 2, cred: 1 } } },
  { id: 'ic_14', question: 'A whistleblower exposes corruption in your party. What do you do?',
    a: { text: 'Discredit them — the mission is bigger than one person.', ideology: 'nationalist', resources: { sway: 3 } },
    b: { text: 'Thank them publicly — accountability builds lasting cred.', ideology: 'progressive', resources: { cred: 3 } } },
  { id: 'ic_15', question: 'Should free education be guaranteed up to university level?',
    a: { text: 'Yes — an educated population is the greatest national investment.', ideology: 'progressive', resources: { cred: 2, press: 1 } },
    b: { text: 'No — competition and student loans drive excellence.', ideology: 'corporatist', resources: { gold: 2, sway: 1 } } },
  { id: 'ic_16', question: 'Should wealthy individuals pay a higher percentage of tax?',
    a: { text: 'No — flat tax is fair and investment drives growth.', ideology: 'corporatist', resources: { gold: 3 } },
    b: { text: 'Yes — wealth inequality threatens social cohesion.', ideology: 'progressive', resources: { cred: 2, press: 1 } } },
  { id: 'ic_17', question: 'Should the military budget be increased?',
    a: { text: 'Yes — strong defence is the foundation of national security.', ideology: 'nationalist', resources: { sway: 2, gold: 1 } },
    b: { text: 'No — invest in education and healthcare instead.', ideology: 'progressive', resources: { cred: 3 } } },
  { id: 'ic_18', question: 'A rival goes viral for the wrong reasons. Do you comment?',
    a: { text: 'Absolutely — pivot it into your biggest press moment.', ideology: 'populist', resources: { press: 2, sway: 1 } },
    b: { text: 'Stay silent — let the story die on its own.', ideology: 'progressive', resources: { cred: 2, gold: 1 } } },
  { id: 'ic_19', question: 'Should the government subsidise electric vehicles?',
    a: { text: 'Yes — green transition needs public investment.', ideology: 'progressive', resources: { cred: 2, press: 1 } },
    b: { text: 'No — let the market decide the pace of innovation.', ideology: 'corporatist', resources: { gold: 2, sway: 1 } } },
  { id: 'ic_20', question: 'Should national holidays celebrate military victories?',
    a: { text: 'Yes — pride in our history unites the nation.', ideology: 'nationalist', resources: { sway: 3 } },
    b: { text: 'No — holidays should be inclusive and forward-looking.', ideology: 'populist', resources: { press: 2, cred: 1 } } },
];

// ─── Voter Cards ──────────────────────────────────────────────────────────────

const VOTER_CARDS = [
  { id: 'vc_01', voterCount: 1, cost: { gold: 1 },                    label: 'Local Businessman' },
  { id: 'vc_02', voterCount: 1, cost: { cred: 1 },                    label: 'Community Leader' },
  { id: 'vc_03', voterCount: 1, cost: { sway: 1 },                    label: 'Street Organizer' },
  { id: 'vc_04', voterCount: 1, cost: { press: 1 },                    label: 'Influencer' },
  { id: 'vc_05', voterCount: 2, cost: { gold: 1, sway: 1 },          label: 'Trade Union' },
  { id: 'vc_06', voterCount: 2, cost: { cred: 1, press: 1 },          label: 'Civil Society Group' },
  { id: 'vc_07', voterCount: 2, cost: { gold: 2 },                    label: 'Corporate Donors' },
  { id: 'vc_08', voterCount: 2, cost: { sway: 2 },                    label: 'Street Network' },
  { id: 'vc_09', voterCount: 2, cost: { cred: 2 },                    label: 'Grassroots Movement' },
  { id: 'vc_10', voterCount: 2, cost: { press: 2 },                    label: 'press Campaign' },
  { id: 'vc_11', voterCount: 3, cost: { gold: 2, cred: 1 },          label: 'Business Alliance' },
  { id: 'vc_12', voterCount: 3, cost: { sway: 2, press: 1 },          label: 'Rally Crowd' },
  { id: 'vc_13', voterCount: 3, cost: { cred: 2, gold: 1 },          label: 'Voter Drive' },
  { id: 'vc_14', voterCount: 3, cost: { press: 2, sway: 1 },          label: 'Viral Campaign' },
  { id: 'vc_15', voterCount: 3, cost: { gold: 1, sway: 1, cred: 1 },label: 'Coalition Bloc' },
  { id: 'vc_16', voterCount: 1, cost: { gold: 2 },                    label: 'Paid Canvasser' },
  { id: 'vc_17', voterCount: 1, cost: { sway: 2 },                    label: 'Ward Boss' },
  { id: 'vc_18', voterCount: 1, cost: { press: 2 },                    label: 'Social press Star' },
  { id: 'vc_19', voterCount: 1, cost: { cred: 2 },                    label: 'Local Hero' },
  { id: 'vc_20', voterCount: 2, cost: { gold: 1, press: 1 },          label: 'PR Firm' },
  { id: 'vc_21', voterCount: 2, cost: { sway: 1, cred: 1 },          label: 'Neighbourhood Watch' },
  { id: 'vc_22', voterCount: 2, cost: { gold: 1, cred: 1 },          label: 'Faith Community' },
  { id: 'vc_23', voterCount: 2, cost: { sway: 1, press: 1 },          label: 'Youth Brigade' },
  { id: 'vc_24', voterCount: 3, cost: { gold: 2, press: 1 },          label: 'Ad Blitz' },
  { id: 'vc_25', voterCount: 3, cost: { sway: 1, cred: 1, press: 1 },label: 'People\'s Front' },
  { id: 'vc_26', voterCount: 4, cost: { gold: 2, sway: 2 },          label: 'Party Machine' },
  { id: 'vc_27', voterCount: 4, cost: { cred: 2, press: 2 },          label: 'Mass Movement' },
  { id: 'vc_28', voterCount: 4, cost: { gold: 2, cred: 1, sway: 1 },label: 'Grand Alliance' },
  { id: 'vc_29', voterCount: 1, cost: { gold: 1, cred: 1 },          label: 'Town Elder' },
  { id: 'vc_30', voterCount: 2, cost: { gold: 3 },                    label: 'Lobbying Firm' },
];

// ─── Conspiracy Cards (bought blind — effect revealed on use) ─────────────────

const CONSPIRACY_CARDS = [
  { id: 'cc_01', name: 'Smear Campaign',      desc: 'Remove up to 2 opponent voters from any unlocked zone.',   effect: 'remove_opponent_voter', cost: 4 },
  { id: 'cc_02', name: 'Bloc Mobilization',   desc: 'Place 3 of your voters in any one zone for free.',         effect: 'place_free_voters',     cost: 5 },
  { id: 'cc_03', name: 'press Blackout',       desc: 'Opponent loses 3 press.',                                  effect: 'steal_press',           cost: 4 },
  { id: 'cc_04', name: 'Financial Scandal',    desc: 'Opponent loses 3 gold.',                                  effect: 'steal_gold',           cost: 4 },
  { id: 'cc_05', name: 'Grassroots Drive',     desc: 'Gain 3 cred impresstely.',                                effect: 'gain_cred',            cost: 4 },
  { id: 'cc_06', name: 'Populist Rally',       desc: 'Gain 3 sway impresstely.',                                effect: 'gain_sway',            cost: 4 },
  { id: 'cc_07', name: 'Dark Money',           desc: 'Gain 4 gold impresstely.',                                effect: 'gain_gold',            cost: 4 },
  { id: 'cc_08', name: 'Swing Vote',           desc: 'Move any 1 non-majority voter to an adjacent zone.',       effect: 'swing_vote',            cost: 5 },
  { id: 'cc_09', name: 'Opposition Research',  desc: 'Steal 2 resources from opponent\'s richest pool.',         effect: 'steal_resources',       cost: 5 },
];

// ─── Headline Cards (triggered by volatile zone entry) ────────────────────────

const HEADLINE_CARDS = [
  // Negative (8) — 80%
  { id: 'hl_01', title: 'Protest Erupts!',         desc: 'Lose 3 sway — the streets turn against you.',           effect: 'lose_sway',   value: 3,  good: false },
  { id: 'hl_02', title: 'Funding Scandal',          desc: 'Lose 3 gold — donors pull out.',                        effect: 'lose_gold',   value: 3,  good: false },
  { id: 'hl_03', title: 'press Frenzy',             desc: 'Lose 3 press — narrative spins out of control.',         effect: 'lose_press',   value: 3,  good: false },
  { id: 'hl_04', title: 'cred Crisis',             desc: 'Lose 3 cred — voters question your integrity.',         effect: 'lose_cred',   value: 3,  good: false },
  { id: 'hl_05', title: 'Voter Suppressed',         desc: 'The voter who just entered is impresstely removed.',      effect: 'remove_voter', value: 1,  good: false },
  { id: 'hl_06', title: 'Scandal Breaks',           desc: 'Lose 2 gold and 2 sway — the press has the story.',   effect: 'lose_gold_sway', value: 2, good: false },
  { id: 'hl_07', title: 'Voter Backlash',           desc: 'Lose 2 cred and 1 press — locals push back hard.',     effect: 'lose_cred_press', value: 2, good: false },
  { id: 'hl_08', title: 'Exposed!',                 desc: 'Lose 4 resources from your largest pool.',              effect: 'lose_largest', value: 4,  good: false },
  // Positive (2) — 20%
  { id: 'hl_09', title: 'Sympathy Vote!',           desc: 'Place 1 free voter in this zone — locals back you.',    effect: 'place_voter',  value: 1,  good: true  },
  { id: 'hl_10', title: 'Underdog Moment!',         desc: 'Gain 2 cred — the public roots for you.',              effect: 'gain_cred',   value: 2,  good: true  },
];

// ─── Ideology Powers ──────────────────────────────────────────────────────────

const IDEOLOGY_POWERS = {
  corporatist: [
    { at: 2, name: 'Passive Income',  desc: '+1 Fund each turn for every 2 corporatist cards.' },
    { at: 3, name: 'Prospecting',     desc: 'Once per turn: trade 1 resource of any type for 2 of another.' },
    { at: 5, name: 'Breaking Ground', desc: 'Once per turn: evict (remove) 3 voters from any zone.' },
  ],
  nationalist: [
    { at: 2, name: 'Passive Income',  desc: '+1 sway each turn for every 2 nationalist cards.' },
    { at: 3, name: 'Donations',       desc: 'Once per turn: snatch (steal) 2 resources from opponent.' },
    { at: 5, name: 'Payback',         desc: 'Once per turn: discard 2 opponent voters from any zone.' },
  ],
  populist: [
    { at: 2, name: 'Passive Income',  desc: '+1 press each turn for every 2 populist cards.' },
    { at: 3, name: 'Going Viral',     desc: '+1 extra voter placed per voter card used this turn.' },
    { at: 5, name: 'Election Fever',  desc: '+1 extra gerrymander move allowed per zone this turn.' },
  ],
  progressive: [
    { at: 2, name: 'Passive Income',  desc: '+1 cred each turn for every 2 progressive cards.' },
    { at: 3, name: 'Helping Hands',   desc: 'Get 2 discounts (reduce cost by 1) on voter cards this turn.' },
    { at: 5, name: 'Tough Love',      desc: 'Once per turn: convert 2 opponent voters to your side.' },
  ],
};

const RESOURCE_TYPES = ['gold', 'sway', 'press', 'cred'];
const RESOURCE_FOR_IDEOLOGY = { corporatist: 'gold', nationalist: 'sway', populist: 'press', progressive: 'cred' };
const RESOURCE_CAP = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clampResources(player) {
  const total = RESOURCE_TYPES.reduce((s, r) => s + player[r], 0);
  if (total <= RESOURCE_CAP) return player;
  let over = total - RESOURCE_CAP;
  const sorted = [...RESOURCE_TYPES].sort((a, b) => player[b] - player[a]);
  for (const r of sorted) {
    const cut = Math.min(player[r], over);
    player[r] -= cut;
    over -= cut;
    if (over === 0) break;
  }
  return player;
}

function totalResources(player) {
  return RESOURCE_TYPES.reduce((s, r) => s + player[r], 0);
}

function canAfford(player, cost) {
  return Object.entries(cost).every(([r, v]) => (player[r] || 0) >= v);
}

function deductCost(player, cost) {
  for (const [r, v] of Object.entries(cost)) player[r] = (player[r] || 0) - v;
  return player;
}

function dominantIdeology(player) {
  const cards = player.ideologyCards;
  return Object.keys(cards).sort((a, b) => cards[b] - cards[a] || a.localeCompare(b))[0];
}

// Passive income: every 2 ideology cards = +1 resource/turn
// Level 2 power: +1 extra of dominant ideology resource
// Level 5 progressive: extra +1 cred
function calcPassiveIncome(player) {
  const income = {};
  for (const [ideo, res] of Object.entries(RESOURCE_FOR_IDEOLOGY)) {
    const gained = Math.floor(player.ideologyCards[ideo] / 2);
    if (gained > 0) income[res] = (income[res] || 0) + gained;
  }
  // Level 2 bonus for each ideology at 2+ cards
  for (const [ideo, res] of Object.entries(RESOURCE_FOR_IDEOLOGY)) {
    if (player.ideologyCards[ideo] >= 2) {
      income[res] = (income[res] || 0) + 1;
    }
  }
  // Level 5 progressive: extra +1 cred
  if (player.ideologyCards.progressive >= 5) {
    income.cred = (income.cred || 0) + 1;
  }
  return income;
}

function checkMajority(zone) {
  const c1 = zone.pegs.filter(p => p === 1).length;
  const c2 = zone.pegs.filter(p => p === 2).length;
  if (c1 >= zone.majority) return 1;
  if (c2 >= zone.majority) return 2;
  return null;
}

function gerrymanderRights(zone) {
  const c1 = zone.pegs.filter(p => p === 1).length;
  const c2 = zone.pegs.filter(p => p === 2).length;
  if (c1 > c2) return 1;
  if (c2 > c1) return 2;
  return null;
}

function getScores(zones) {
  const s = { 1: 0, 2: 0 };
  zones.forEach(z => { const m = checkMajority(z); if (m) s[m] += z.points; });
  return s;
}

function checkWin(zones) {
  const allDecided = zones.every(z => checkMajority(z) !== null);
  if (!allDecided) return null;
  const scores = getScores(zones);
  if (scores[1] > scores[2]) return 1;
  if (scores[2] > scores[1]) return 2;
  return 0;
}

// Apply voter cost reductions from ideology powers
function getVoterCost(player, baseCost) {
  const cost = { ...baseCost };
  // Level 3 progressive: Helping Hands — 2 discounts per turn, only after power is activated
  if (player.helpingHandsActive && (player.helpingHandsUsed || 0) < 2) {
    let discountsLeft = 2 - (player.helpingHandsUsed || 0);
    const sorted = [...RESOURCE_TYPES].sort((a, b) => (cost[b] || 0) - (cost[a] || 0));
    for (const r of sorted) {
      if (!cost[r] || cost[r] <= 0) continue;
      const cut = Math.min(cost[r], discountsLeft);
      cost[r] = Math.max(0, cost[r] - cut);
      discountsLeft -= cut;
      if (discountsLeft === 0) break;
    }
  }
  return cost;
}

// Apply conspiracy cost reduction from ideology powers
function getConspiracyCost(player, baseCost) {
  // Level 3 populist: conspiracy cards cost 1 less
  if (player.ideologyCards.populist >= 3) return Math.max(1, baseCost - 1);
  return baseCost;
}

function ok(state) {
  // Cap log to 50 entries to prevent large WebSocket payloads being dropped
  if (state.log && state.log.length > 50) state.log = state.log.slice(0, 50);
  return { ok: true, state };
}
function err(msg)  { return { ok: false, error: msg }; }

// ─── State Factory ────────────────────────────────────────────────────────────

function createInitialState(players) {
  const makePlayer = p => ({
    slot:         p.slot,
    userId:       p.userId,
    username:     p.username,
    gold: 2, sway: 2, press: 2, cred: 2,
    ideologyCards: { corporatist: 0, nationalist: 0, populist: 0, progressive: 0 },
    conspiracies:  [],
    usedPowerThisTurn: false,  // tracks once-per-turn powers
  });

  const voterDeck    = shuffle([...VOTER_CARDS]);
  const headlineDeck = shuffle(HEADLINE_CARDS.map(c => c.id));

  return {
    players:       players.map(makePlayer),
    zones:         ZONES.map(z => ({ ...z, pegs: [] })),
    currentSlot:   1,
    turn:          1,
    phase:         'ideology',
    currentCard:   null,
    voterCards:    voterDeck.slice(0, 4),
    voterDeck:     voterDeck.slice(4).map(c => c.id),
    cardDeck:      shuffle(IDEOLOGY_CARDS.map(c => c.id)),
    conspiracyDeck: shuffle(CONSPIRACY_CARDS.map(c => c.id)),
    headlineDeck,
    pendingHeadline: null,   // set when a voter enters volatile zone
    log:           [],
    winner:        null,
    scores:        { 1: 0, 2: 0 },
  };
}

// ─── Draw Card ────────────────────────────────────────────────────────────────

function drawCard(state) {
  const s = JSON.parse(JSON.stringify(state));
  if (s.cardDeck.length === 0) s.cardDeck = shuffle(IDEOLOGY_CARDS.map(c => c.id));
  const idx = Math.floor(Math.random() * s.cardDeck.length);
  const cardId = s.cardDeck.splice(idx, 1)[0];
  s.currentCard = IDEOLOGY_CARDS.find(c => c.id === cardId);
  s.phase = 'ideology';
  return ok(s);
}

// ─── Answer Card ──────────────────────────────────────────────────────────────

function answerCard(state, slot, choice) {
  if (state.phase !== 'ideology')   return err('Not in ideology phase');
  if (state.currentSlot !== slot)   return err('Not your turn');
  if (!state.currentCard)           return err('No active card');
  if (!['a','b'].includes(choice))  return err('Choice must be a or b');

  const s      = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);
  const opt    = s.currentCard[choice];

  // Grant card resources
  for (const [res, amt] of Object.entries(opt.resources)) {
    player[res] = (player[res] || 0) + amt;
  }
  player.ideologyCards[opt.ideology]++;

  // Grant passive income
  const passive = calcPassiveIncome(player);
  for (const [res, amt] of Object.entries(passive)) {
    player[res] = (player[res] || 0) + amt;
  }

  clampResources(player);

  // Check Level 5 populist: place 1 free voter after answering
  const freePegZone = player.ideologyCards.populist >= 5
    ? s.zones.findIndex(z => z.pegs.length < z.capacity && checkMajority(z) === null)
    : -1;

  const passiveText = Object.keys(passive).length > 0
    ? ` Passive: ${Object.entries(passive).map(([r,v]) => `+${v} ${r}`).join(', ')}.`
    : '';

  s.log.unshift({ turn: s.turn, slot, type: 'answer_card',
    text: `${player.username} answered [${opt.ideology}] — ${Object.entries(opt.resources).map(([r,v]) => `+${v} ${r}`).join(', ')}.${passiveText}` });

  if (freePegZone >= 0) {
    s.zones[freePegZone].pegs.push(slot);
    s.log.unshift({ turn: s.turn, slot, type: 'power',
      text: `${player.username} placed 1 free voter (Cult Following) in ${s.zones[freePegZone].name}` });
  }

  s.currentCard = null;
  s.phase = 'action';
  player.usedPowerThisTurn = false;
  s.voterCards = _refreshVoterCards(s);

  return ok(s);
}

// ─── Influence Voter Card ─────────────────────────────────────────────────────

function influenceVoterCard(state, slot, voterCardId, zoneIndex) {
  if (state.phase !== 'action')   return err('Not in action phase');
  if (state.currentSlot !== slot) return err('Not your turn');

  const s      = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);
  const zone   = s.zones[zoneIndex];
  const card   = s.voterCards.find(c => c.id === voterCardId);

  if (!zone)  return err('Invalid zone');
  if (!card)  return err('Voter card not available');
  // Majority does NOT lock a zone — players can keep placing voters (affects gerrymander)

  const spacesLeft = zone.capacity - zone.pegs.length;
  if (spacesLeft < card.voterCount) return err(`Need ${card.voterCount} spaces, only ${spacesLeft} left`);

  // Apply power discounts
  const cost = getVoterCost(player, card.cost);
  if (!canAfford(player, cost)) {
    return err(`Need ${Object.entries(cost).map(([r,v]) => `${v} ${r}`).join(', ')}`);
  }

  deductCost(player, cost);
  // Track helping hands discount usage
  if (player.helpingHandsActive && (player.helpingHandsUsed || 0) < 2) {
    player.helpingHandsUsed = (player.helpingHandsUsed || 0) + 1;
    if (player.helpingHandsUsed >= 2) player.helpingHandsActive = false;
  }

  // Level 3 populist: Going Viral — +1 extra voter per card
  const extraVoters = player.ideologyCards.populist >= 3 ? 1 : 0;
  const totalVoters = card.voterCount + extraVoters;
  const actualSpacesLeft = zone.capacity - zone.pegs.length;
  const votersToPlace = Math.min(totalVoters, actualSpacesLeft);

  // Level 5 populist: Election Fever — +1 gerrymander/zone
  if (player.ideologyCards.populist >= 5) {
    s.electionFeverActive = true;
  }

  // Place voters — last slot in zone is volatile, triggers headline against the placer
  const volatileSlotIndex = zone.capacity - 1; // last slot is volatile
  for (let i = 0; i < votersToPlace; i++) {
    const filledSlotIndex = zone.pegs.length; // index before pushing
    zone.pegs.push(slot);
    // If this voter filled the volatile slot (last slot), trigger headline
    if (filledSlotIndex === volatileSlotIndex && !s.pendingHeadline) {
      // Reshuffle deck if exhausted
      if (s.headlineDeck.length === 0) {
        s.headlineDeck = shuffle(HEADLINE_CARDS.map(c => c.id));
      }
      const headlineId = s.headlineDeck.shift();
      const headline = HEADLINE_CARDS.find(h => h.id === headlineId);
      s.pendingHeadline = { ...headline, triggerSlot: slot, zoneName: zone.name };
      s.log.unshift({ turn: s.turn, slot, type: 'headline',
        text: `📰 HEADLINE triggered: "${headline.title}" — volatile slot filled in ${zone.name}` });
    }
  }

  s.log.unshift({ turn: s.turn, slot, type: 'influence_voter',
    text: `${player.username} placed ${votersToPlace} voter${votersToPlace > 1 ? 's' : ''} (${card.label}) in ${zone.name}` });

  // Replace used voter card
  s.voterCards = s.voterCards.filter(c => c.id !== voterCardId);
  // Reshuffle if deck is empty
  if (s.voterDeck.length === 0) {
    const currentIds = new Set(s.voterCards.map(c => c.id));
    s.voterDeck = shuffle(VOTER_CARDS.filter(c => !currentIds.has(c.id)).map(c => c.id));
    s.log.unshift({ turn: s.turn, slot, type: 'info', text: '🔄 Voter card deck reshuffled.' });
  }
  const newId = s.voterDeck.shift();
  const newCard = VOTER_CARDS.find(c => c.id === newId);
  if (newCard) s.voterCards.push(newCard);

  return ok(_checkGameEnd(s));
}

// ─── progressive L3: Helping Hands — 2 discount tokens on voter cards ───────────
function helpingHands(state, slot) {
  if (state.phase !== 'action')   return err('Not in action phase');
  if (state.currentSlot !== slot) return err('Not your turn');
  const s = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);
  if (player.ideologyCards.progressive < 3) return err('Need 3 progressive cards for Helping Hands');
  if (player.usedPowerThisTurn)          return err('Already used a power this turn');
  player.helpingHandsActive = true;  // enables discount in getVoterCost
  player.helpingHandsUsed = 0;       // tracks how many of the 2 discounts used
  player.usedPowerThisTurn = true;
  s.log.unshift({ turn: s.turn, slot, type: 'power',
    text: `${player.username} used Helping Hands — 2 voter card discounts active` });
  return ok(s);
}

// ─── Resolve Headline ─────────────────────────────────────────────────────────
// Called at end of turn when pendingHeadline exists

function resolveHeadline(state, slot) {
  if (state.currentSlot !== slot) return err('Not your turn');
  if (!state.pendingHeadline)     return err('No pending headline');

  const s        = JSON.parse(JSON.stringify(state));
  const headline = s.pendingHeadline;
  const player   = s.players.find(p => p.slot === headline.triggerSlot);

  switch (headline.effect) {
    case 'lose_sway':  player.sway  = Math.max(0, player.sway  - headline.value); break;
    case 'lose_gold':  player.gold  = Math.max(0, player.gold  - headline.value); break;
    case 'lose_press':  player.press  = Math.max(0, player.press  - headline.value); break;
    case 'lose_cred':  player.cred  = Math.max(0, player.cred  - headline.value); break;
    case 'gain_sway':  player.sway  += headline.value; clampResources(player); break;
    case 'gain_gold':  player.gold  += headline.value; clampResources(player); break;
    case 'gain_press':  player.press  += headline.value; clampResources(player); break;
    case 'gain_cred':  player.cred  += headline.value; clampResources(player); break;
    case 'lose_gold_sway':
      player.gold = Math.max(0, player.gold - headline.value);
      player.sway = Math.max(0, player.sway - headline.value);
      break;
    case 'lose_cred_press':
      player.cred = Math.max(0, player.cred - headline.value);
      player.press = Math.max(0, player.press - 1);
      break;
    case 'lose_largest': {
      const richest = [...RESOURCE_TYPES].sort((a, b) => player[b] - player[a])[0];
      player[richest] = Math.max(0, player[richest] - headline.value);
      break;
    }
    case 'remove_voter': {
      const zone = s.zones.find(z => z.name === headline.zoneName);
      if (zone && zone.pegs.includes(headline.triggerSlot)) {
        zone.pegs.splice(zone.pegs.lastIndexOf(headline.triggerSlot), 1);
      }
      break;
    }
    case 'remove_voter_and_sway': {
      const zone = s.zones.find(z => z.name === headline.zoneName);
      if (zone && zone.pegs.includes(headline.triggerSlot)) {
        zone.pegs.splice(zone.pegs.lastIndexOf(headline.triggerSlot), 1);
      }
      player.sway = Math.max(0, player.sway - 1);
      break;
    }
    case 'place_voter': {
      const zone = s.zones.find(z => z.name === headline.zoneName);
      if (zone && zone.pegs.length < zone.capacity) {
        zone.pegs.push(headline.triggerSlot);
      }
      break;
    }
  }

  s.pendingHeadline = null;
  s.log.unshift({ turn: s.turn, slot, type: 'headline_resolved',
    text: `📰 Headline resolved: ${headline.title}` });

  return ok(s);
}

// ─── Gerrymander ─────────────────────────────────────────────────────────────

function gerrymander(state, slot, fromZoneIndex, toZoneIndex, pegOwnerSlot, rightsZoneIndex) {
  if (state.phase !== 'action')   return err('Not in action phase');
  if (state.currentSlot !== slot) return err('Not your turn');

  const s     = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);
  const fromZ  = s.zones[fromZoneIndex];
  const toZ    = s.zones[toZoneIndex];

  // Rights zone: if provided use it, otherwise fall back to fromZone (backward compat)
  const rIdx   = rightsZoneIndex !== undefined ? rightsZoneIndex : fromZoneIndex;
  const rZ     = s.zones[rIdx];

  if (!fromZ || !toZ || !rZ)                         return err('Invalid zone');
  if (fromZoneIndex === toZoneIndex)                  return err('Must choose different zones');
  if (gerrymanderRights(rZ) !== slot)                 return err(`No gerrymandering rights in ${rZ.name}`);

  // fromZ and toZ must both be adjacent to the rights zone (or be the rights zone itself)
  const fromOk = fromZoneIndex === rIdx || rZ.adjacentZones.includes(fromZoneIndex);
  const toOk   = toZoneIndex   === rIdx || rZ.adjacentZones.includes(toZoneIndex);
  if (!fromOk) return err(`${fromZ.name} is not adjacent to ${rZ.name}`);
  if (!toOk)   return err(`${toZ.name} is not adjacent to ${rZ.name}`);

  // fromZ and toZ must be adjacent to each other
  if (!fromZ.adjacentZones.includes(toZoneIndex))     return err(`${toZ.name} is not adjacent to ${fromZ.name}`);
  if (toZ.pegs.length >= toZ.capacity)                return err(`${toZ.name} is full`);

  // Cannot move majority-forming pegs
  const myPegsInFrom = fromZ.pegs.filter(p => p === pegOwnerSlot).length;
  if (checkMajority(fromZ) === pegOwnerSlot && myPegsInFrom <= fromZ.majority) {
    return err('Cannot gerrymander majority-forming voters');
  }
  // Level 3 nationalist: opponent cannot remove your majority voters via gerrymander
  if (pegOwnerSlot !== slot && checkMajority(fromZ) === pegOwnerSlot &&
      s.players.find(p => p.slot === pegOwnerSlot)?.ideologyCards?.nationalist >= 3) {
    return err('Opponent\'s majority voters are protected by Stronghold');
  }

  // Track used rights by the RIGHTS zone index (not fromZone)
  if (!s.gerrymanderUsed) s.gerrymanderUsed = {};
  if (s.gerrymanderUsed[rIdx]) return err(`Already used gerrymander rights of ${rZ.name} this turn`);

  const pegIdx = fromZ.pegs.lastIndexOf(pegOwnerSlot);
  if (pegIdx === -1) return err('No such voter in that zone');

  fromZ.pegs.splice(pegIdx, 1);
  toZ.pegs.push(pegOwnerSlot);
  s.gerrymanderUsed[rIdx] = true;

  const movedName = s.players.find(p => p.slot === pegOwnerSlot)?.username || `P${pegOwnerSlot}`;
  s.log.unshift({ turn: s.turn, slot, type: 'gerrymander',
    text: `${player.username} gerrymandered ${movedName}'s voter: ${fromZ.name} → ${toZ.name} (using ${rZ.name} rights)` });

  // Headline triggers when opponent's voter is moved INTO a volatile zone
  if (toZ.volatile && pegOwnerSlot !== slot && s.headlineDeck.length > 0) {
    const headlineId = s.headlineDeck.shift();
    const headline = HEADLINE_CARDS.find(h => h.id === headlineId);
    s.pendingHeadline = { ...headline, triggerSlot: pegOwnerSlot, zoneName: toZ.name };
    s.log.unshift({ turn: s.turn, slot, type: 'headline',
      text: `📰 HEADLINE triggered: "${headline.title}" — ${movedName}'s voter entered volatile ${toZ.name}` });
  }

  return ok(_checkGameEnd(s));
}

// ─── Buy Conspiracy (blind — random card from deck) ───────────────────────────

function buyConspiracy(state, slot, payment = null) {
  if (state.phase !== 'action')   return err('Not in action phase');
  if (state.currentSlot !== slot) return err('Not your turn');

  const s      = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);

  if (s.conspiracyDeck.length === 0) {
    s.conspiracyDeck = shuffle(CONSPIRACY_CARDS.map(c => c.id));
  }

  const nextId   = s.conspiracyDeck[0];
  const nextCard = CONSPIRACY_CARDS.find(c => c.id === nextId);
  const cost     = getConspiracyCost(player, nextCard.cost);

  if (totalResources(player) < cost) {
    return err(`Need at least ${cost} total resources to buy a conspiracy card`);
  }

  if (payment) {
    const payTotal = RESOURCE_TYPES.reduce((sum, r) => sum + (payment[r] || 0), 0);
    if (payTotal !== cost) return err(`Payment must total exactly ${cost} resources`);
    for (const r of RESOURCE_TYPES) {
      const amt = payment[r] || 0;
      if (amt < 0 || player[r] < amt) return err(`Not enough ${r}`);
    }
    for (const r of RESOURCE_TYPES) player[r] -= (payment[r] || 0);
  } else {
    let remaining = cost;
    const sorted = [...RESOURCE_TYPES].sort((a, b) => player[b] - player[a]);
    for (const r of sorted) {
      const take = Math.min(player[r], remaining);
      player[r] -= take; remaining -= take;
      if (remaining === 0) break;
    }
  }

  s.conspiracyDeck.shift();
  player.conspiracies.push({ ...nextCard, instanceId: `${nextCard.id}_${Date.now()}` });

  s.log.unshift({ turn: s.turn, slot, type: 'buy_conspiracy',
    text: `${player.username} acquired a conspiracy card (cost ${cost})` });

  return ok(s);
}

// ─── Use Conspiracy ───────────────────────────────────────────────────────────

function useConspiracy(state, slot, instanceId, params = {}) {
  if (state.currentSlot !== slot) return err('Not your turn');

  const s       = JSON.parse(JSON.stringify(state));
  const player  = s.players.find(p => p.slot === slot);
  const oppSlot = slot === 1 ? 2 : 1;
  const opp     = s.players.find(p => p.slot === oppSlot);

  const cardIdx = player.conspiracies.findIndex(c => c.instanceId === instanceId);
  if (cardIdx === -1) return err('Conspiracy card not found');
  const card = player.conspiracies[cardIdx];

  switch (card.effect) {
    case 'remove_opponent_voter': {
      const zoneIndex = params.zoneIndex ?? s.zones.findIndex(z => z.pegs.includes(oppSlot) && checkMajority(z) === null);
      const zone = s.zones[zoneIndex];
      if (!zone) return err('No valid target zone');
      if (checkMajority(zone) !== null) return err('Zone is locked');
      // Level 3 nationalist protects majority voters
      const isProtected = opp?.ideologyCards?.nationalist >= 3 && checkMajority(zone) === oppSlot;
      if (isProtected) return err("Opponent's majority voters are protected by Stronghold");
      let removed = 0;
      while (removed < 2 && zone.pegs.includes(oppSlot)) {
        zone.pegs.splice(zone.pegs.lastIndexOf(oppSlot), 1); removed++;
      }
      s.log.unshift({ turn: s.turn, slot, type: 'conspiracy',
        text: `${player.username} ran Smear Campaign — removed ${removed} of ${opp.username}'s voters from ${zone.name}` });
      break;
    }
    case 'place_free_voters': {
      const zoneIdx = params.zoneIndex ?? s.zones.findIndex(z => z.pegs.length + 3 <= z.capacity && checkMajority(z) === null);
      const zone = s.zones[zoneIdx];
      if (!zone || checkMajority(zone) !== null) return err('No valid zone');
      const canPlace = Math.min(3, zone.capacity - zone.pegs.length);
      for (let i = 0; i < canPlace; i++) zone.pegs.push(slot);
      s.log.unshift({ turn: s.turn, slot, type: 'conspiracy',
        text: `${player.username} used Bloc Mobilization — placed ${canPlace} voters in ${zone.name}` });
      break;
    }
    case 'steal_press':    opp.press  = Math.max(0, opp.press  - 3); s.log.unshift({ turn: s.turn, slot, type: 'conspiracy', text: `${player.username} launched press Blackout on ${opp.username}` }); break;
    case 'steal_gold':    opp.gold  = Math.max(0, opp.gold  - 3); s.log.unshift({ turn: s.turn, slot, type: 'conspiracy', text: `${player.username} triggered Financial Scandal on ${opp.username}` }); break;
    case 'gain_cred':     player.cred += 3;  clampResources(player); s.log.unshift({ turn: s.turn, slot, type: 'conspiracy', text: `${player.username} ran Grassroots Drive (+3 cred)` }); break;
    case 'gain_sway':     player.sway += 3;  clampResources(player); s.log.unshift({ turn: s.turn, slot, type: 'conspiracy', text: `${player.username} held Populist Rally (+3 sway)` }); break;
    case 'gain_gold':     player.gold += 4;  clampResources(player); s.log.unshift({ turn: s.turn, slot, type: 'conspiracy', text: `${player.username} secured Dark Money (+4 gold)` }); break;
    case 'swing_vote': {
      const { fromZone, toZone, pegOwner } = params;
      if (fromZone === undefined || toZone === undefined || pegOwner === undefined) return err('Needs fromZone, toZone, pegOwner');
      const fz = s.zones[fromZone], tz = s.zones[toZone];
      if (!fz || !tz) return err('Invalid zones');
      if (!fz.adjacentZones.includes(toZone)) return err('Zones must be adjacent');
      // Only block if the voter being moved IS the majority holder's voter AND they have majority
      const majority = checkMajority(fz);
      if (majority !== null && majority === pegOwner) return err('Cannot move majority voters');
      const pi = fz.pegs.lastIndexOf(pegOwner);
      if (pi === -1) return err('No such voter in that zone');
      fz.pegs.splice(pi, 1); tz.pegs.push(pegOwner);
      s.log.unshift({ turn: s.turn, slot, type: 'conspiracy', text: `${player.username} used Swing Vote` });
      // Headline if opponent's voter swung into volatile zone
      if (tz.volatile && pegOwner !== slot && s.headlineDeck.length > 0) {
        const headlineId = s.headlineDeck.shift();
        const headline = HEADLINE_CARDS.find(h => h.id === headlineId);
        s.pendingHeadline = { ...headline, triggerSlot: pegOwner, zoneName: tz.name };
        s.log.unshift({ turn: s.turn, slot, type: 'headline',
          text: `📰 HEADLINE triggered: "${headline.title}" — voter swung into volatile ${tz.name}` });
      }
      break;
    }
    case 'steal_resources': {
      const richest = [...RESOURCE_TYPES].sort((a, b) => opp[b] - opp[a])[0];
      const stolen = Math.min(2, opp[richest]);
      opp[richest] -= stolen; player[richest] += stolen;
      clampResources(player);
      s.log.unshift({ turn: s.turn, slot, type: 'conspiracy',
        text: `${player.username} used Opposition Research — stole ${stolen} ${richest} from ${opp.username}` });
      break;
    }
    case 'convert_voter': {
      // Level 5 nationalist power
      const zoneIdx = params.zoneIndex ?? s.zones.findIndex(z => gerrymanderRights(z) === slot && z.pegs.includes(oppSlot));
      const zone = s.zones[zoneIdx];
      if (!zone || !zone.pegs.includes(oppSlot)) return err('No opponent voter to convert');
      const pi = zone.pegs.lastIndexOf(oppSlot);
      zone.pegs[pi] = slot;
      s.log.unshift({ turn: s.turn, slot, type: 'conspiracy', text: `${player.username} converted an opponent voter in ${zone.name}` });
      break;
    }
    default: return err('Unknown conspiracy effect');
  }

  player.conspiracies.splice(cardIdx, 1);
  return ok(_checkGameEnd(s));
}

// ─── Level 3 progressive Power: convert 1 resource to another ───────────────────

function convertResource(state, slot, fromResource, toResource) {
  if (state.phase !== 'action')   return err('Not in action phase');
  if (state.currentSlot !== slot) return err('Not your turn');

  const s      = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);

  if (player.ideologyCards.progressive < 3) return err('Need 3 progressive cards for Coalition power');
  if (player.usedPowerThisTurn)          return err('Already used a power this turn');
  if (!RESOURCE_TYPES.includes(fromResource) || !RESOURCE_TYPES.includes(toResource)) return err('Invalid resource type');
  if (player[fromResource] < 1)          return err(`Not enough ${fromResource}`);

  player[fromResource]--;
  player[toResource]++;
  player.usedPowerThisTurn = true;
  clampResources(player);

  s.log.unshift({ turn: s.turn, slot, type: 'power',
    text: `${player.username} used Coalition — converted 1 ${fromResource} → 1 ${toResource}` });

  return ok(s);
}

// ─── Ideology Powers ─────────────────────────────────────────────────────────

// corporatist L3: Prospecting — trade 1 resource for 2 of another
function prospecting(state, slot, fromResource, toResource) {
  if (state.phase !== 'action')   return err('Not in action phase');
  if (state.currentSlot !== slot) return err('Not your turn');
  const s = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);
  if (player.ideologyCards.corporatist < 3)  return err('Need 3 corporatist cards for Prospecting');
  if (player.usedPowerThisTurn)             return err('Already used a power this turn');
  if (!RESOURCE_TYPES.includes(fromResource) || !RESOURCE_TYPES.includes(toResource)) return err('Invalid resource');
  if (player[fromResource] < 1)             return err(`Not enough ${fromResource}`);
  player[fromResource]--;
  player[toResource] += 2;
  player.usedPowerThisTurn = true;
  clampResources(player);
  s.log.unshift({ turn: s.turn, slot, type: 'power',
    text: `${player.username} used Prospecting: 1 ${fromResource} → 2 ${toResource}` });
  return ok(s);
}

// nationalist L3: Donations — steal 2 resources from opponent
function donations(state, slot) {
  if (state.phase !== 'action')   return err('Not in action phase');
  if (state.currentSlot !== slot) return err('Not your turn');
  const s = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);
  const opp    = s.players.find(p => p.slot !== slot);
  if (player.ideologyCards.nationalist < 3) return err('Need 3 nationalist cards for Donations');
  if (player.usedPowerThisTurn)         return err('Already used a power this turn');
  let stolen = 0;
  const sorted = [...RESOURCE_TYPES].sort((a, b) => opp[b] - opp[a]);
  for (const r of sorted) {
    if (stolen >= 2) break;
    const take = Math.min(opp[r], 2 - stolen);
    opp[r] -= take; player[r] += take; stolen += take;
  }
  player.usedPowerThisTurn = true;
  clampResources(player);
  s.log.unshift({ turn: s.turn, slot, type: 'power',
    text: `${player.username} used Donations — snatched ${stolen} resources from ${opp.username}` });
  return ok(s);
}

// nationalist L5: Payback — discard 2 opponent voters from any zone
function payback(state, slot, zoneIndex) {
  if (state.phase !== 'action')   return err('Not in action phase');
  if (state.currentSlot !== slot) return err('Not your turn');
  const s = JSON.parse(JSON.stringify(state));
  const player  = s.players.find(p => p.slot === slot);
  const oppSlot = slot === 1 ? 2 : 1;
  if (player.ideologyCards.nationalist < 5) return err('Need 5 nationalist cards for Payback');
  if (player.usedPowerThisTurn)         return err('Already used a power this turn');
  const zone = s.zones[zoneIndex];
  if (!zone) return err('Invalid zone');
  if (checkMajority(zone) !== null) return err('Cannot target locked zone');
  let removed = 0;
  while (removed < 2 && zone.pegs.includes(oppSlot)) {
    zone.pegs.splice(zone.pegs.lastIndexOf(oppSlot), 1); removed++;
  }
  player.usedPowerThisTurn = true;
  s.log.unshift({ turn: s.turn, slot, type: 'power',
    text: `${player.username} used Payback — discarded ${removed} voters from ${zone.name}` });
  return ok(_checkGameEnd(s));
}

// corporatist L5: Breaking Ground — evict 3 voters from any zone
function breakingGround(state, slot, zoneIndex) {
  if (state.phase !== 'action')   return err('Not in action phase');
  if (state.currentSlot !== slot) return err('Not your turn');
  const s = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);
  if (player.ideologyCards.corporatist < 5) return err('Need 5 corporatist cards for Breaking Ground');
  if (player.usedPowerThisTurn)            return err('Already used a power this turn');
  const zone = s.zones[zoneIndex];
  if (!zone) return err('Invalid zone');
  if (checkMajority(zone) !== null) return err('Cannot target locked zone');
  const removed = zone.pegs.splice(Math.max(0, zone.pegs.length - 3));
  player.usedPowerThisTurn = true;
  s.log.unshift({ turn: s.turn, slot, type: 'power',
    text: `${player.username} used Breaking Ground — evicted ${removed.length} voters from ${zone.name}` });
  return ok(_checkGameEnd(s));
}

// progressive L5: Tough Love — convert 2 opponent voters in zones you lead
function toughLove(state, slot, zoneIndex) {
  if (state.phase !== 'action')   return err('Not in action phase');
  if (state.currentSlot !== slot) return err('Not your turn');
  const s = JSON.parse(JSON.stringify(state));
  const player  = s.players.find(p => p.slot === slot);
  const oppSlot = slot === 1 ? 2 : 1;
  if (player.ideologyCards.progressive < 5) return err('Need 5 progressive cards for Tough Love');
  if (player.usedPowerThisTurn)          return err('Already used a power this turn');
  const zone = s.zones[zoneIndex];
  if (!zone) return err('Invalid zone');
  if (gerrymanderRights(zone) !== slot)  return err('Must have gerrymandering rights to use Tough Love');
  let converted = 0;
  while (converted < 2 && zone.pegs.includes(oppSlot)) {
    const i = zone.pegs.lastIndexOf(oppSlot);
    zone.pegs[i] = slot; converted++;
  }
  if (converted === 0) return err('No opponent voters to convert');
  player.usedPowerThisTurn = true;
  s.log.unshift({ turn: s.turn, slot, type: 'power',
    text: `${player.username} used Tough Love — converted ${converted} voters in ${zone.name}` });
  return ok(_checkGameEnd(s));
}

// ─── End Turn ─────────────────────────────────────────────────────────────────

function endTurn(state, slot) {
  if (state.currentSlot !== slot) return err('Not your turn');
  if (state.phase !== 'action')   return err('Not in action phase');

  const s      = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);

  // If headline pending, resolve it now
  if (s.pendingHeadline) {
    const res = resolveHeadline(s, slot);
    if (!res.ok) return res;
    Object.assign(s, res.state);
  }

  s.log.unshift({ turn: s.turn, slot, type: 'end_turn',
    text: `${player.username} ended their turn` });

  return ok(_advanceTurn(s));
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function _checkGameEnd(state) {
  const winner = checkWin(state.zones);
  if (winner !== null) {
    state.winner = winner;
    state.phase  = 'finished';
    state.scores = getScores(state.zones);
    const winPlayer = state.players.find(p => p.slot === winner);
    state.log.unshift({ turn: state.turn, slot: winner, type: 'win',
      text: winner === 0 ? 'Draw!' : `${winPlayer?.username} wins with ${state.scores[winner]} points!` });
  }
  return state;
}

function _advanceTurn(state) {
  state.currentSlot   = state.currentSlot === 1 ? 2 : 1;
  if (state.currentSlot === 1) state.turn++;
  state.phase         = 'ideology';
  state.gerrymanderUsed = {};
  // Reset per-turn power flags for the new current player
  const newPlayer = state.players.find(p => p.slot === state.currentSlot);
  if (newPlayer) {
    newPlayer.usedPowerThisTurn = false;
    newPlayer.helpingHandsActive = false;
    newPlayer.helpingHandsUsed = 0;
  }
  return state;
}

function _refreshVoterCards(state) {
  // Keep any cards already showing, fill up to 4 from deck
  const needed = 4 - state.voterCards.length;
  if (needed <= 0) return state.voterCards;
  // Reshuffle deck if not enough cards
  if (state.voterDeck.length < needed) {
    const currentIds = new Set(state.voterCards.map(c => c.id));
    const deckIds    = new Set(state.voterDeck);
    const remaining  = VOTER_CARDS.filter(c => !currentIds.has(c.id) && !deckIds.has(c.id)).map(c => c.id);
    state.voterDeck  = [...state.voterDeck, ...shuffle(remaining)];
  }
  const drawn = state.voterDeck.splice(0, needed);
  return [...state.voterCards, ...drawn.map(id => VOTER_CARDS.find(c => c.id === id)).filter(Boolean)];
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  createInitialState,
  drawCard,
  answerCard,
  influenceVoterCard,
  gerrymander,
  buyConspiracy,
  useConspiracy,
  convertResource,
  prospecting,
  helpingHands,
  donations,
  payback,
  breakingGround,
  toughLove,
  resolveHeadline,
  endTurn,
  checkWin,
  checkMajority,
  gerrymanderRights,
  getScores,
  dominantIdeology,
  IDEOLOGY_CARDS,
  VOTER_CARDS,
  CONSPIRACY_CARDS,
  getConspiracyCost,
  HEADLINE_CARDS,
  IDEOLOGY_POWERS,
  ZONES,
  RESOURCE_CAP,
};
