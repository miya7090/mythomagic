// @miya7090

MY_SOCKET = undefined;
OPPONENT_SOCKET_ID = undefined;
SELF_NAME = undefined;
OTHER_NAME = undefined;

BROADCASTING = false;
BROADCAST_QUEUE = [];

GITHUB_PUBLIC_PATH = "https://raw.githubusercontent.com/miya7090/mythomagic/main/public/";

BASE_DAMAGE_DIFF_SCALE_TO_HP = 20
MVMT_SPD_SCALE_TO_SAVE_THROW = 20
DEFENCE_SCALE_TO_SAVE_THROW = 20
RANDOM_DAMAGE_OFFSET = 20
STATUS_DEFAULT_LENGTH = 3
MAX_STATUS_STACKS = 7
FIGURINE_ATTACK_MULTIPLIER = 1.2
FIGURINE_INFLICT_STATUS_FLAT_BOOST = 5
FIGURINE_SAVING_THROW_FLAT_BOOST = 5
HEX_SIDELENGTH = 13;
HEX_RADIUS = (HEX_SIDELENGTH-1)/2;
CUBE_DIR_VECS = [[1,0,-1],[1,-1,0],[0,-1,1],[-1,0,1],[-1,1,0],[0,1,-1]];
MOUSE_HOVER_RADIUS = 0;
CURRENT_MOUSE_Q = undefined;
CURRENT_MOUSE_R = undefined;
CURRENT_MOUSE_S = undefined;
ABILITY_MANA_REQ = 200;
MAX_MANA = 1000;
HEXTILE_CUBIC_INDEX = {}; // keys: "q,r,s", maps to divs that are hextiles

PICK_PHASE_TIMER = 45000; // 45 sec in ms
PICK_PHASE_STARTED_AT = undefined;
GAME_MODE = "startup"; // startup, pick-phase; [p1-]active, moveToken, attackSelect, autoattack, ability, abilityAim, ultimate, ultimateAim; [p2-]turn1, turn2
GAME_MODE_MEMORYTARGET = undefined; // used if moving tokens, etc

TURNS_ALLOCATED = 0;
const OLYMPIAN_LIST = ["Zeus", "Hera", "Poseidon", "Demeter", "Athena", "Apollo", "Artemis", "Ares", "Aphrodite", "Hephaestus", "Hermes", "Dionysus", "Hestia"];

