var express = require('express');
var app = express();
const server = require("http").Server(app); // create server
const io = require("socket.io")(server); // create instance of socketio

// lobby tracker, regions only, {region: {socketid: nickname}}
var regionUsers = {"olympia=====": {}, "corinth=====": {}, "athens=====": {}};
// room tracker, both regions and games, {socketid: room}
var roomBook = {};
// player tracker, games only
var roommateFinder = {}; // {room: [socketid, socketid]}
var rivalFinder = {}; // {socketid: socketid}
var doneTokenPick = new Set(); // {room} where room included if 1 person finished token pick

// lobby code processing
function rk(regionName){ return regionName + "====="; }
function nk(rkRegion){ return rkRegion.slice(0, -5); }
function isLobbyId(roomcode) { return (roomcode.slice(0, -5) == "====="); }

app.use(express.static("public")); // use "public" directory for static files

function kickOutFromLastRoom(socketId) {
  if (socketId in roomBook) { // remove from its room
    let thisRoomCode = roomBook[socketId];
    delete roomBook[socketId];
    if (isLobbyId(thisRoomCode)) { // if it's in a lobby room, remove from lobby and notify
      let nickname = regionUsers[thisRoomCode][socketId];
      delete regionUsers[thisRoomCode][socketId];
      io.to(thisRoomCode).emit("lobbyLeft", nickname, nk(thisRoomCode), regionUsers[thisRoomCode]);
    } else {
      console.error("unimplemented"); // notify game partner that left & forfeit game
      // clear rivalfinder #TODO
    }
  }
}

io.on("connection", socket => {
  /* ~~~~~ managing sockets of any type ~~~~~ */
  socket.on("disconnect", () => {
    kickOutFromLastRoom(socket.id); // #TODO if only one left in room, delete the room and clear any game dict memories e.g. doneTokenPick
  });

  /* ~~~~~ lobby socket operations ~~~~~ */
  socket.on("lobbyJoin", (nickname, region) => {
    kickOutFromLastRoom(socket.id);
    socket.join(rk(region));
    regionUsers[rk(region)][socket.id] = nickname;
    roomBook[socket.id] = rk(region);
    io.to(rk(region)).emit("lobbyJoined", nickname, region, regionUsers[rk(region)]);
  });

  socket.on("lobbyLeave", () => {
    kickOutFromLastRoom(socket.id);
  });

  socket.on("gameInvite", (inviterNickname, recipientId)=>{
    io.to(recipientId).emit("gameInvite", inviterNickname, socket.id);
  });
  
  socket.on("roomRequest", (room, inviterNickname, inviterId, recipientNickname)=>{
    kickOutFromLastRoom(socket.id);
    kickOutFromLastRoom(inviterId);
    // #TODO emit only one update for removing 2 lobbiers
    //io.to(rk(region)).emit("lobbyLeft2", inviterNickname, recipientNickname, region, regionUsers[rk(region)]);
    io.to(inviterId).emit("redirectToGame", inviterNickname, recipientNickname, room);
    io.to(socket.id).emit("redirectToGame", recipientNickname, inviterNickname, room);
  })

  /* ~~~~~ player socket operations ~~~~~ */
  socket.on("registerPlayer", (roomCode) => {
    socket.join(roomCode);
    roomBook[socket.id] = roomCode;
    if (roomCode in roommateFinder){
      roommateFinder[roomCode].push(socket.id);
      roommateFinder[roomCode].sort();
      rivalFinder[roommateFinder[roomCode][0]] = roommateFinder[roomCode][1];
      rivalFinder[roommateFinder[roomCode][1]] = roommateFinder[roomCode][0];

      io.to(roommateFinder[roomCode][0]).emit("tokenPickPhase", roommateFinder[roomCode][1]);
      io.to(roommateFinder[roomCode][1]).emit("tokenPickPhase", roommateFinder[roomCode][0]);
    } else {
      roommateFinder[roomCode] = [socket.id];
    }
  });

  socket.on("doneWithTokenPick", ()=>{
    if (doneTokenPick.has(roomBook[socket.id])){
      io.to(roommateFinder[roomCode][0]).emit("yourTurn");
      io.to(roommateFinder[roomCode][1]).emit("waitTurn");
    }
  });

  socket.on("voluntaryForfeitEvent", () => {
    kickOutFromLastRoom(socket.id);
    kickOutFromLastRoom(rivalFinder[socket.id]);
  });

  socket.on("tellRival_yourTurn", () => {
    let rivalId = rivalFinder[socket.id];
    io.to(rivalId).emit("yourTurn");
  });
});

server.listen(3000);
console.log("localhost:3000");

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

app.use('/', router);
