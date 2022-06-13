// @miya7090

MY_SOCKET = undefined;
OPPONENT_SOCKET_ID = undefined;
OTHER_NAME = undefined;

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
MAX_MANA = 1000;
HEXTILE_CUBIC_INDEX = {}; // keys: "q,r,s", maps to divs that are hextiles

PICK_PHASE_TIMER = 15000; // 15 sec in ms
PICK_PHASE_STARTED_AT = undefined;
GAME_MODE = "startup"; // startup, pick-phase; [p1-, p2-]active, moveToken, attackSelect, autoattack, ability, abilityAim, ultimate, ultimateAim
GAME_MODE_MEMORYTARGET = undefined; // used if moving tokens, etc

const BASE_STAT_DICT = {
    // name, base atk, normal attack range, defense, hp, mana per turn, mana per attack, movement speed, ability aimed, ult aimed
    "Athena":[3000,2,15,700,100,100,1,2,3,undefined,3], 
    "Kronos":[3000,2,10,700,100,250,1,2,3,undefined,3], 
    "Achilles":[2900,2,20,600,100,250,2,undefined,4,undefined,6],
    "Apollo":[2000,6,10,700,100,250,1,undefined,7,2,7],
    "Jason":[2100,2,10,800,100,250,1,undefined,2,3,5],
    "Hephaestus":[500,2,15,1200,250,0,1,4,3,2,2],
    "Poseidon":[500,2,15,1200,250,0,1,5,3,2,3],
    "Nyx":[500,2,15,1200,250,0,1,2,2,4,2],
    "Nike":[500,2,15,1200,250,0,1,undefined,2,undefined,4]
  }
  
  const PLAYER_OWNED = ["Athena","Kronos","Apollo","Nike","Hephaestus","Nyx"];
  const PLAYER_HOLOFOIL = ["Athena","Apollo","Hephaestus","Nyx"];
  PLAYER_GAMECARD_OBJS = [];
  ENEMY_GAMECARD_OBJS = [];