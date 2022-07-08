// @miya7090

MY_SOCKET = undefined;
OPPONENT_SOCKET_ID = undefined;
REGION_NAME = undefined;
SELF_NAME = undefined;
OTHER_NAME = undefined;

BROADCASTING = false;
BROADCAST_QUEUE = [];

GITHUB_PUBLIC_PATH = "https://raw.githubusercontent.com/miya7090/mythomagic/main/public/";

HEX_SIDELENGTH = 13;
HEX_RADIUS = (HEX_SIDELENGTH-1)/2;
CUBE_DIR_VECS = [[1,0,-1],[1,-1,0],[0,-1,1],[-1,0,1],[-1,1,0],[0,1,-1]];
MOUSE_HOVER_RADIUS = 0;
CURRENT_MOUSE_Q = undefined;
CURRENT_MOUSE_R = undefined;
CURRENT_MOUSE_S = undefined;
HEXTILE_CUBIC_INDEX = {}; // keys: "q,r,s", maps to divs that are hextiles

ABILITY_MANA_REQ = 200;
MAX_MANA = 1000;
STATUS_DEFAULT_LENGTH = 4+1;

BGM_MUTE = false;
const SOUND_MAP = {
  "bgm":                ["50 mulling"],
  "radiusChange":       ["new_tap"],
  "tileHovers":         ["clack5", "clack6"],
  "playerCardHovers":   ["clack3", "clack4"],
  "playerCardSelect":   ["clack2", "clack3"],
  "availableCardHovers":["clack3", "clack4"],
  "availableCardSelect":["clack1", "clack2"],
  "pickPhaseTick":      ["new_tick"],
  "playerPhaseTick":    ["new_ticksubtle"],
  "passClicked":        ["new_pass"],
  "autoattackClicked":  ["tile_hit"],
  "abilityClicked":     ["tile_hit"],
  "ultimateClicked":    ["tile_rattle"],
  "heroDeath":          ["tile_break"],
  "yourTurnNow":        ["new_chime"],
  "tokenPickedUp":      ["tile_clack1"],
  "tokenPutDown":       ["tile_drag1","tile_drag2"],
  "undo":               ["new_switch"]
}

SOUND_OBJECTS = undefined;

PICK_PHASE_RANDOM = undefined;
PICK_PHASE_TIMER = undefined;
PICK_PHASE_STARTED_AT = undefined;

TIMED_TURNS = undefined;
TURN_TIMER = undefined;
TURN_STARTED_AT = undefined;

AM_WAITING_FOR_OPPONENT_RECONNECT = false;
WAIT_FOR_RECONNECT = 10000; // wait 10 sec each time after opponent disconnects

GAME_MODE = "startup"; // startup, pick-phase; [p1-]active, moveToken, attackSelect, autoattack, ability, abilityAim, ultimate, ultimateAim; [p2-]turn1, turn2
GAME_MODE_MEMORYTARGET = undefined; // used if moving tokens, etc

TURNS_ALLOCATED = 0;

const OLYMPIAN_LIST = ["Zeus", "Hera", "Poseidon", "Demeter", "Athena", "Apollo", "Artemis", "Ares", "Aphrodite", "Hephaestus", "Hermes", "Dionysus", "Hestia"];
const ARGONAUT_LIST = ["Jason", "Atalanta", "Argus", "Heracles", "Orpheus", "Peleus", "Theseus"];

// alphabetically first goes first
const PAIRING_LIST = [["Jason","Medea"], ["Hera","Zeus"], ["Hades","Persephone"], ["Echo","Narcissus"], ["Aphrodite","Hephaestus"], ["Andromeda","Perseus"], ["Ariadne","Theseus"], ["Eros","Psyche"], ["Aphrodite","Ares"], ["Kronos","Rhea"], ["Ariadne","Dionysus"], ["Gaea","Ouranos"], ["Amphitrite","Poseidon"], ["Adonis","Aphrodite"]];