const BASE_STAT_DICT = {
    // name, base atk, normal atk range, defense, hp, mana per turn, mana per attack, mvt speed
    // ability aimed range/aoe, ult aimed range/aoe
    "Athena":[3000,2,15,700,50,0,3, 3,0,6,0,
      "Aegis","Ally within 3 units gains 15 DEF and has their statuses cleared",
      "Deliberate Strike","Deal 400 true damage to one target within 6 units",
      "Well-Prepared","Player cards start game with 200 MP"], 
    "Apollo":[2000,4,10,700,60,0,3, 5,2,undefined,undefined,
      "Volley","Attack with 10% extra damage to enemies in a 2-tile radius, up to 5 tiles away",
      "Inspiration","For all allies, clear all statuses, recover 20% max HP, and recover 20% max MP",
      "Medicine","+10 HP to all heroes, -10 HP to all enemies after each of your turns"],
    "Achilles":[2900,2,20,600,50,0,3, undefined,3,undefined,undefined,
      "Berserk","Clear all statuses from self and attack all enemies within 3 tiles with 20% more damage",
      "Invulnerability", "HP set to 1 HP, gain 50 DEF",
      "Clarity","Clear all statuses, gain 1000 ATK when ally defeated"],
    "Medea":[1200,2,10,500,40,0,2, 3,0,1,0,
      "Sorcery", "Drain all mana from enemy within 3 tiles and inflict Poisoned",
      "Cold Blood", "Deal fatal blow to an adjacent ally, absorb their current ATK, DEF, MVT, and regain full HP",
      "Circulation", "No ally can obtain more than one status effect at a time, and repeated effects will not stack"], 
    "Poseidon":[4000,2,10,700,50,0,2, undefined,9,undefined,5, // removed for now
      "*Whirlpool","Pull all enemies 3 tiles towards self, 200 true damage to each",
      "Hurricane","Deal 300 true damage to all targets within 5 tiles",
      "*Aquatic Healing","Gain 100 HP per turn while in water"],
    "Thanatos":[1800,2,10,600,60,0,3, 1,0,undefined,undefined,
      "Soul Collection","Attacks adjacent target, and if enemy is defeated, absorb their MP and 50% of their ATK",
      "Reaper","All cards with less than 100 HP receive 100 true damage",
      "Watchful","Inflicts Terrified on any opponent if they lose over 50% of their HP at once"],
    "Hestia":[500,2,15,1000,60,0,1, undefined,2,undefined,2,
      "Warming Hearth","Heal all allies within 2 tiles by 300 HP",
      "Eternal Flame","Increase max HP of allies within 2 tiles by 200 HP and heal them 300 HP",
      "Shelter", "While adjacent to Hestia, allies' DEF is increased by 10, and max HP increased by 200"],
    "Kronos":[3000,2,10,800,50,0,1, 3,1,undefined,undefined,
      "Scythe","Attack targets in a 1-tile radius up to 3 units away, inflicting Stunned",
      "Stasis","Deals 200 true damage to all Stunned enemies, and grants additional turn",
      "Infinite Power","Gains 50 ATK and 1 DEF on each of your turns"],
    "Perseus":[1600,2,10,500,60,0,3, undefined,2,undefined,undefined,
      "Undaunted","Using only base stats and ignoring status effects, attack all enemies within 2 tiles",
      "Swordsmanship","Receive ATK and DEF increase by 20%, MVT increase by 1",
      "Cap of Invisibility","After an enemy is defeated, become Obscured and increase MVT by 1"],
    "Hera":[1400,2,15,800,50,0,2, 3,0,6,0,
      "Protector","Grants 10 DEF, 200 HP, 100 MP to ally within 3 tiles",
      "Wrath","Max HP of enemy within 6 tiles reduced to 100",
      "Queen of Olympus","All allies permanently gain 100 max HP for each Olympian added to the deck"],
    "Hermes":[1200,2,10,600,50,0,4, 1,0,1,0,
      "Trade Offer","Swap stats with adjacent target's better stats, with 50% chance success for each",
      "Lucky","Adjacent ally has a 50-50 chance of their stats being either halved or tripled",
      "Messenger","All adjacent allies have their MVT increased by 2"],
    "Heracles":[3200,2,15,500,50,0,3, undefined,3,undefined,1,
      "Efficiency","Attack all targets within 3 tiles with 50% more damage",
      "Lion Cloak","Double the DEF of all adjacent allies",
      "Determination","Will take at maximum 300 HP of damage per attack"],
    "Hades":[4000,2,10,800,50,0,2, 4,0,undefined,undefined,
      "Conductor","Cause a defeated target within 4 tiles to autoattack enemies",
      "Overlord","Defeated targets gain 300 ATK and autoattack enemies",
      "Cerberus","Prevents any enemy from being revived"],
    "Hecate":[3200,2,10,700,50,0,2, 2,0,undefined,undefined,
      "Dark Flame","Deal 200 true damage to target within 2 tiles",
      "Mist","Cause all allies to become Obscured",
      "Magician","Allies accumulate an extra 20 MP per turn"],
    "Icarus":[400,2,10,700,50,0,1, undefined,undefined,undefined,undefined,
      "Accelerate","Gain 1 MVT and decrease max HP by 50",
      "Breakneck","Gain 3 MVT and halve current health",
      "Blistering Speed","Gain 350 ATK and lose 2 DEF for each point of MVT"]
  } // #TODO add method to preview these before game start


  const STATUSES_DEF_DICT = {
    "charmed": "DEF reduced to 1",
    "distracted": "will not gain MP\nDEF reduced by 25%",
    "poisoned": "loses [500/DEF] HP each turn",
    "stunned": "ATK, MVT reduced to 0\nRC reduced to 1",
    "terrified": "ATK reduced by 50%",
    "obscured": "location not visible to enemy\nATK reduced by 10%"
  }
  
  let PLAYER_OWNED_temp = ["Athena","Apollo","Achilles","Medea","Thanatos","Hestia","Kronos","Perseus","Hera","Hermes","Heracles","Hades","Hecate","Icarus"];
  PLAYER_OWNED_temp.sort();
  const PLAYER_OWNED = PLAYER_OWNED_temp;
  const PLAYER_HOLOFOIL = ["Athena","Apollo","Hephaestus","Nyx"]; // #TODO remove
  PLAYER_GAMECARD_OBJS = [];
  ENEMY_GAMECARD_OBJS = [];