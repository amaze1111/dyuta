const ZONES = [
  { name: "Hastinapura", capacity: 11, majority: 6, points: 11, adjacentZones: [1, 2, 3, 4, 5], volatile: true },
  { name: "Gandhara", capacity: 9, majority: 5, points: 9, adjacentZones: [0, 3], volatile: true },
  { name: "Anga", capacity: 6, majority: 4, points: 6, adjacentZones: [0, 5], volatile: true },
  { name: "Matsya", capacity: 9, majority: 5, points: 9, adjacentZones: [0, 1, 4, 6], volatile: true },
  { name: "Kurukshetra", capacity: 5, majority: 3, points: 5, adjacentZones: [0, 3, 5, 6, 7, 8], volatile: true },
  { name: "Kashi", capacity: 9, majority: 5, points: 9, adjacentZones: [0, 2, 4, 8], volatile: true },
  { name: "Panchala", capacity: 6, majority: 4, points: 6, adjacentZones: [3, 4, 7], volatile: true },
  { name: "Magadha", capacity: 11, majority: 6, points: 11, adjacentZones: [4, 6, 8], volatile: true },
  { name: "Videha", capacity: 6, majority: 4, points: 6, adjacentZones: [4, 5, 7], volatile: true },
];

const IDEOLOGY_CARDS = [
  { id: "ic_01", question: "Duryodhana offers you vast wealth to betray the Pandavas. Do you accept?",
    a: { text: "Yes — gold sustains armies and kingdoms. Pragmatism rules.", ideology: "artha", resources: { swarna: 2, shakti: 1 } },
    b: { text: "No — loyalty and righteousness cannot be bought.", ideology: "dharma", resources: { satya: 2, kirti: 1 } } },
  { id: "ic_02", question: "Karna asks to join your army. He is mighty but born of low birth. Do you welcome him?",
    a: { text: "Yes — a warrior's worth is in his deeds, not his birth.", ideology: "dharma", resources: { satya: 2, kirti: 1 } },
    b: { text: "No — order and hierarchy must be preserved for stability.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_03", question: "The people of a conquered kingdom resist. Do you rule by fear or win their hearts?",
    a: { text: "Rule by force — swift and clear authority prevents rebellion.", ideology: "danda", resources: { shakti: 3 } },
    b: { text: "Win their hearts — lasting loyalty is built through compassion.", ideology: "sama", resources: { kirti: 2, satya: 1 } } },
  { id: "ic_04", question: "shakuni proposes a game of dice. Do you accept the challenge?",
    a: { text: "Yes — to refuse is cowardice. A king must not flinch.", ideology: "danda", resources: { shakti: 2, swarna: 1 } },
    b: { text: "No — wisdom is knowing when not to gamble.", ideology: "dharma", resources: { satya: 3 } } },
  { id: "ic_05", question: "A divine strategist offers you his army or himself as a counsellor. What do you choose?",
    a: { text: "His army — numbers and steel win wars.", ideology: "artha", resources: { swarna: 2, shakti: 1 } },
    b: { text: "The counsellor himself — divine wisdom is worth more than any army.", ideology: "dharma", resources: { satya: 2, kirti: 1 } } },
  { id: "ic_06", question: "A spy reveals the enemy's battle plans. The spy demands a high price. Do you pay?",
    a: { text: "Yes — information is the greatest weapon in war.", ideology: "artha", resources: { swarna: 3 } },
    b: { text: "No — build alliances of trust, not transactions.", ideology: "dharma", resources: { satya: 2, kirti: 1 } } },
  { id: "ic_07", question: "Your guru Drona demands the thumb of Ekalavya as guru dakshina. Do you support this?",
    a: { text: "Yes — preserving the established order protects the kingdom.", ideology: "danda", resources: { shakti: 2, swarna: 1 } },
    b: { text: "No — this is injustice. Talent must not be crushed.", ideology: "dharma", resources: { satya: 3 } } },
  { id: "ic_08", question: "Draupadi has been humiliated in the Sabha. The assembly is silent. Do you speak?",
    a: { text: "speak boldly — injustice answered with silence is complicity.", ideology: "dharma", resources: { satya: 2, kirti: 1 } },
    b: { text: "stay silent — the laws of the game must be upheld.", ideology: "danda", resources: { shakti: 3 } } },
  { id: "ic_09", question: "Bhishma is invincible but stands against dharma. How do you face him?",
    a: { text: "Use Shikhandi — sometimes strategy must override honour.", ideology: "artha", resources: { swarna: 2, kirti: 1 } },
    b: { text: "Face him directly — a warrior must not hide behind others.", ideology: "danda", resources: { shakti: 3 } } },
  { id: "ic_10", question: "Yudhishthira wants to gamble the kingdom one more time. Do you support him?",
    a: { text: "Yes — follow your elder. His dharma is your dharma.", ideology: "dharma", resources: { satya: 2, shakti: 1 } },
    b: { text: "No — this is madness. Some decisions must be refused.", ideology: "danda", resources: { shakti: 2, satya: 1 } } },
  { id: "ic_11", question: "A kingdom offers tribute but secretly arms your enemy. Do you accept the tribute?",
    a: { text: "Yes — take their gold and prepare for their betrayal.", ideology: "artha", resources: { swarna: 3 } },
    b: { text: "No — expose their treachery and make an example.", ideology: "danda", resources: { shakti: 2, kirti: 1 } } },
  { id: "ic_12", question: "Arjuna refuses to fight his kin on the battlefield. How do you counsel him?",
    a: { text: "Duty above all — the warrior's path must be walked without attachment.", ideology: "dharma", resources: { satya: 2, kirti: 1 } },
    b: { text: "His hesitation is understandable — compassion has its own wisdom.", ideology: "sama", resources: { kirti: 2, satya: 1 } } },
  { id: "ic_13", question: "The people are starving after a long war. Do you distribute the royal treasury?",
    a: { text: "Yes — a king's wealth exists to protect his people.", ideology: "dharma", resources: { satya: 2, kirti: 1 } },
    b: { text: "No — a depleted treasury invites invasion. Rebuild first.", ideology: "artha", resources: { swarna: 2, shakti: 1 } } },
  { id: "ic_14", question: "Vidura warns you the dice game is a trap. Do you heed his counsel?",
    a: { text: "Yes — a wise minister's counsel is worth more than pride.", ideology: "sama", resources: { kirti: 2, satya: 1 } },
    b: { text: "No — a king must not show fear before his rivals.", ideology: "danda", resources: { shakti: 3 } } },
  { id: "ic_15", question: "You can win the war by breaking an oath. Do you do it?",
    a: { text: "Yes — victory justifies the means. Oaths bind the weak.", ideology: "artha", resources: { swarna: 2, shakti: 1 } },
    b: { text: "No — a king who breaks his word rules over nothing.", ideology: "dharma", resources: { satya: 3 } } },
  { id: "ic_16", question: "A bard composes songs of your glory across all kingdoms. Do you commission more?",
    a: { text: "Yes — renown is a weapon more powerful than steel.", ideology: "sama", resources: { kirti: 3 } },
    b: { text: "No — deeds speak louder than songs. Let the work show itself.", ideology: "dharma", resources: { satya: 2, swarna: 1 } } },
  { id: "ic_17", question: "Nakula is skilled with horses and wants to build the greatest cavalry. Do you fund it?",
    a: { text: "Yes — swift cavalry decides the fate of battles.", ideology: "artha", resources: { swarna: 2, shakti: 1 } },
    b: { text: "Partially — balance the army rather than over-invest in one arm.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_18", question: "sahadeva's prophecy reveals the perfect day to start the war. Do you trust it?",
    a: { text: "Yes — knowledge of the stars is knowledge of fate.", ideology: "dharma", resources: { satya: 2, kirti: 1 } },
    b: { text: "No — men make their own fate. Act when ready, not when stars say so.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_19", question: "Duryodhana insults you publicly in the court. How do you respond?",
    a: { text: "Rise above it — a composed king commands more respect than an angry one.", ideology: "sama", resources: { kirti: 2, satya: 1 } },
    b: { text: "Respond with power — silence is mistaken for weakness.", ideology: "danda", resources: { shakti: 3 } } },
  { id: "ic_20", question: "After victory, the Kauravas' kingdom is yours. Do you punish the survivors?",
    a: { text: "No — mercy after victory builds lasting peace.", ideology: "dharma", resources: { satya: 2, kirti: 1 } },
    b: { text: "Yes — those who raised arms must face consequences.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_21", question: "A rival prince offers his daughter in marriage to seal an alliance. Do you accept?",
    a: { text: "Yes — alliances built through family bonds are the strongest.", ideology: "sama", resources: { kirti: 2, swarna: 1 } },
    b: { text: "No — political marriages breed divided loyalties.", ideology: "danda", resources: { shakti: 2, satya: 1 } } },
  { id: "ic_22", question: "Your granary is full but a neighbouring kingdom faces famine. Do you share?",
    a: { text: "Yes — a kingdom that lets its neighbours starve makes enemies.", ideology: "dharma", resources: { satya: 2, kirti: 1 } },
    b: { text: "No — our people come first. Let them solve their own crisis.", ideology: "artha", resources: { swarna: 3 } } },
  { id: "ic_23", question: "Ashwatthama wants revenge and cannot be controlled. Do you release him?",
    a: { text: "Yes — his rage is a weapon. Direct it at the enemy.", ideology: "danda", resources: { shakti: 3 } },
    b: { text: "No — uncontrolled wrath destroys friend and foe alike.", ideology: "dharma", resources: { satya: 2, kirti: 1 } } },
  { id: "ic_24", question: "sanjaya's divine sight lets him report the battle in real time. Do you use this advantage?",
    a: { text: "Yes — information in battle is everything.", ideology: "artha", resources: { swarna: 2, kirti: 1 } },
    b: { text: "Let the battle unfold — interfering with divine gifts brings misfortune.", ideology: "dharma", resources: { satya: 3 } } },
  { id: "ic_25", question: "A merchant offers to fund your army in exchange for exclusive trade rights. Do you agree?",
    a: { text: "Yes — wealth from trade is better than debt from war.", ideology: "artha", resources: { swarna: 3 } },
    b: { text: "No — exclusive rights breed monopoly and resentment.", ideology: "dharma", resources: { satya: 2, kirti: 1 } } },
  { id: "ic_26", question: "Your commander wants to use a forbidden weapon that will cause mass destruction. Do you allow it?",
    a: { text: "No — some victories are not worth their cost.", ideology: "dharma", resources: { satya: 3 } },
    b: { text: "Yes — win at all costs. The kingdom cannot afford to lose.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_27", question: "The people want entertainment — grand festivals and tournaments. Do you fund them?",
    a: { text: "Yes — a happy people do not revolt.", ideology: "sama", resources: { kirti: 3 } },
    b: { text: "No — spend on defence and infrastructure, not spectacle.", ideology: "artha", resources: { swarna: 2, shakti: 1 } } },
  { id: "ic_28", question: "An enemy general offers to defect with his entire battalion. Do you trust him?",
    a: { text: "Yes — his knowledge of the enemy's plans is invaluable.", ideology: "artha", resources: { swarna: 2, shakti: 1 } },
    b: { text: "No — a man who betrays once will betray again.", ideology: "dharma", resources: { satya: 2, kirti: 1 } } },
  { id: "ic_29", question: "Bhima wants to break Duryodhana's thigh in violation of the mace duel rules. Do you stop him?",
    a: { text: "stop him — victory without honour is not victory.", ideology: "dharma", resources: { satya: 3 } },
    b: { text: "Let him — the enemy earned no mercy. Win however you must.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_30", question: "The elders advise patience. The young warriors want immediate battle. Whom do you heed?",
    a: { text: "The elders — wisdom and patience win long campaigns.", ideology: "sama", resources: { kirti: 2, satya: 1 } },
    b: { text: "The young — momentum and speed catch the enemy unprepared.", ideology: "danda", resources: { shakti: 3 } } },
  { id: "ic_31", question: "Your treasury is empty. Do you tax the merchants heavily to fund the war?",
    a: { text: "Yes — in crisis, all must contribute to the common cause.", ideology: "danda", resources: { shakti: 2, swarna: 1 } },
    b: { text: "No — overtaxing breaks commerce and breeds resentment.", ideology: "artha", resources: { swarna: 2, kirti: 1 } } },
  { id: "ic_32", question: "A sage curses your enemy's bloodline. Do you use this curse as a weapon?",
    a: { text: "Yes — even divine weapons must be used when given.", ideology: "danda", resources: { shakti: 2, swarna: 1 } },
    b: { text: "No — fighting through curses is not a warrior's path.", ideology: "dharma", resources: { satya: 2, kirti: 1 } } },
  { id: "ic_33", question: "After the war, Gandhari curses you in grief. Do you accept the curse humbly?",
    a: { text: "Yes — her grief is just. Accept the consequence with dignity.", ideology: "dharma", resources: { satya: 3 } },
    b: { text: "Protect yourself — a king cannot afford to be weakened.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_34", question: "A forest tribe offers fierce warriors in exchange for land rights. Do you agree?",
    a: { text: "Yes — warriors are needed now. Deal with the land later.", ideology: "artha", resources: { swarna: 2, shakti: 1 } },
    b: { text: "Yes and honour it fully — alliances kept are alliances strengthened.", ideology: "dharma", resources: { satya: 2, kirti: 1 } } },
  { id: "ic_35", question: "A strategist uses illusion to save an ally at a critical moment. Do you use such tactics?",
    a: { text: "Yes — dharma adapts. Saving the righteous is always justified.", ideology: "sama", resources: { kirti: 2, satya: 1 } },
    b: { text: "No — illusion in battle is deception and mars the soul.", ideology: "dharma", resources: { satya: 3 } } },
  { id: "ic_36", question: "Your spies report that the enemy plans a night attack — against the laws of war. Do you respond in kind?",
    a: { text: "Yes — if they abandon the rules, so shall we.", ideology: "danda", resources: { shakti: 3 } },
    b: { text: "No — we fight with honour regardless of the enemy's conduct.", ideology: "dharma", resources: { satya: 2, kirti: 1 } } },
  { id: "ic_37", question: "A powerful kingdom will join you only if you give them half your conquered lands. Do you agree?",
    a: { text: "Yes — half a large kingdom is better than none.", ideology: "artha", resources: { swarna: 2, kirti: 1 } },
    b: { text: "No — negotiate harder. Desperation invites exploitation.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_38", question: "A poet captures your victory in verse that will echo through ages. Do you commission it?",
    a: { text: "Yes — legacy is the only true immortality.", ideology: "sama", resources: { kirti: 3 } },
    b: { text: "No — actions speak. Let history judge without embellishment.", ideology: "dharma", resources: { satya: 2, swarna: 1 } } },
  { id: "ic_39", question: "Karna reveals he is your brother. Do you offer him the throne if he switches sides?",
    a: { text: "Yes — blood is thicker than oaths made under pressure.", ideology: "sama", resources: { kirti: 2, satya: 1 } },
    b: { text: "No — he made his choice and must live with it.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_40", question: "The Rajasuya Yagna will announce your supremacy. Do you perform it even if it provokes war?",
    a: { text: "Yes — supremacy must be declared or it will never be respected.", ideology: "danda", resources: { shakti: 2, kirti: 1 } },
    b: { text: "No — provoking war for ceremony is poor statecraft.", ideology: "artha", resources: { swarna: 2, satya: 1 } } },
  { id: "ic_41", question: "Bhishma's deathbed counsel will take days to receive. Do you wait?",
    a: { text: "Yes — the wisdom of ages cannot be rushed or replaced.", ideology: "dharma", resources: { satya: 2, kirti: 1 } },
    b: { text: "No — the kingdom needs governance now, not more counsel.", ideology: "artha", resources: { swarna: 2, shakti: 1 } } },
  { id: "ic_42", question: "The citizens of Hastinapura demand justice for the war's suffering. Do you grant a public hearing?",
    a: { text: "Yes — a king who listens builds trust that outlasts any campaign.", ideology: "dharma", resources: { satya: 3 } },
    b: { text: "No — decisions must be made swiftly. Hearings weaken authority.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_43", question: "You discover a hidden treasury left by the old dynasty. How do you use it?",
    a: { text: "Rebuild the kingdom — the people need roads, wells, and granaries.", ideology: "dharma", resources: { satya: 2, kirti: 1 } },
    b: { text: "strengthen the army first — security before prosperity.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_44", question: "A nagarika (city dweller) movement demands more rights. Do you grant them?",
    a: { text: "Yes — a king governs by the will and welfare of all.", ideology: "sama", resources: { kirti: 2, satya: 1 } },
    b: { text: "No — granting too much too quickly breeds disorder.", ideology: "artha", resources: { swarna: 2, shakti: 1 } } },
  { id: "ic_45", question: "A drought threatens three kingdoms. You have enough water. Do you share?",
    a: { text: "Yes — shared survival builds the alliances that endure.", ideology: "dharma", resources: { satya: 2, kirti: 1 } },
    b: { text: "Trade it — water is power. Let them negotiate.", ideology: "artha", resources: { swarna: 3 } } },
  { id: "ic_46", question: "Your charioteer knows your weaknesses. He demands gold to stay silent. Do you pay?",
    a: { text: "Pay him — silence bought is cheaper than scandal.", ideology: "artha", resources: { swarna: 2, shakti: 1 } },
    b: { text: "Refuse — a king who pays blackmail will pay forever.", ideology: "danda", resources: { shakti: 2, satya: 1 } } },
  { id: "ic_47", question: "Abhimanyu is trapped and dying in the Chakravyuha. Can you break the formation in time?",
    a: { text: "Break through at any cost — a warrior never abandons his own.", ideology: "danda", resources: { shakti: 3 } },
    b: { text: "Regroup and form a counter-strategy — reckless charges destroy armies.", ideology: "artha", resources: { swarna: 2, kirti: 1 } } },
  { id: "ic_48", question: "The war is won but the land is ravaged. Do you declare a period of peace and rebuilding?",
    a: { text: "Yes — the greatest victory is a kingdom that prospers in peace.", ideology: "dharma", resources: { satya: 2, kirti: 1 } },
    b: { text: "Consolidate power first — peace without security is fragile.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_49", question: "A blind king has ruled with great wisdom. Do you ask his counsel still?",
    a: { text: "Yes — blindness of the eyes does not blind the mind.", ideology: "sama", resources: { kirti: 2, satya: 1 } },
    b: { text: "No — a ruler must be decisive, not beholden to the past.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_50", question: "Kunti reveals that Karna is your brother after his death. How do you honour him?",
    a: { text: "With full royal honours — his deeds merit remembrance beyond faction.", ideology: "dharma", resources: { satya: 3 } },
    b: { text: "With quiet rites — too public an honour might unsettle your allies.", ideology: "artha", resources: { swarna: 2, kirti: 1 } } },
  { id: "ic_51", question: "The forest rishis warn that clearing land for a new city will anger the gods. Do you proceed?",
    a: { text: "Proceed — cities build civilisations. The gods will understand.", ideology: "artha", resources: { swarna: 2, shakti: 1 } },
    b: { text: "Consult and compromise — anger the gods and the harvest fails.", ideology: "dharma", resources: { satya: 2, kirti: 1 } } },
  { id: "ic_52", question: "Nakula proposes a trade route through hostile territory. The rewards are great. Do you support it?",
    a: { text: "Yes — wealth requires risk. Send guards and proceed.", ideology: "artha", resources: { swarna: 3 } },
    b: { text: "No — expose a trade caravan to hostility and you invite war.", ideology: "danda", resources: { shakti: 2, satya: 1 } } },
  { id: "ic_53", question: "Yudhishthira wants to renounce the throne and go to the forest. Do you support him?",
    a: { text: "Yes — he has earned his peace. Let him walk the final dharma.", ideology: "dharma", resources: { satya: 2, kirti: 1 } },
    b: { text: "No — a king who abandons his people abandons his duty.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_54", question: "A rival has spread falsehoods about you across all seven kingdoms. How do you respond?",
    a: { text: "Counter with a grand proclamation of truth — let your deeds drown the lies.", ideology: "sama", resources: { kirti: 3 } },
    b: { text: "Find the source and silence it — lies left standing grow roots.", ideology: "danda", resources: { shakti: 2, swarna: 1 } } },
  { id: "ic_55", question: "The great war is over. A young soldier weeps for the fallen enemies. Do you comfort him?",
    a: { text: "Yes — a king who mourns all lives is a king worth following.", ideology: "dharma", resources: { satya: 2, kirti: 1 } },
    b: { text: "No — sentiment on the battlefield weakens resolve.", ideology: "danda", resources: { shakti: 3 } } },
];

// ─── Ally Cards (Warriors & Factions) ────────────────────────────────────────

const VOTER_CARDS = [
  { id: "vc_01", voterCount: 1, cost: { swarna: 1 },                         label: "Village Merchant" },
  { id: "vc_02", voterCount: 1, cost: { satya: 1 },                           label: "Gram Pradhan" },
  { id: "vc_03", voterCount: 1, cost: { shakti: 1 },                          label: "senapati's Aide" },
  { id: "vc_04", voterCount: 1, cost: { kirti: 1 },                           label: "Court Poet" },
  { id: "vc_05", voterCount: 2, cost: { swarna: 1, shakti: 1 },              label: "Vaishya Guild" },
  { id: "vc_06", voterCount: 2, cost: { satya: 1, kirti: 1 },                 label: "sabha Council" },
  { id: "vc_07", voterCount: 2, cost: { swarna: 2 },                         label: "Royal Treasury" },
  { id: "vc_08", voterCount: 2, cost: { shakti: 2 },                          label: "Kshatriya Band" },
  { id: "vc_09", voterCount: 2, cost: { satya: 2 },                           label: "Jana Sangha" },
  { id: "vc_10", voterCount: 2, cost: { kirti: 2 },                           label: "Bard's Tale" },
  { id: "vc_11", voterCount: 3, cost: { swarna: 2, satya: 1 },               label: "Merchant Alliance" },
  { id: "vc_12", voterCount: 3, cost: { shakti: 2, kirti: 1 },                label: "War Drums" },
  { id: "vc_13", voterCount: 3, cost: { satya: 2, swarna: 1 },               label: "Pilgrimage March" },
  { id: "vc_14", voterCount: 3, cost: { kirti: 2, shakti: 1 },                label: "Royal Decree" },
  { id: "vc_15", voterCount: 3, cost: { swarna: 1, shakti: 1, satya: 1 },   label: "samiti Bloc" },
  { id: "vc_16", voterCount: 1, cost: { swarna: 2 },                         label: "Hired Scout" },
  { id: "vc_17", voterCount: 1, cost: { shakti: 2 },                          label: "Gram Mukhiya" },
  { id: "vc_18", voterCount: 1, cost: { kirti: 2 },                           label: "Court Dancer" },
  { id: "vc_19", voterCount: 1, cost: { satya: 2 },                           label: "Village Hero" },
  { id: "vc_20", voterCount: 2, cost: { swarna: 1, kirti: 1 },               label: "Royal Herald" },
  { id: "vc_21", voterCount: 2, cost: { shakti: 1, satya: 1 },                label: "Border Guards" },
  { id: "vc_22", voterCount: 2, cost: { swarna: 1, satya: 1 },               label: "Ashram Followers" },
  { id: "vc_23", voterCount: 2, cost: { shakti: 1, kirti: 1 },                label: "Young Warriors" },
  { id: "vc_24", voterCount: 3, cost: { swarna: 2, kirti: 1 },               label: "Proclamation Blitz" },
  { id: "vc_25", voterCount: 3, cost: { shakti: 1, satya: 1, kirti: 1 },     label: "Praja Morcha" },
  { id: "vc_26", voterCount: 4, cost: { swarna: 2, shakti: 2 },              label: "Rajya Yantra" },
  { id: "vc_27", voterCount: 4, cost: { satya: 2, kirti: 2 },                 label: "Lok Andolan" },
  { id: "vc_28", voterCount: 4, cost: { swarna: 2, satya: 1, shakti: 1 },   label: "Maha Sandhi" },
  { id: "vc_29", voterCount: 1, cost: { swarna: 1, satya: 1 },               label: "Village Pandit" },
  { id: "vc_30", voterCount: 2, cost: { swarna: 3 },                         label: "Raj Darbari" },
];

// ─── Maya Cards (Shakuni's Arsenal — bought blind) ───────────────────────────

const CONSPIRACY_CARDS = [
  { id: "cc_01", name: "shakuni's Dice",    desc: "Remove up to 2 enemy warriors from any unlocked kingdom.", effect: "remove_opponent_voter", cost: 4 },
  { id: "cc_02", name: "Karna's Army",      desc: "Deploy 3 of your warriors into any one kingdom for free.", effect: "place_free_voters",     cost: 5 },
  { id: "cc_03", name: "Drona's Silence",   desc: "Opponent loses 3 Kirti.",                                  effect: "steal_kirti",           cost: 4 },
  { id: "cc_04", name: "Treasury Raid",      desc: "Opponent loses 3 Swarna.",                               effect: "steal_swarna",         cost: 4 },
  { id: "cc_05", name: "Sage's Counsel",   desc: "Gain 3 Satya immediately.",                               effect: "gain_satya",            cost: 4 },
  { id: "cc_06", name: "Bhima's Roar",      desc: "Gain 3 Shakti immediately.",                              effect: "gain_shakti",           cost: 4 },
  { id: "cc_07", name: "Hidden Wealth",      desc: "Gain 4 Swarna immediately.",                             effect: "gain_swarna",          cost: 4 },
  { id: "cc_08", name: "Vidura's Wisdom",   desc: "Move any 1 non-majority warrior to a bordering kingdom.", effect: "swing_vote",            cost: 5 },
  { id: "cc_09", name: "spy Network",        desc: "steal 2 resources from opponent's richest reserve.",     effect: "steal_resources",       cost: 5 },
];

// ─── Proclamation Cards (triggered by volatile kingdom entry) ─────────────────

const HEADLINE_CARDS = [
  { id: "hl_01", title: "soldiers Desert!",       desc: "Lose 3 Shakti — your warriors lose faith.",            effect: "lose_shakti",       value: 3, good: false },
  { id: "hl_02", title: "Treasury Plundered",     desc: "Lose 3 Swarna — the royal vault is raided.",          effect: "lose_swarna",      value: 3, good: false },
  { id: "hl_03", title: "Bards Curse You",        desc: "Lose 3 Kirti — your name is blackened in song.",       effect: "lose_kirti",        value: 3, good: false },
  { id: "hl_04", title: "People's Wrath",        desc: "Lose 3 Satya — the people doubt your dharma.",         effect: "lose_satya",        value: 3, good: false },
  { id: "hl_05", title: "Warrior Expelled",       desc: "The warrior who just entered is immediately removed.",  effect: "remove_voter",      value: 1, good: false },
  { id: "hl_06", title: "Dual Scandal",           desc: "Lose 2 Swarna and 2 Shakti — war and wealth fail.",   effect: "lose_funds_clout",  value: 2, good: false },
  { id: "hl_07", title: "Dharma Questioned",      desc: "Lose 2 Satya and 1 Kirti — your virtue is doubted.",   effect: "lose_trust_media",  value: 2, good: false },
  { id: "hl_08", title: "Exposed by Sanjaya",     desc: "Lose 4 resources from your largest reserve.",          effect: "lose_largest",      value: 4, good: false },
  { id: "hl_09", title: "Divine Favour!",         desc: "Place 1 free warrior here — the gods smile on you.",   effect: "place_voter",       value: 1, good: true  },
  { id: "hl_10", title: "People's Champion!",    desc: "Gain 2 Satya — the people rally to your cause.",       effect: "gain_satya",        value: 2, good: true  },
];

// ─── Ideology Powers ──────────────────────────────────────────────────────────

const IDEOLOGY_POWERS = {
  artha: [
    { at: 2, name: "Passive Income",    desc: "+1 Swarna each turn for every 2 Artha cards." },
    { at: 3, name: "Vaishya's Trade",  desc: "Once per turn: exchange 1 resource for 2 of another." },
    { at: 5, name: "Bhima's Might",    desc: "Once per turn: remove 3 warriors from any unlocked kingdom." },
  ],
  danda: [
    { at: 2, name: "Passive Income",       desc: "+1 Shakti each turn for every 2 Danda cards." },
    { at: 3, name: "shakuni's Gambit",    desc: "Once per turn: seize 2 resources from opponent." },
    { at: 5, name: "Ashwatthama's Wrath", desc: "Once per turn: discard 2 enemy warriors from any unlocked kingdom." },
  ],
  sama: [
    { at: 2, name: "Passive Income",    desc: "+1 Kirti each turn for every 2 Sama cards." },
    { at: 3, name: "Public Momentum",  desc: "Once per turn: buy one conspiracy card for 1 less resource." },
    { at: 5, name: "Conch of Victory",  desc: "+1 extra Yuddha Neeti move per kingdom this turn." },
  ],
  dharma: [
    { at: 2, name: "Passive Income",        desc: "+1 Satya each turn for every 2 Dharma cards." },
    { at: 3, name: "Draupadi's Grace",     desc: "Activate: 2 discounts (reduce cost by 1) on ally cards this turn." },
    { at: 5, name: "Yudhishthira's Dharma",desc: "Once per turn: convert 2 enemy warriors to your cause where you lead." },
  ],
};

const RESOURCE_TYPES = ["swarna", "shakti", "kirti", "satya"];
const RESOURCE_FOR_IDEOLOGY = { artha: "swarna", danda: "shakti", sama: "kirti", dharma: "satya" };
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
  if (player.ideologyCards.dharma >= 5) {
    income.satya = (income.satya || 0) + 1;
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

function incursionRights(zone) {
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
  // Level 3 Sama: first conspiracy card each turn costs 1 less
  if (player.ideologyCards.sama >= 3 && !player.usedPowers?.sama_conspiracy_discount) {
    return Math.max(1, baseCost - 1);
  }
  return baseCost;
}

function ok(state) {
  syncSoldierCards(state);
  // Cap log to 50 entries to prevent large WebSocket payloads being dropped
  if (state.log && state.log.length > 50) state.log = state.log.slice(0, 50);
  return { ok: true, state };
}
function err(msg)  { return { ok: false, error: msg }; }

function syncSoldierCards(state) {
  if (Array.isArray(state.voterCards)) {
    state.soldierCards = state.voterCards;
  } else if (Array.isArray(state.soldierCards)) {
    state.voterCards = state.soldierCards;
  } else {
    state.voterCards = [];
    state.soldierCards = [];
  }
  return state;
}

// ─── State Factory ────────────────────────────────────────────────────────────

function createInitialState(players) {
  const makePlayer = p => ({
    slot:         p.slot,
    userId:       p.userId,
    username:     p.username,
    swarna: 2, shakti: 2, kirti: 2, satya: 2,
    ideologyCards: { artha: 0, danda: 0, sama: 0, dharma: 0 },
    conspiracies:  [],
    usedPowers: {},  // tracks once-per-turn powers per key e.g. { donations: true }
  });

  const voterDeck    = shuffle([...VOTER_CARDS]);
  const headlineDeck = shuffle(HEADLINE_CARDS.map(c => c.id));

  return syncSoldierCards({
    players:       players.map(makePlayer),
    zones:         ZONES.map(z => ({ ...z, pegs: [] })),
    currentSlot:   1,
    turn:          1,
    phase:         "ideology",
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
  });
}

// ─── Draw Card ────────────────────────────────────────────────────────────────

function drawCard(state) {
  const s = JSON.parse(JSON.stringify(state));
  if (s.cardDeck.length === 0) s.cardDeck = shuffle(IDEOLOGY_CARDS.map(c => c.id));
  const idx = Math.floor(Math.random() * s.cardDeck.length);
  const cardId = s.cardDeck.splice(idx, 1)[0];
  s.currentCard = IDEOLOGY_CARDS.find(c => c.id === cardId);
  s.phase = "ideology";
  return ok(s);
}

// ─── Answer Card ──────────────────────────────────────────────────────────────

function answerCard(state, slot, choice) {
  if (state.phase !== "ideology")   return err("Not in ideology phase");
  if (state.currentSlot !== slot)   return err("Not your turn");
  if (!state.currentCard)           return err("No active card");
  if (!["a","b"].includes(choice))  return err("Choice must be a or b");

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
  const freePegZone = player.ideologyCards.sama >= 5
    ? s.zones.findIndex(z => z.pegs.length < z.capacity && checkMajority(z) === null)
    : -1;

  const passiveText = Object.keys(passive).length > 0
    ? ` Passive: ${Object.entries(passive).map(([r,v]) => `+${v} ${r}`).join(", ")}.`
    : "";

  s.log.unshift({ turn: s.turn, slot, type: "answer_card",
    text: `${player.username} answered [${opt.ideology}] — ${Object.entries(opt.resources).map(([r,v]) => `+${v} ${r}`).join(", ")}.${passiveText}` });

  if (freePegZone >= 0) {
    s.zones[freePegZone].pegs.push(slot);
    s.log.unshift({ turn: s.turn, slot, type: "power",
      text: `${player.username} placed 1 free voter (Cult Following) in ${s.zones[freePegZone].name}` });
  }

  s.currentCard = null;
  s.phase = "action";
  player.usedPowers = {};
  s.voterCards = _refreshVoterCards(s);

  return ok(s);
}

// ─── Influence Voter Card ─────────────────────────────────────────────────────

function influenceVoterCard(state, slot, voterCardId, zoneIndex) {
  if (state.phase !== "action")   return err("Not in action phase");
  if (state.currentSlot !== slot) return err("Not your turn");

  const s      = syncSoldierCards(JSON.parse(JSON.stringify(state)));
  const player = s.players.find(p => p.slot === slot);
  const zone   = s.zones[zoneIndex];
  const cardPool = Array.isArray(s.voterCards) && s.voterCards.length > 0 ? s.voterCards : (s.soldierCards || []);
  const card   = cardPool.find(c => c.id === voterCardId);

  if (!zone)  return err("Invalid zone");
  if (!card)  return err("Soldier card not available");
  // Majority does NOT lock a zone — players can keep placing voters (affects incursion)

  const spacesLeft = zone.capacity - zone.pegs.length;
  if (spacesLeft < card.voterCount) return err(`Need ${card.voterCount} spaces, only ${spacesLeft} left`);

  // Apply power discounts
  const cost = getVoterCost(player, card.cost);
  if (!canAfford(player, cost)) {
    return err(`Need ${Object.entries(cost).map(([r,v]) => `${v} ${r}`).join(", ")}`);
  }

  deductCost(player, cost);
  // Track helping hands discount usage
  if (player.helpingHandsActive && (player.helpingHandsUsed || 0) < 2) {
    player.helpingHandsUsed = (player.helpingHandsUsed || 0) + 1;
    if (player.helpingHandsUsed >= 2) player.helpingHandsActive = false;
  }

  // Level 3 populist: Going Viral — +1 extra voter per card
  const extraVoters = player.ideologyCards.sama >= 3 ? 1 : 0;
  const totalVoters = card.voterCount + extraVoters;
  const actualSpacesLeft = zone.capacity - zone.pegs.length;
  const votersToPlace = Math.min(totalVoters, actualSpacesLeft);

  // Level 5 populist: Election Fever — +1 incursion/zone
  if (player.ideologyCards.sama >= 5) {
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
      s.log.unshift({ turn: s.turn, slot, type: "headline",
        text: `📰 HEADLINE triggered: "${headline.title}" — volatile slot filled in ${zone.name}` });
    }
  }

  s.log.unshift({ turn: s.turn, slot, type: "influence_voter",
    text: `${player.username} placed ${votersToPlace} voter${votersToPlace > 1 ? "s" : ""} (${card.label}) in ${zone.name}` });

  // Replace used voter card
  s.voterCards = s.voterCards.filter(c => c.id !== voterCardId);
  // Reshuffle if deck is empty
  if (s.voterDeck.length === 0) {
    const currentIds = new Set(s.voterCards.map(c => c.id));
    s.voterDeck = shuffle(VOTER_CARDS.filter(c => !currentIds.has(c.id)).map(c => c.id));
    s.log.unshift({ turn: s.turn, slot, type: "info", text: "🔄 Voter card deck reshuffled." });
  }
  const newId = s.voterDeck.shift();
  const newCard = VOTER_CARDS.find(c => c.id === newId);
  if (newCard) s.voterCards.push(newCard);

  syncSoldierCards(s);
  return ok(_checkGameEnd(s));
}

function influenceSoldierCard(state, slot, soldierCardId, zoneIndex) {
  return influenceVoterCard(state, slot, soldierCardId, zoneIndex);
}

// ─── progressive L3: Helping Hands — 2 discount tokens on voter cards ───────────
function helpingHands(state, slot) {
  if (state.phase !== "action")   return err("Not in action phase");
  if (state.currentSlot !== slot) return err("Not your turn");
  const s = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);
  if (player.ideologyCards.dharma < 3) return err("Need 3 Dharma cards for Draupadi's Grace");
  if (player.usedPowers['helping_hands']) return err("Already used this power this turn");
  player.helpingHandsActive = true;  // enables discount in getVoterCost
  player.helpingHandsUsed = 0;       // tracks how many of the 2 discounts used
  player.usedPowers['helping_hands'] = true;
  s.log.unshift({ turn: s.turn, slot, type: "power",
    text: `${player.username} used Helping Hands — 2 voter card discounts active` });
  return ok(s);
}

// ─── Resolve Headline ─────────────────────────────────────────────────────────
// Called at end of turn when pendingHeadline exists

function resolveHeadline(state, slot) {
  if (state.currentSlot !== slot) return err("Not your turn");
  if (!state.pendingHeadline)     return err("No pending headline");

  const s        = JSON.parse(JSON.stringify(state));
  const headline = s.pendingHeadline;
  const player   = s.players.find(p => p.slot === headline.triggerSlot);

  switch (headline.effect) {
    case "lose_shakti":  player.shakti  = Math.max(0, player.shakti  - headline.value); break;
    case "lose_swarna": player.swarna = Math.max(0, player.swarna - headline.value); break;
    case "lose_kirti":   player.kirti   = Math.max(0, player.kirti   - headline.value); break;
    case "lose_satya":   player.satya   = Math.max(0, player.satya   - headline.value); break;
    case "gain_shakti":  player.shakti  += headline.value; clampResources(player); break;
    case "gain_swarna": player.swarna += headline.value; clampResources(player); break;
    case "gain_kirti":   player.kirti   += headline.value; clampResources(player); break;
    case "gain_satya":   player.satya   += headline.value; clampResources(player); break;
    case "lose_funds_clout":
      player.swarna = Math.max(0, player.swarna - headline.value);
      player.shakti  = Math.max(0, player.shakti  - headline.value);
      break;
    case "lose_trust_media":
      player.satya  = Math.max(0, player.satya  - headline.value);
      player.kirti  = Math.max(0, player.kirti  - 1);
      break;
    case "lose_largest": {
      const richest = [...RESOURCE_TYPES].sort((a, b) => player[b] - player[a])[0];
      player[richest] = Math.max(0, player[richest] - headline.value);
      break;
    }
    case "remove_voter": {
      const zone = s.zones.find(z => z.name === headline.zoneName);
      if (zone && zone.pegs.includes(headline.triggerSlot)) {
        zone.pegs.splice(zone.pegs.lastIndexOf(headline.triggerSlot), 1);
      }
      break;
    }
    case "remove_voter_and_shakti": {
      const zone = s.zones.find(z => z.name === headline.zoneName);
      if (zone && zone.pegs.includes(headline.triggerSlot)) {
        zone.pegs.splice(zone.pegs.lastIndexOf(headline.triggerSlot), 1);
      }
      player.shakti = Math.max(0, player.shakti - 1);
      break;
    }
    case "place_voter": {
      const zone = s.zones.find(z => z.name === headline.zoneName);
      if (zone && zone.pegs.length < zone.capacity) {
        zone.pegs.push(headline.triggerSlot);
      }
      break;
    }
  }

  s.pendingHeadline = null;
  s.log.unshift({ turn: s.turn, slot, type: "headline_resolved",
    text: `📰 Headline resolved: ${headline.title}` });

  return ok(s);
}

// ─── Incursion ─────────────────────────────────────────────────────────────

function incursionmander(state, slot, fromZoneIndex, toZoneIndex, pegOwnerSlot, rightsZoneIndex) {
  if (state.phase !== "action")   return err("Not in action phase");
  if (state.currentSlot !== slot) return err("Not your turn");

  const s     = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);
  const fromZ  = s.zones[fromZoneIndex];
  const toZ    = s.zones[toZoneIndex];

  // Rights zone: if provided use it, otherwise fall back to fromZone (backward compat)
  const rIdx   = rightsZoneIndex !== undefined ? rightsZoneIndex : fromZoneIndex;
  const rZ     = s.zones[rIdx];

  if (!fromZ || !toZ || !rZ)                         return err("Invalid zone");
  if (fromZoneIndex === toZoneIndex)                  return err("Must choose different zones");
  if (incursionRights(rZ) !== slot)                 return err(`No incursion rights in ${rZ.name}`);

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
    return err("Cannot incur majority-forming soldiers");
  }
  // Level 3 nationalist: opponent cannot remove your majority voters via incursion
  if (pegOwnerSlot !== slot && checkMajority(fromZ) === pegOwnerSlot &&
      s.players.find(p => p.slot === pegOwnerSlot)?.ideologyCards?.danda >= 3) {
    return err("Opponent\'s majority voters are protected by Stronghold");
  }

  // Track used rights by the RIGHTS zone index (not fromZone)
  if (!s.incursionUsed) s.incursionUsed = {};
  if (s.incursionUsed[rIdx]) return err(`Already used incursion rights of ${rZ.name} this turn`);

  const pegIdx = fromZ.pegs.lastIndexOf(pegOwnerSlot);
  if (pegIdx === -1) return err("No such voter in that zone");

  fromZ.pegs.splice(pegIdx, 1);
  toZ.pegs.push(pegOwnerSlot);
  s.incursionUsed[rIdx] = true;

  const movedName = s.players.find(p => p.slot === pegOwnerSlot)?.username || `P${pegOwnerSlot}`;
  s.log.unshift({ turn: s.turn, slot, type: "incursionmander",
    text: `${player.username} moved ${movedName}'s voter: ${fromZ.name} → ${toZ.name} (using ${rZ.name} rights)` });

  // Headline triggers when this move fills the last slot of the destination zone
  if (toZ.pegs.length === toZ.capacity && !s.pendingHeadline) {
    if (s.headlineDeck.length === 0) s.headlineDeck = shuffle(HEADLINE_CARDS.map(c => c.id));
    const headlineId = s.headlineDeck.shift();
    const headline = HEADLINE_CARDS.find(h => h.id === headlineId);
    s.pendingHeadline = { ...headline, triggerSlot: pegOwnerSlot, zoneName: toZ.name };
    s.log.unshift({ turn: s.turn, slot, type: "headline",
      text: `📰 HEADLINE triggered: "${headline.title}" — last slot filled in ${toZ.name}` });
  }

  return ok(_checkGameEnd(s));
}

// ─── Buy Conspiracy (blind — random card from deck) ───────────────────────────

function buyConspiracy(state, slot, payment = null) {
  if (state.phase !== "action")   return err("Not in action phase");
  if (state.currentSlot !== slot) return err("Not your turn");

  const s      = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);

  if (s.conspiracyDeck.length === 0) {
    s.conspiracyDeck = shuffle(CONSPIRACY_CARDS.map(c => c.id));
  }

  const nextId   = s.conspiracyDeck[0];
  const nextCard = CONSPIRACY_CARDS.find(c => c.id === nextId);
  const cost     = getConspiracyCost(player, nextCard.cost);
  const usedSamaDiscount = player.ideologyCards.sama >= 3 &&
    !player.usedPowers?.sama_conspiracy_discount &&
    cost < nextCard.cost;

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
  if (usedSamaDiscount) {
    player.usedPowers = player.usedPowers || {};
    player.usedPowers.sama_conspiracy_discount = true;
  }

  s.log.unshift({ turn: s.turn, slot, type: "buy_conspiracy",
    text: `${player.username} acquired a conspiracy card (cost ${cost})` });

  return ok(s);
}

// ─── Use Conspiracy ───────────────────────────────────────────────────────────

function useConspiracy(state, slot, instanceId, params = {}) {
  if (state.currentSlot !== slot) return err("Not your turn");

  const s       = JSON.parse(JSON.stringify(state));
  const player  = s.players.find(p => p.slot === slot);
  const oppSlot = slot === 1 ? 2 : 1;
  const opp     = s.players.find(p => p.slot === oppSlot);

  const cardIdx = player.conspiracies.findIndex(c => c.instanceId === instanceId);
  if (cardIdx === -1) return err("Conspiracy card not found");
  const card = player.conspiracies[cardIdx];

  switch (card.effect) {
    case "remove_opponent_voter": {
      const zoneIndex = params.zoneIndex ?? s.zones.findIndex(z => z.pegs.includes(oppSlot) && checkMajority(z) === null);
      const zone = s.zones[zoneIndex];
      if (!zone) return err("No valid target zone");
      if (checkMajority(zone) !== null) return err("Zone is locked");
      // Level 3 nationalist protects majority voters
      const isProtected = opp?.ideologyCards?.danda >= 3 && checkMajority(zone) === oppSlot;
      if (isProtected) return err("Opponent's majority voters are protected by Stronghold");
      let removed = 0;
      while (removed < 2 && zone.pegs.includes(oppSlot)) {
        zone.pegs.splice(zone.pegs.lastIndexOf(oppSlot), 1); removed++;
      }
      s.log.unshift({ turn: s.turn, slot, type: "conspiracy",
        text: `${player.username} ran Smear Campaign — removed ${removed} of ${opp.username}'s voters from ${zone.name}` });
      break;
    }
    case "place_free_voters": {
      const zoneIdx = params.zoneIndex ?? s.zones.findIndex(z => z.pegs.length + 3 <= z.capacity && checkMajority(z) === null);
      const zone = s.zones[zoneIdx];
      if (!zone || checkMajority(zone) !== null) return err("No valid zone");
      const canPlace = Math.min(3, zone.capacity - zone.pegs.length);
      for (let i = 0; i < canPlace; i++) zone.pegs.push(slot);
      s.log.unshift({ turn: s.turn, slot, type: "conspiracy",
        text: `${player.username} used Bloc Mobilization — placed ${canPlace} voters in ${zone.name}` });
      break;
    }
    case "steal_kirti":   opp.kirti   = Math.max(0, opp.kirti   - 3); s.log.unshift({ turn: s.turn, slot, type: "conspiracy", text: `${player.username} invoked Drona's Silence on ${opp.username}` }); break;
    case "steal_swarna": opp.swarna = Math.max(0, opp.swarna - 3); s.log.unshift({ turn: s.turn, slot, type: "conspiracy", text: `${player.username} raided ${opp.username}'s treasury` }); break;
    case "gain_satya":    player.satya  += 3; clampResources(player); s.log.unshift({ turn: s.turn, slot, type: "conspiracy", text: `${player.username} invoked Sage's Counsel (+3 Satya)` }); break;
    case "gain_shakti":   player.shakti += 3; clampResources(player); s.log.unshift({ turn: s.turn, slot, type: "conspiracy", text: `${player.username} invoked Bhima's Roar (+3 Shakti)` }); break;
    case "gain_swarna":  player.swarna += 4; clampResources(player); s.log.unshift({ turn: s.turn, slot, type: "conspiracy", text: `${player.username} revealed Hidden Wealth (+4 Swarna)` }); break;
    case "swing_vote": {
      const { fromZone, toZone, pegOwner } = params;
      if (fromZone === undefined || toZone === undefined || pegOwner === undefined) return err("Needs fromZone, toZone, pegOwner");
      const fz = s.zones[fromZone], tz = s.zones[toZone];
      if (!fz || !tz) return err("Invalid zones");
      if (!fz.adjacentZones.includes(toZone)) return err("Zones must be adjacent");
      // Only block if the voter being moved IS the majority holder's voter AND they have majority
      const majority = checkMajority(fz);
      if (majority !== null && majority === pegOwner) return err("Cannot move majority voters");
      const pi = fz.pegs.lastIndexOf(pegOwner);
      if (pi === -1) return err("No such voter in that zone");
      fz.pegs.splice(pi, 1); tz.pegs.push(pegOwner);
      s.log.unshift({ turn: s.turn, slot, type: "conspiracy", text: `${player.username} used Swing Vote` });
      // Headline if this move fills the last slot
      if (tz.pegs.length === tz.capacity && !s.pendingHeadline) {
        if (s.headlineDeck.length === 0) s.headlineDeck = shuffle(HEADLINE_CARDS.map(c => c.id));
        const headlineId = s.headlineDeck.shift();
        const headline = HEADLINE_CARDS.find(h => h.id === headlineId);
        s.pendingHeadline = { ...headline, triggerSlot: pegOwner, zoneName: tz.name };
        s.log.unshift({ turn: s.turn, slot, type: "headline",
          text: `📰 HEADLINE triggered: "${headline.title}" — last slot filled in ${tz.name}` });
      }
      break;
    }
    case "steal_resources": {
      const richest = [...RESOURCE_TYPES].sort((a, b) => opp[b] - opp[a])[0];
      const stolen = Math.min(2, opp[richest]);
      opp[richest] -= stolen; player[richest] += stolen;
      clampResources(player);
      s.log.unshift({ turn: s.turn, slot, type: "conspiracy",
        text: `${player.username} used Opposition Research — stole ${stolen} ${richest} from ${opp.username}` });
      break;
    }
    case "convert_voter": {
      // Level 5 nationalist power
      const zoneIdx = params.zoneIndex ?? s.zones.findIndex(z => incursionRights(z) === slot && z.pegs.includes(oppSlot));
      const zone = s.zones[zoneIdx];
      if (!zone || !zone.pegs.includes(oppSlot)) return err("No opponent voter to convert");
      const pi = zone.pegs.lastIndexOf(oppSlot);
      zone.pegs[pi] = slot;
      s.log.unshift({ turn: s.turn, slot, type: "conspiracy", text: `${player.username} converted an opponent voter in ${zone.name}` });
      break;
    }
    default: return err("Unknown conspiracy effect");
  }

  player.conspiracies.splice(cardIdx, 1);
  return ok(_checkGameEnd(s));
}

// ─── Level 3 progressive Power: convert 1 resource to another ───────────────────

function convertResource(state, slot, fromResource, toResource) {
  if (state.phase !== "action")   return err("Not in action phase");
  if (state.currentSlot !== slot) return err("Not your turn");

  const s      = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);

  if (player.ideologyCards.dharma < 3) return err("Need 3 Dharma cards for Draupadi's Grace");
  if (player.usedPowers['convert_resource']) return err("Already used this power this turn");
  if (!RESOURCE_TYPES.includes(fromResource) || !RESOURCE_TYPES.includes(toResource)) return err("Invalid resource type");
  if (player[fromResource] < 1)          return err(`Not enough ${fromResource}`);

  player[fromResource]--;
  player[toResource]++;
  player.usedPowers['convert_resource'] = true;
  clampResources(player);

  s.log.unshift({ turn: s.turn, slot, type: "power",
    text: `${player.username} used Coalition — converted 1 ${fromResource} → 1 ${toResource}` });

  return ok(s);
}

// ─── Ideology Powers ─────────────────────────────────────────────────────────

// corporatist L3: Prospecting — trade 1 resource for 2 of another
function prospecting(state, slot, fromResource, toResource) {
  if (state.phase !== "action")   return err("Not in action phase");
  if (state.currentSlot !== slot) return err("Not your turn");
  const s = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);
  if (player.ideologyCards.artha < 3)  return err("Need 3 Artha cards for Vaishya's Trade");
  if (player.usedPowers['prospecting'])  return err("Already used this power this turn");
  if (!RESOURCE_TYPES.includes(fromResource) || !RESOURCE_TYPES.includes(toResource)) return err("Invalid resource");
  if (player[fromResource] < 1)             return err(`Not enough ${fromResource}`);
  player[fromResource]--;
  player[toResource] += 2;
  player.usedPowers['prospecting'] = true;
  clampResources(player);
  s.log.unshift({ turn: s.turn, slot, type: "power",
    text: `${player.username} used Prospecting: 1 ${fromResource} → 2 ${toResource}` });
  return ok(s);
}

// nationalist L3: Donations — steal 2 resources from opponent
function donations(state, slot) {
  if (state.phase !== "action")   return err("Not in action phase");
  if (state.currentSlot !== slot) return err("Not your turn");
  const s = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);
  const opp    = s.players.find(p => p.slot !== slot);
  if (player.ideologyCards.danda < 3) return err("Need 3 Danda cards for Shakuni's Gambit");
  if (player.usedPowers['donations'])  return err("Already used this power this turn");
  let stolen = 0;
  const sorted = [...RESOURCE_TYPES].sort((a, b) => opp[b] - opp[a]);
  for (const r of sorted) {
    if (stolen >= 2) break;
    const take = Math.min(opp[r], 2 - stolen);
    opp[r] -= take; player[r] += take; stolen += take;
  }
  player.usedPowers['donations'] = true;
  clampResources(player);
  s.log.unshift({ turn: s.turn, slot, type: "power",
    text: `${player.username} used Donations — snatched ${stolen} resources from ${opp.username}` });
  return ok(s);
}

// nationalist L5: Payback — discard 2 opponent voters from any zone
function payback(state, slot, zoneIndex) {
  if (state.phase !== "action")   return err("Not in action phase");
  if (state.currentSlot !== slot) return err("Not your turn");
  const s = JSON.parse(JSON.stringify(state));
  const player  = s.players.find(p => p.slot === slot);
  const oppSlot = slot === 1 ? 2 : 1;
  if (player.ideologyCards.danda < 5) return err("Need 5 Danda cards for Ashwatthama's Wrath");
  if (player.usedPowers['payback'])  return err("Already used this power this turn");
  const zone = s.zones[zoneIndex];
  if (!zone) return err("Invalid zone");
  if (checkMajority(zone) !== null) return err("Cannot target locked zone");
  let removed = 0;
  while (removed < 2 && zone.pegs.includes(oppSlot)) {
    zone.pegs.splice(zone.pegs.lastIndexOf(oppSlot), 1); removed++;
  }
  player.usedPowers['payback'] = true;
  s.log.unshift({ turn: s.turn, slot, type: "power",
    text: `${player.username} used Payback — discarded ${removed} voters from ${zone.name}` });
  return ok(_checkGameEnd(s));
}

// corporatist L5: Breaking Ground — evict 3 voters from any zone
function breakingGround(state, slot, zoneIndex) {
  if (state.phase !== "action")   return err("Not in action phase");
  if (state.currentSlot !== slot) return err("Not your turn");
  const s = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);
  if (player.ideologyCards.artha < 5) return err("Need 5 Artha cards for Bhima's Might");
  if (player.usedPowers['breaking_ground'])  return err("Already used this power this turn");
  const zone = s.zones[zoneIndex];
  if (!zone) return err("Invalid zone");
  if (checkMajority(zone) !== null) return err("Cannot target locked zone");
  const removed = zone.pegs.splice(Math.max(0, zone.pegs.length - 3));
  player.usedPowers['breaking_ground'] = true;
  s.log.unshift({ turn: s.turn, slot, type: "power",
    text: `${player.username} used Breaking Ground — evicted ${removed.length} voters from ${zone.name}` });
  return ok(_checkGameEnd(s));
}

// progressive L5: Tough Love — convert 2 opponent voters in zones you lead
function toughLove(state, slot, zoneIndex) {
  if (state.phase !== "action")   return err("Not in action phase");
  if (state.currentSlot !== slot) return err("Not your turn");
  const s = JSON.parse(JSON.stringify(state));
  const player  = s.players.find(p => p.slot === slot);
  const oppSlot = slot === 1 ? 2 : 1;
  if (player.ideologyCards.dharma < 5) return err("Need 5 Dharma cards for Yudhishthira's Dharma");
  if (player.usedPowers['tough_love'])  return err("Already used this power this turn");
  const zone = s.zones[zoneIndex];
  if (!zone) return err("Invalid zone");
  if (incursionRights(zone) !== slot)  return err("Must have incursion rights to use Tough Love");
  let converted = 0;
  while (converted < 2 && zone.pegs.includes(oppSlot)) {
    const i = zone.pegs.lastIndexOf(oppSlot);
    zone.pegs[i] = slot; converted++;
  }
  if (converted === 0) return err("No opponent voters to convert");
  player.usedPowers['tough_love'] = true;
  s.log.unshift({ turn: s.turn, slot, type: "power",
    text: `${player.username} used Tough Love — converted ${converted} voters in ${zone.name}` });
  return ok(_checkGameEnd(s));
}

// ─── End Turn ─────────────────────────────────────────────────────────────────

function endTurn(state, slot) {
  if (state.currentSlot !== slot) return err("Not your turn");
  if (state.phase !== "action")   return err("Not in action phase");

  const s      = JSON.parse(JSON.stringify(state));
  const player = s.players.find(p => p.slot === slot);

  // If headline pending, resolve it now
  if (s.pendingHeadline) {
    const res = resolveHeadline(s, slot);
    if (!res.ok) return res;
    Object.assign(s, res.state);
  }

  s.log.unshift({ turn: s.turn, slot, type: "end_turn",
    text: `${player.username} ended their turn` });

  return ok(_advanceTurn(s));
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function _checkGameEnd(state) {
  const winner = checkWin(state.zones);
  if (winner !== null) {
    state.winner = winner;
    state.phase  = "finished";
    state.scores = getScores(state.zones);
    const winPlayer = state.players.find(p => p.slot === winner);
    state.log.unshift({ turn: state.turn, slot: winner, type: "win",
      text: winner === 0 ? "Draw!" : `${winPlayer?.username} wins with ${state.scores[winner]} points!` });
  }
  return state;
}

function _advanceTurn(state) {
  state.currentSlot   = state.currentSlot === 1 ? 2 : 1;
  if (state.currentSlot === 1) state.turn++;
  state.phase         = "ideology";
  state.incursionUsed = {};
  // Reset per-turn power flags for the new current player
  const newPlayer = state.players.find(p => p.slot === state.currentSlot);
  if (newPlayer) {
    newPlayer.usedPowers = {};
    newPlayer.helpingHandsActive = false;
    newPlayer.helpingHandsUsed = 0;
  }
  return state;
}

function _refreshVoterCards(state) {
  syncSoldierCards(state);
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
  influenceSoldierCard,
  incursion,
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
  incursionRights,
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
