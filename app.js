var express = require('express');
var app = express();
const server = require("http").Server(app); // create server
const io = require("socket.io")(server); // create instance of socketio
const PORT = process.env.PORT || 3000;

// room tracker, BOTH REGIONS AND GAMES {socketid: room}
var roomBook = {};

// lobby tracker, REGIONS ONLY {region: {socketid: nickname}}
var regionUsers = {"olympia=====": {}, "corinth=====": {}, "athens=====": {}, "sparta=====": {}};

// player tracker, GAMES ONLY
var rivalFinder = {}; // {socketid: socketid}
var roommateFinder = {}; // {room: [socketid, socketid]}
var doneTokenPick = {}; // {room: gameCardJsonObjs} where objs array is included if 1 person finished token pick
var gameHasBegun = {}; // {room: bool} where true if token pick is done

// lobby code processing
function rk(regionName){ return regionName + "====="; }
function nk(rkRegion){ return rkRegion.slice(0, -5); }
function isLobbyId(roomcode) {
  if (roomcode == undefined) { return false; }
  return (roomcode.slice(roomcode.length-5) == "=====");
}

app.use(express.static(__dirname + "/public")); // use "public" directory for static files

function kickOutSocketOpponentFromLastRoom(socketId) {
  if (!(socketId in rivalFinder)){
    console.error("can't find socket opponent to kick out", socketId);
  } else {
    kickOutSocketFromLastRoom(rivalFinder[socketId]);
  }
}

function kickOutSocketFromLastRoom(socketId) { // returns the room code that was kicked out of
  if (!(socketId in roomBook)) {
    console.log("socket not found in room book", socketId); // normal behavior for the main (non-lobby non-game) page
  } else {
    let thisRoomCode = roomBook[socketId]; // remove from roomBook
    delete roomBook[socketId];

    if (isLobbyId(thisRoomCode)) { // if it's in a lobby room
      let nickname = regionUsers[thisRoomCode][socketId];
      delete regionUsers[thisRoomCode][socketId];
      io.to(thisRoomCode).emit("lobbyLeft", socketId, nickname, nk(thisRoomCode), regionUsers[thisRoomCode]);

    } else { // if it's in a game room
      delete rivalFinder[socketId];
      roommateFinder[thisRoomCode].splice(roommateFinder[thisRoomCode].indexOf(socketId), 1);
    }

    return thisRoomCode;
  }
}

function removeGameRoom(roomCode) {
  if (isLobbyId(roomCode)) {
    console.error("can't remove room: socket is in lobby not game room", socketId);
  } else {
    delete roommateFinder[roomCode];
    delete doneTokenPick[roomCode];
    delete gameHasBegun[roomCode];
  }
}

function demolishRoomOf(socketId){
  kickOutSocketOpponentFromLastRoom(socketId);
  let roomCode = kickOutSocketFromLastRoom(socketId);
  removeGameRoom(roomCode);
}