const BASE_STAT_DICT = {
    // name, base atk, normal atk range, defense, hp, mana per turn, mana per attack, mvt speed
    // ability aimed range/aoe, ult aimed range/aoe

    // available classes: Melee, Ranged, Protector, Healer, Supporter, Caster, Special

    "Athena":[2800,2,15,700,50,0,3, 3,0,6,0,
      "Aegis","Ally within 3 units gains 15 DEF and has their statuses cleared",
      "Deliberate Strike","Deal 600 true damage to one target within 6 units",
      "Well-Prepared","Allies start game with 200 MP", "Supporter"], 
    "Apollo":[2000,3,10,700,60,0,2, 5,2,undefined,undefined,
      "Volley","Attack with 10% extra damage to enemies in a 2-tile radius, up to 5 tiles away",
      "Inspiration","For all allies, clear all statuses, recover 20% max HP, and recover 20% max MP",
      "Medicine","+20 HP to all heroes, -10 HP to all enemies after each of your turns", "Healer"],
    "Artemis":[2800,3,10,700,60,0,3, 5,0,5,2,
      "Skillful Shot","Deal 100 true damage to an enemy up to 5 tiles away",
      "Hunting Trap","Inflict Stunned on all enemies in a 2-tile radius, up to 5 tiles away",
      "Ambush","Skillful Shot does 3x damage when targeting an enemy with over 75% HP", "Ranged"],
    "Atalanta":[2900,2,10,700,80,0,3, undefined,1,undefined,1,
      "First Blood","Attack all adjacent enemies, dealing an extra 150 true damage to enemies with full HP",
      "Grapple","Inflict Stunned on an adjacent enemy and deal 300 true damage",
      "Dismissal","Autoattacks deal an extra 100 true damage to enemies with lesser MVT", "Melee"],
    "Achilles":[2900,2,20,500,50,0,3, undefined,3,undefined,undefined,
      "Berserk","Clear all statuses from self and attack all enemies within 3 tiles with 20% more damage",
      "Invulnerability", "HP set to 1 HP, gain 50 DEF",
      "Clarity","Clear all statuses, gain 1000 ATK when an ally is defeated", "Melee"],
    "Gaea":[1200,1,15,1000,50,0,1, 2,0,undefined,undefined,
      "Rejuvenation","Heal 100 HP and give 100 MP to ally within 2 tiles",
      "Revitalization", "Heal 200 HP to all allies",
      "Resurgence","Heal 50 HP to allies after taking damage", "Healer"],
    "Jason":[1800,2,10,800,70,0,2, undefined,undefined,undefined,undefined,
      "Teamwork","Increase the DEF of the ally with the lowest DEF by 2",
      "Captainship", "Increase DEF of all allies by 1, decrease DEF of all enemies by 3",
      "Argonautica","All allies gain 100 ATK for each Argonaut added to the deck", "Protector"],
    "Medea":[1200,2,10,500,40,0,2, 3,0,1,0,
      "Sorcery", "Drain all mana from an enemy within 3 tiles and inflict Poisoned",
      "Cold Blood", "Deal fatal blow to an adjacent ally, absorb their current ATK and MVT, and regain full HP",
      "Circulation", "No ally can obtain more than one status effect at a time, and repeated effects will not stack", "Special"],
    "Thanatos":[1800,2,10,600,60,0,3, 1,0,undefined,undefined,
      "Soul Collection","Attacks adjacent target, and if enemy is defeated, absorb their MP and 50% of their ATK",
      "Reaper","All enemies with less than 100 HP receive 100 true damage",
      "Watchful","Inflicts Terrified on any opponent if they lose over 50% of their HP at once", "Caster"],
    "Hestia":[500,2,15,1000,60,0,1, undefined,2,undefined,2,
      "Warming Hearth","Heal all allies within 2 tiles by 300 HP",
      "Eternal Flame","Increase max HP of allies within 2 tiles by 200 HP and heal them 300 HP",
      "Shelter", "While adjacent to Hestia, allies' DEF is increased by 10, and max HP increased by 200", "Protector"],
    "Kronos":[2200,2,10,800,50,0,1, 2,1,undefined,undefined,
      "Scythe","Attack targets in a 1-tile radius up to 2 units away, inflicting Stunned",
      "Stasis","Deals 200 true damage to all Stunned enemies, and grants additional turn",
      "Infinite Power","Gains 50 ATK and 1 DEF on each of your turns", "Caster"],
    "Perseus":[1800,2,10,500,60,0,3, undefined,2,undefined,undefined,
      "Undaunted","Using only base stats and ignoring status effects, attack all enemies within 2 tiles",
      "Swordsmanship","Receive ATK and DEF increase by 20%, MVT increase by 1",
      "Cap of Invisibility","After an enemy is defeated, become Obscured and increase MVT by 1", "Melee"],
    "Hera":[1400,2,15,800,50,0,2, 2,0,6,0,
      "Blessing","Grants 5 DEF, 200 HP, 100 MP to ally within 2 tiles",
      "Wrath","Max HP of enemy within 6 tiles reduced to 100",
      "Queen of Olympus","All allies gain 1 DEF for each Olympian added to the deck", "Protector"],
    "Hermes":[1200,2,10,600,50,0,4, 1,0,1,0,
      "Trade Offer","Swap stats with adjacent target's better stats, with 50% chance success for each",
      "Lucky","Adjacent ally has a 50-50 chance of their stats being either halved or tripled",
      "Messenger","All adjacent allies have their MVT increased by 2", "Supporter"],
    "Heracles":[3000,2,15,500,50,0,3, undefined,3,undefined,1,
      "Efficiency","Attack all targets within 3 tiles with 50% more damage",
      "Lion Cloak","Double the DEF of all adjacent allies",
      "Determination","Will take at maximum 300 HP of damage per attack", "Melee"],
    "Hades":[2800,1,10,800,50,0,2, 2,0,undefined,undefined,
      "Conductor","Cause a defeated target within 2 tiles to autoattack enemies",
      "Overlord","All defeated heroes gain 300 ATK and autoattack enemies",
      "Cerberus","Prevents any enemy from being revived", "Special"],
    "Hecate":[1800,2,10,700,50,0,2, 2,0,undefined,undefined,
      "Dark Flame","Deal 200 true damage to target within 2 tiles",
      "Mist","Cause all allies to become Obscured",
      "Magician","Allies accumulate an extra 30 MP per turn", "Supporter"],
    "Icarus":[400,2,10,700,70,0,1, undefined,undefined,undefined,undefined,
      "Accelerate","Gain 1 MVT and decrease max HP by 50",
      "Breakneck","Gain 3 MVT and halve current health",
      "Blistering Speed","Gain 400 ATK and lose 2 DEF for each point of MVT", "Supporter"],
    "Orpheus":[400,2,10,600,50,0,2, undefined,undefined,undefined,undefined,
      "Serenade","Heal 200 HP to the ally with lowest health",
      "Passacaglia","Inflict Distracted on all enemies",
      "Requiem","Allies defeated while Orpheus has full HP and full MP are revived to full health", "Healer"],
    "Echo":[400,2,15,700,50,0,2, undefined,undefined,1,0,
      "Whisper","Become Obscured",
      "Replica","Imitate an adjacent enemy, if not already in deck",
      "Reflection","Enemies that autoattack Echo receive the same amount of damage", "Special"],
    "Themis":[1400,2,15,800,30,0,2, 3,0,undefined,undefined,
      "Verdict","Revert target within 3 units to their base stats and clear status effects",
      "Fair-Minded","Revert all enemies to their base stats and clear all status effects",
      "Objection","No enemy can accumulate over 5000 ATK or 30 DEF", "Caster"],
    "Hephaestus":[2600,2,15,800,50,0,2, 5,1,4,2,
      "Grenade","Obscure allies and stun enemies in a 1-tile radius up to 5 units away",
      "Eruption","Attack with 50% extra damage in a 2-tile radius up to 4 units away",
      "Blacksmith","Allies' autoattacks have a 50% chance of dealing an extra 100 true damage", "Ranged"],
    "Eros":[2200,3,10,800,50,0,2, 4,0,undefined,undefined,
      "Love Shot","Inflict Charmed on enemy up to 4 tiles away",
      "Crush","Deal 200 true damage to all Charmed enemies and drain their MP",
      "Heart Attack","Enemies that autoattack Eros become Charmed", "Caster"],
    "Aphrodite":[1400,2,15,600,60,0,2, 3,0,5,0,
      "Letter","Gift 200 MP to ally up to 3 tiles away",
      "Poem","Gift 400 MP to ally up to 5 tiles away, and clear their status effects",
      "Scenario","For each pair of allies with a romantic relationship, accumulate an extra 20 MP per turn", "Supporter"],
    "Nyx":[1600,2,10,600,60,0,2, 3,0,1,0,
      "Twilight","Reduce MP turn accumulation by 20 for an enemy up to 3 tiles away",
      "Oblivion","Permanently disable the ultimate of an adjacent enemy",
      "Night Walk","Able to move on off-grid tiles", "Caster"]
  }

  const STATUSES_DEF_DICT = {
    "charmed": "DEF reduced by 50%",
    "distracted": "will not gain MP\nDEF reduced by 25%",
    "poisoned": "loses [500/DEF] HP each turn",
    "stunned": "ATK, MVT reduced to 0\nRC reduced to 1",
    "terrified": "ATK reduced by 50%",
    "obscured": "location not visible to enemy\nATK reduced by 10%"
  }

  const HERO_CLASS_DESCRIPTIONS = {
    "Melee": "excels at close combat using aggressive strategies",
    "Ranged": "deals damage to enemies from a distance",
    "Protector": "enhances survivability, good for defensive strategies",
    "Healer": "restores the health of allies",
    "Supporter": "boosts ally stats and bestows various blessings",
    "Caster": "worsens enemy stats and inflicts impairments",
    "Special": "uniquely influences the outcome of the game"
  }
  
  let PLAYER_OWNED_temp = Object.keys(BASE_STAT_DICT);
  PLAYER_OWNED_temp.sort();
  const PLAYER_OWNED = PLAYER_OWNED_temp;
  const PLAYER_OWNED_FIGHTERS = PLAYER_OWNED.filter(key => (BASE_STAT_DICT[key][17] == "Melee" || BASE_STAT_DICT[key][17] == "Ranged"));

  const PLAYER_OWNED_MELEE = PLAYER_OWNED.filter(key => BASE_STAT_DICT[key][17] == "Melee");
  const PLAYER_OWNED_RANGED = PLAYER_OWNED.filter(key => BASE_STAT_DICT[key][17] == "Ranged");
  const PLAYER_OWNED_PROTECTORS = PLAYER_OWNED.filter(key => BASE_STAT_DICT[key][17] == "Protector");
  const PLAYER_OWNED_HEALERS = PLAYER_OWNED.filter(key => BASE_STAT_DICT[key][17] == "Healer");
  const PLAYER_OWNED_SUPPORTERS = PLAYER_OWNED.filter(key => BASE_STAT_DICT[key][17] == "Supporter");
  const PLAYER_OWNED_CASTERS = PLAYER_OWNED.filter(key => BASE_STAT_DICT[key][17] == "Caster");
  const PLAYER_OWNED_SPECIAL = PLAYER_OWNED.filter(key => BASE_STAT_DICT[key][17] == "Special");
  
  PLAYER_GAMECARD_OBJS = [];
  ENEMY_GAMECARD_OBJS = [];