io.on("connection", socket => {
  /* ~~~~~ managing sockets of any type ~~~~~ */
  socket.on("disconnect", () => {
    console.log("A",socket.id);
    if (socket.id in roomBook) { // in game
      let thisRoomCode = roomBook[socket.id];
      console.log("B",socket.id);
      if (isLobbyId(roomBook[socket.id])) {
        console.log("C",socket.id);
        kickOutSocketFromLastRoom(socket.id); // in lobby
      } else {
        console.log("D",socket.id);
        if (roommateFinder[thisRoomCode].length > 0) {
          console.log("E",socket.id, rivalFinder[socket.id]);
          io.to(rivalFinder[socket.id]).emit("opponentDisconnectWarning"); // warn the opponent
        }

        kickOutSocketFromLastRoom(socket.id); // in game room
        if (roommateFinder[thisRoomCode].length == 0){
          console.log("F",socket.id);
          removeGameRoom(thisRoomCode); // game room empty
        }       
        
      }
      console.log("G",socket.id);
    } else {
      console.log("socket left without being assigned to a room", socket.id); // normal behavior for the main (non-lobby non-game) page
    }
  });

  socket.on("commandDisconnectGame", () => {
    demolishRoomOf(socket.id);
  });

  /* ~~~~~ lobby socket operations ~~~~~ */
  socket.on("lobbyJoin", (nickname, region) => {
    kickOutSocketFromLastRoom(socket.id);
    socket.join(rk(region));
    regionUsers[rk(region)][socket.id] = nickname;
    roomBook[socket.id] = rk(region);
    io.to(rk(region)).emit("lobbyJoined", nickname, region, regionUsers[rk(region)]);
  });

  socket.on("lobbyLeave", () => {
    kickOutSocketFromLastRoom(socket.id);
  });

  socket.on("gameInvite", (inviterNickname, recipientId)=>{
    io.to(recipientId).emit("gameInvite", inviterNickname, socket.id);
  });
  
  socket.on("roomRequest", (room, inviterNickname, inviterId, recipientNickname)=>{
    let lobbyCode = nk(roomBook[socket.id]);
    kickOutSocketFromLastRoom(socket.id);
    kickOutSocketFromLastRoom(inviterId);
    // #TODO emit only one update for removing 2 lobbiers
    //io.to(rk(region)).emit("lobbyLeft2", inviterNickname, recipientNickname, region, regionUsers[rk(region)]);
    io.to(inviterId).emit("redirectToGame", inviterNickname, recipientNickname, room, lobbyCode);
    io.to(socket.id).emit("redirectToGame", recipientNickname, inviterNickname, room, lobbyCode);
  });

  socket.on("denyChallengeRequest", (ownNickname, enemyId)=>{
    io.to(enemyId).emit("gameRequestDenied", ownNickname);
  });

  /* ~~~~~ player socket operations ~~~~~ */
  socket.on("registerPlayer", (roomCode) => {
    if (gameHasBegun[roomCode] == true) { // rejoining a disconnected game
      if (roommateFinder[roomCode].length >= 2) { // players already playing
        io.to(socket.id).emit("cannotJoinGame");
      } else if (roommateFinder[roomCode].length == 0) { // both players have left
        io.to(socket.id).emit("cannotJoinGame");
        demolishRoomOf(socket.id);
      } else { // success
        socket.join(roomCode);
        roomBook[socket.id] = roomCode;

        roommateFinder[roomCode].push(socket.id);
        rivalFinder[roommateFinder[roomCode][0]] = roommateFinder[roomCode][1];
        rivalFinder[roommateFinder[roomCode][1]] = roommateFinder[roomCode][0];

        io.to(roommateFinder[roomCode][0]).emit("rivalRejoined");
      }
    } else { // joining a new game
      socket.join(roomCode);
      roomBook[socket.id] = roomCode;
      if (roomCode in roommateFinder){
        roommateFinder[roomCode].push(socket.id);
        rivalFinder[roommateFinder[roomCode][0]] = roommateFinder[roomCode][1];
        rivalFinder[roommateFinder[roomCode][1]] = roommateFinder[roomCode][0];

        console.log(roommateFinder[roomCode], "entering tokenPickPhase");
        io.to(roommateFinder[roomCode][0]).emit("tokenPickPhase", roommateFinder[roomCode][1]);
        io.to(roommateFinder[roomCode][1]).emit("tokenPickPhase", roommateFinder[roomCode][0]);
      } else {
        roommateFinder[roomCode] = [socket.id];
      }
    }
  });

  socket.on("doneWithTokenPick", (gameCardJsonObjs)=>{
    let roomCode = roomBook[socket.id];
    let rivalId = rivalFinder[socket.id];
    if (roomCode in doneTokenPick){ // opponent is also done
      // check that both have chosen >= 1 token
      if (gameCardJsonObjs.length == 0 && doneTokenPick[roomCode] && 0){
        io.to(roomCode).emit("forfeit", "did not pick any cards");
        demolishRoomOf(socket.id);
      } else if (gameCardJsonObjs.length == 0){
        io.to(socket.id).emit("forfeit", "did not pick any cards");
        io.to(rivalId).emit("winThroughForfeit", "opponent did not pick any cards");
        demolishRoomOf(socket.id);
      } else if (doneTokenPick[roomCode].length == 0){
        io.to(socket.id).emit("winThroughForfeit", "opponent did not pick any cards");
        io.to(rivalId).emit("forfeit", "did not pick any cards");
        demolishRoomOf(socket.id);
      } else { // token picks were completed
        gameHasBegun[roomCode] = true;
        if (socket.id > rivalId){ // this socket goes first
          io.to(socket.id).emit("yourTurn", doneTokenPick[roomCode], undefined); // syntax: 'yourTurn', (yourEnemysCards, yourEnemysVerOfYourCards)
          io.to(rivalId).emit("waitTurnAndPopulate", gameCardJsonObjs);
        } else {
          io.to(rivalId).emit("yourTurn", gameCardJsonObjs, undefined);
          io.to(socket.id).emit("waitTurnAndPopulate", doneTokenPick[roomCode]);
        }
      }
    } else {
      doneTokenPick[roomCode] = gameCardJsonObjs;
    }
  });

  socket.on("tellRival_yourTurn", (yourEnemysJsons, yourEnemysVerOfYourJsons) => {
    let rivalId = rivalFinder[socket.id];
    io.to(rivalId).emit("yourTurn", yourEnemysJsons, yourEnemysVerOfYourJsons);
  });

  socket.on("tellRival_ongoingProgress", (yourEnemysJsons, yourEnemysVerOfYourJsons) => {
    let rivalId = rivalFinder[socket.id];
    io.to(rivalId).emit("enemysProgress", yourEnemysJsons, yourEnemysVerOfYourJsons);
  });
  
  socket.on("tellRival_message", (msgType, p1, arg1, arg2) => {
    let rivalId = rivalFinder[socket.id];
    io.to(rivalId).emit("giveMessage", msgType, p1, arg1, arg2);
  });

  socket.on("gameEnded_withTie", (p1Name, p1cardNames, p2Name, p2cardNames) => {
    let rivalId = rivalFinder[socket.id];
    io.to(socket.id).emit("gameTie");
    io.to(rivalId).emit("gameTie");
    demolishRoomOf(socket.id);
    console.log("tie", p1Name, p1cardNames, p2Name, p2cardNames);
  });

  socket.on("gameEnded_withMyWin", (p1Name, p1cardNames, p2Name, p2cardNames) => {
    let rivalId = rivalFinder[socket.id];
    io.to(socket.id).emit("gameWin");
    io.to(rivalId).emit("gameLoss");
    demolishRoomOf(socket.id);
    console.log("win", p1Name, p1cardNames, p2Name, p2cardNames);
  });

  socket.on("gameEnded_withEnemyWin", (p1Name, p1cardNames, p2Name, p2cardNames) => {
    let rivalId = rivalFinder[socket.id];
    io.to(socket.id).emit("gameLoss");
    io.to(rivalId).emit("gameWin");
    demolishRoomOf(socket.id);
    console.log("loss", p1Name, p1cardNames, p2Name, p2cardNames);
  });
});

server.listen(PORT);
console.log("listening on", PORT);

// pug router setup
var path = require('path');
const router = express.Router();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

router.get("/", (req, res) => {
  res.render("lobby");
});

router.get('/game',(req,res) => {
  console.log("P",req.query);
  //res.render("game", { socketid: req.body.socketid, nickname: req.body.nickname, gamecode: req.body.gamecode }); // for POST (not redirect)
  res.render("game", {room: req.query.room, self: req.query.self, other:req.query.other});
});

router.get('/preview',(req,res) => {
  res.render("preview");
});

app.use('/', router);
