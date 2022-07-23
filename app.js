var express = require('express');
var app = express();
const server = require("http").Server(app); // create server
const io = require("socket.io")(server); // create instance of socketio
const PORT = process.env.PORT || 3000;

const BOT_SOCKET_ID = 5555555;

// db connection for leaderboard tracking
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
var mongoDB = process.env.MONGODB_URI;
var MONGO_CONNECTED = false;
console.log("connecting to mongodb...");
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function callback () {
  MONGO_CONNECTED = true;
  console.log("mongodb connected");
});

// room tracker, BOTH REGIONS AND GAMES {socketid: room}
var roomBook = {};

// lobby tracker, REGIONS ONLY {region: {socketid: nickname}}
var ALL_REGION_NAMES = ["olympia", "corinth", "athens", "sparta"];
var regionUsers = {"olympia=====": {}, "corinth=====": {}, "athens=====": {}, "sparta=====": {}};
var lobbyCookieBook = {}; // {socketid: [score, guild]}

// player tracker, GAMES ONLY
var rivalFinder = {}; // {socketid: socketid}
var roommateFinder = {}; // {room: [socketid, socketid]}
var doneTokenPick = {}; // {room: gameCardJsonObjs} where objs array is included if 1 person finished token pick
var gameHasBegun = {}; // {room: bool} where true if token pick is done
var cookieMap = {}; // {socketid: username}

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
    // console.log("socket not found in room book", socketId); // normal behavior for the main (non-lobby non-game) page
  } else {
    let thisRoomCode = roomBook[socketId]; // remove from roomBook
    delete roomBook[socketId];

    if (isLobbyId(thisRoomCode)) { // if it's in a lobby room
      let nickname = regionUsers[thisRoomCode][socketId];
      delete regionUsers[thisRoomCode][socketId];
      io.to(thisRoomCode).emit("lobbyLeft", socketId, nickname, nk(thisRoomCode), regionUsers[thisRoomCode], lobbyCookieBook);

    } else { // if it's in a game room
      delete rivalFinder[socketId];
      //delete cookieMap[socketId];
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
    if (socket.id in roomBook) { // in game or lobby
      let thisRoomCode = roomBook[socket.id];
      if (isLobbyId(roomBook[socket.id])) {
        kickOutSocketFromLastRoom(socket.id); // in lobby
      } else { // in game or main page
        if (roommateFinder[thisRoomCode] != undefined && roommateFinder[thisRoomCode].length > 0) { // opponent is waiting!!
          if (rivalFinder[socket.id] == BOT_SOCKET_ID){
            demolishRoomOf(socket.id); // #TODO allow returning to bot games: set a timeout to kill the bot after the user doesn't return
          } else {
            io.to(rivalFinder[socket.id]).emit("opponentDisconnectWarning"); // warn the opponent
            kickOutSocketFromLastRoom(socket.id); // remove the old socket
          }
        } else { // no opponent is waiting
          kickOutSocketFromLastRoom(socket.id); // in game room
          if (roommateFinder[thisRoomCode].length == 0){
            removeGameRoom(thisRoomCode); // game room empty
          }  
        }        
      }
    } else {
      //console.log("socket left without being assigned to a room", socket.id); // normal behavior for the main (non-lobby non-game) page
    }
  });

  socket.on("commandDisconnectGame", () => {
    demolishRoomOf(socket.id);
  });

  /* ~~~~~ lobby socket operations ~~~~~ */
  socket.on("lobbyJoin", (nickname, region, cookieName, authkey) => {
    if (!MONGO_CONNECTED) { return; }
    db.collection('login').find({username: nickname}).toArray().then((existingLoginEntry) => {
      // nickname is reserved
      if (existingLoginEntry.length > 0 && cookieName != nickname) { io.to(socket.id).emit("nicknameFailure"); return; }

      // if logged in, update cookie book
      if (cookieName == nickname) {
        if (existingLoginEntry[0].password != authkey) { // both are salted
          io.to(socket.id).emit("accountMessage", "session expired, please log out and refresh"); return;
        }
        lobbyCookieBook[socket.id] = [existingLoginEntry[0].score, existingLoginEntry[0].guild];
      }

      // if login is not found, yet cookie name provided, command user to remove cookie
      /*if (existingLoginEntry.length == 0 && (cookieName == "" || cookieName == undefined)) {
        io.to(socket.id).emit("commandCookieLogout");
        return;
      }*/  // #TODO debug

      // otherwise, okay
      kickOutSocketFromLastRoom(socket.id);
      socket.join(rk(region));
      regionUsers[rk(region)][socket.id] = nickname;
      roomBook[socket.id] = rk(region);
      io.to(rk(region)).emit("lobbyJoined", nickname, region, regionUsers[rk(region)], lobbyCookieBook);
    });
  });

  socket.on("lobbyLeave", () => {
    if (lobbyCookieBook[socket.id] != undefined) {
      delete lobbyCookieBook[socket.id];
    }
    kickOutSocketFromLastRoom(socket.id);
  });

  socket.on("gameInvite", (inviterNickname, recipientId)=>{
    if (recipientId == BOT_SOCKET_ID) {
      const genRoomCode = Math.random().toString(36).slice(2);
      makeRoomWith(genRoomCode, inviterNickname, socket.id, "bot", BOT_SOCKET_ID);
    } else {
      io.to(recipientId).emit("gameInvite", inviterNickname, socket.id);
    }
  });
  
  socket.on("roomRequest", (room, inviterNickname, inviterId, recipientNickname)=>{
    makeRoomWith(room, inviterNickname, inviterId, recipientNickname, socket.id);
  });

  function makeRoomWith(room, inviterNickname, inviterId, recipientNickname, recipientId) {
    console.log("starting a game for", inviterNickname, "and", recipientNickname);
    let lobbyCode = nk(roomBook[socket.id]);
    kickOutSocketFromLastRoom(socket.id);
    kickOutSocketFromLastRoom(inviterId);
    // #TODO emit only one update for removing 2 lobbiers
    io.to(inviterId).emit("redirectToGame", inviterNickname, recipientNickname, room, lobbyCode);
    if (recipientId != BOT_SOCKET_ID) {
      io.to(recipientId).emit("redirectToGame", recipientNickname, inviterNickname, room, lobbyCode);
    }
  }

  socket.on("denyChallengeRequest", (ownNickname, enemyId)=>{
    io.to(enemyId).emit("gameRequestDenied", ownNickname);
  });

  /* ~~~~~ player socket operations ~~~~~ */
  socket.on("registerPlayer", (roomCode, cookieName, opponentName) => {
    cookieMap[socket.id] = cookieName;

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
      if (opponentName == "bot"){
        roommateFinder[roomCode] = [BOT_SOCKET_ID];
      }
      if (roomCode in roommateFinder){
        roommateFinder[roomCode].push(socket.id);
        rivalFinder[roommateFinder[roomCode][0]] = roommateFinder[roomCode][1];
        rivalFinder[roommateFinder[roomCode][1]] = roommateFinder[roomCode][0];

        io.to(roommateFinder[roomCode][0]).emit("tokenPickPhase", roommateFinder[roomCode][1]);
        io.to(roommateFinder[roomCode][1]).emit("tokenPickPhase", roommateFinder[roomCode][0]);
      } else {
        roommateFinder[roomCode] = [socket.id];
      }
    }
  });

  socket.on("doneWithTokenPick", (gameCardJsonObjs, botCardJsonObjs)=>{
    let roomCode = roomBook[socket.id];
    let rivalId = rivalFinder[socket.id];
    if (botCardJsonObjs != undefined){
      doneTokenPick[roomCode] = botCardJsonObjs;
    }
    if (roomCode in doneTokenPick){ // opponent is also done
      // check that both have chosen >= 1 token
      if (gameCardJsonObjs.length == 0){
        io.to(socket.id).emit("forfeit", "did not pick any cards");
        io.to(rivalId).emit("winThroughForfeit", "opponent did not pick any cards");
        demolishRoomOf(socket.id);
      } else if (doneTokenPick[roomCode].length == 0){
        io.to(socket.id).emit("winThroughForfeit", "opponent did not pick any cards");
        io.to(rivalId).emit("forfeit", "did not pick any cards");
        demolishRoomOf(socket.id);
      } else { // token picks were completed
        gameHasBegun[roomCode] = true;

        if (botCardJsonObjs == undefined) { // pvp
          if (socket.id > rivalId){ // this socket goes first
            io.to(socket.id).emit("yourTurn", doneTokenPick[roomCode], undefined); // syntax: 'yourTurn', (yourEnemysCards, yourEnemysVerOfYourCards)
            io.to(rivalId).emit("waitTurnAndPopulate", gameCardJsonObjs);
          } else {
            io.to(rivalId).emit("yourTurn", gameCardJsonObjs, undefined);
            io.to(socket.id).emit("waitTurnAndPopulate", doneTokenPick[roomCode]);
          }
        } else { // bot game
          if (Math.floor(Math.random() * 2) == 0) { // this socket goes first
            io.to(socket.id).emit("yourTurn", doneTokenPick[roomCode], undefined);
          } else {
            io.to(socket.id).emit("playBotTurn", doneTokenPick[roomCode]);
          }
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

  socket.on("tellRival_askForTruce", () => {
    let rivalId = rivalFinder[socket.id];
    io.to(rivalId).emit("truceRequest");
  });

  socket.on("tellRival_rejectTruce", () => {
    let rivalId = rivalFinder[socket.id];
    io.to(rivalId).emit("truceFailed");
  });

  socket.on("updateUserStats", (regionName, winType, cookieName, opponentCookieName, forceOpponentLossIncrease) => {
    let IS_BOT_GAME = (cookieName == "bot" || opponentCookieName == "bot");

    // update user stats
    if (cookieMap[socket.id] != ""){ // user logged in
      db.collection('login').find({username: cookieName}).toArray().then((existingLoginEntry) => {
        if (existingLoginEntry.length == 0) { console.log("db0","updateUserStats1",cookieName); return; }

        // increment tie/win/loss counts
        if (winType == "tie") {
          let newTrackObj = existingLoginEntry[0].ties;
          newTrackObj[regionName] += 1;
          db.collection('login').updateOne({username: cookieName}, {$set:{ties:newTrackObj}});
        } else if (winType == "win") {
          let newTrackObj = existingLoginEntry[0].wins;
          newTrackObj[regionName] += 1;
          db.collection('login').updateOne({username: cookieName}, {$set:{wins:newTrackObj}});
        } else if (winType == "loss") {
          let newTrackObj = existingLoginEntry[0].losses;
          newTrackObj[regionName] += 1;
          db.collection('login').updateOne({username: cookieName}, {$set:{losses:newTrackObj}});
        }

        // the winner adjusts the user scores
        if (!(opponentCookieName == "" || opponentCookieName == undefined)) { // rival also logged in
          db.collection('login').find({username: opponentCookieName}).toArray().then((rivalEntry) => {
            if (rivalEntry.length == 0) { console.log("db0","updateUserStats2",opponentCookieName); return; }

            if (IS_BOT_GAME) {
              if (winType == "win" && existingLoginEntry[0].score < 20.00) {
                db.collection('login').updateOne({username: cookieName}, {$inc:{score:1.00}});
              } else if (winType == "tie" && existingLoginEntry[0].score < 20.00) {
                db.collection('login').updateOne({username: cookieName}, {$inc:{score:0.25}});
              }
            } else {
              let myScorePercent = (0.1 * (100*existingLoginEntry[0].score))/100.0;
              let theirScorePercent = ((0.1 * (100*rivalEntry[0].score))/100.0) + 1.00;
              if (theirScorePercent > 5.00) { theirScorePercent = 5.00; }
              // absorb 10% of opponent's score
              if (winType == "win") {
                db.collection('login').updateOne({username: cookieName}, {$inc:{score:theirScorePercent}});
                db.collection('login').updateOne({username: opponentCookieName}, {$inc:{score:-myScorePercent}});
              } else if (winType == "tie") {
                db.collection('login').updateOne({username: cookieName}, {$inc:{score:0.25}}); // total = 0.50 since both players run
                db.collection('login').updateOne({username: opponentCookieName}, {$inc:{score:0.25}});
              }
  
              if (forceOpponentLossIncrease) { // used if opponent disconnects: P1 helps update the losses
                let enemyTrackObj = rivalEntry[0].losses;
                enemyTrackObj[regionName] += 1;
                db.collection('login').updateOne({username: opponentCookieName}, {$set:{losses:enemyTrackObj}});
              }
            }
          });
        }
      });
    }
  });

  socket.on("gameEnded_withTie", (regionName, p1Name, p1cardNames, p2Name, p2cardNames) => {
    // update hero stats
    addWinsToRegionHeroboard(regionName, p1cardNames);
    addWinsToRegionHeroboard(regionName, p2cardNames);

    // log game results
    let thisDate = new Date();
    db.collection('gamestats').insertOne({isTie:true, time:thisDate, region:regionName, winName:p1Name, winTeam:p1cardNames, loseName:p2Name, loseTeam:p2cardNames});

    let rivalId = rivalFinder[socket.id];
    io.to(socket.id).emit("gameTie", cookieMap[rivalId], cookieMap[socket.id]);
    io.to(rivalId).emit("gameTie", cookieMap[socket.id], cookieMap[rivalId]);
    demolishRoomOf(socket.id);
  });

  socket.on("gameEnded_withMyWin", (regionName, p1Name, p1cardNames, p2Name, p2cardNames, wasSurrender) => {
    // update hero stats
    addWinsToRegionHeroboard(regionName, p1cardNames);
    addLossesToRegionHeroboard(regionName, p2cardNames);

    // log game results
    let thisDate = new Date();
    db.collection('gamestats').insertOne({isTie:false, time:thisDate, region:regionName, winName:p1Name, winTeam:p1cardNames, loseName:p2Name, loseTeam:p2cardNames});
    
    let rivalId = rivalFinder[socket.id];
    io.to(socket.id).emit("gameWin", wasSurrender, cookieMap[rivalId]);
    io.to(rivalId).emit("gameLoss", wasSurrender, cookieMap[socket.id]);
    demolishRoomOf(socket.id);
  });

  socket.on("gameEnded_withEnemyWin", (regionName, p1Name, p1cardNames, p2Name, p2cardNames, wasSurrender) => {
    // update hero stats
    addWinsToRegionHeroboard(regionName, p2cardNames);
    addLossesToRegionHeroboard(regionName, p1cardNames);

    // log game results
    let thisDate = new Date();
    db.collection('gamestats').insertOne({isTie:false, time:thisDate, region:regionName, winName:p2Name, winTeam:p2cardNames, loseName:p1Name, loseTeam:p1cardNames});
    let rivalId = rivalFinder[socket.id];
    io.to(socket.id).emit("gameLoss", wasSurrender, cookieMap[rivalId]);
    io.to(rivalId).emit("gameWin", wasSurrender, cookieMap[socket.id]);
    demolishRoomOf(socket.id);
  });

  socket.on("account_creation_request", (inviteCode, username, password, email) => {
    db.collection('invitationcodes').find({code: inviteCode}).toArray().then((existingInviteCodeEntry) => {
      if (existingInviteCodeEntry.length != 1) { io.to(socket.id).emit("accountMessage", "invalid invitation code"); return; }
      if (existingInviteCodeEntry[0].uses == 0) { io.to(socket.id).emit("accountMessage", "this invitation code has already been used"); return; }
  
      db.collection('login').find({username: username}).toArray().then((existingLoginEntry) => {
        if (existingLoginEntry.length > 0) { io.to(socket.id).emit("accountMessage", "this username already exists"); return; }
      
        // all ok
        bcrypt.genSalt(10).then((salt) => {
          bcrypt.hash(password, salt).then((saltedPassword) => {
            db.collection('invitationcodes').updateOne({code: inviteCode}, {$inc:{uses:-1}});
            const newInviteCode = (Math.random() + 1).toString(36).substring(4);
            db.collection('invitationcodes').insertOne({code:newInviteCode, uses:5});
            let newTime = new Date();
            db.collection('login').insertOne({username:username, password:saltedPassword, email:email, creationTime:newTime, usedCode:inviteCode, newCode:newInviteCode, wins:{olympia:0,corinth:0,athens:0,sparta:0}, ties:{olympia:0,corinth:0,athens:0,sparta:0}, losses:{olympia:0,corinth:0,athens:0,sparta:0}, score:10.0, guild:""});
            io.to(socket.id).emit("newAccount", newInviteCode);
          });
        });
      });
    })
  });
  
  socket.on("passwordChangeRequest", (username, authkey, email, newPassword) => {
    db.collection('login').find({username: username}).toArray().then((loginEntry) => {
      if (loginEntry.length != 1) { io.to(socket.id).emit("accountMessage", "account not found"); return; }
      if (loginEntry[0].password != authkey) { // both are salted
        io.to(socket.id).emit("accountMessage", "session expired, please log out and refresh"); return;
      }
      if (loginEntry[0].email != email) { io.to(socket.id).emit("accountMessage", "password not changed: email does not match email on record"); return; }
    
      // all ok
      bcrypt.genSalt(10).then((salt) => {
        bcrypt.hash(newPassword, salt).then((saltedPassword) => {
          db.collection('login').updateOne({username:username}, {$set:{password:saltedPassword}});
          io.to(socket.id).emit("accountMessage", "password has been changed successfully");
        });
      });
    });
  });

  socket.on("resetPasswordRequest", (username, newPassword) => {
    db.collection('login').find({username: username}).toArray().then((loginEntry) => {
      if (loginEntry.length == 0) { console.log("db0","resetPasswordRequest",username); return; }
      if (loginEntry[0].password.substring(0,5) != "temp:") { return; }
      
      // all ok
      bcrypt.genSalt(10).then((salt) => {
        bcrypt.hash(newPassword, salt).then((saltedPassword) => {
          db.collection('login').updateOne({username:username}, {$set:{password:saltedPassword}});
          io.to(socket.id).emit("accountMessage", "password has been changed successfully");
        });
      });
    });
  });

  socket.on("guildChangeRequest", (username, authkey, guildName) => {
    if (guildName == "automated") { io.to(socket.id).emit("accountMessage", "this group name is reserved for bots"); return; }
    if (guildName == "admin") { io.to(socket.id).emit("accountMessage", "this group name has been restricted"); return; }

    db.collection('login').find({username: username}).toArray().then((existingLoginEntry) => {
      if (existingLoginEntry.length != 1) { io.to(socket.id).emit("accountMessage", "account not found"); return; }

      if (existingLoginEntry[0].password != authkey){ // both are salted
        io.to(socket.id).emit("accountMessage", "session expired, please log out and refresh"); return;
      }

      if (lobbyCookieBook[socket.id] != undefined){
        lobbyCookieBook[socket.id] = [ lobbyCookieBook[socket.id][0], guildName ];
      }
  
      db.collection('login').updateOne({username:username}, {$set:{guild:guildName}});
      io.to(socket.id).emit("accountMessage", "guild has been changed successfully, please refresh");
    });
  });
  
  socket.on("login_request", (username, password) => {
    if (username == "bot") { io.to(socket.id).emit("accountMessage", "you cannot play as a bot"); return; }

    db.collection('login').find({username: username}).toArray().then((existingLoginEntry) => {
      if (existingLoginEntry.length != 1) { io.to(socket.id).emit("accountMessage", "invalid username/password combination"); return; } // no account exists

      let storedPasswordSalted = existingLoginEntry[0].password;
      if (storedPasswordSalted.substring(0,5) == "temp:") { // was manually changed in the database
        if ("temp:"+password == storedPasswordString) { // was manually changed in the database
          io.to(socket.id).emit("canResetPassword", username);
        } else {
          io.to(socket.id).emit("accountMessage", "incorrect temporary password"); return;
        }
      } else {
        bcrypt.compare(password, storedPasswordSalted).then((validPassword) => {
          if (!validPassword) { io.to(socket.id).emit("accountMessage", "invalid username/password combination"); return; }
          // otherwise, all good
          io.to(socket.id).emit("loginSuccess", username, storedPasswordSalted);
        });
      }
    });
  });

  socket.on("requestUserDataBox", (username) => {
    sendUserDataBox(username);
  });

  function sendUserDataBox(username) {
    if (!MONGO_CONNECTED) { return; }
    // calculate user ranking
    db.collection('login').aggregate([{
      $setWindowFields: { sortBy: { score: -1 }, output: { userRank: {$rank: {}} } }
    }]).toArray().then((userData) => {
      let relevantEntry = userData.find(element => element["username"] == username);
      let retrievedCode = relevantEntry.newCode;
      db.collection('invitationcodes').find({code: retrievedCode}).toArray().then((existingInviteCodeEntry) => {
        if (existingInviteCodeEntry.length == 0) { console.log("db0","sendUserDataBox",retrievedCode); return; }
        let retrievedUses = existingInviteCodeEntry[0].uses;

        if (relevantEntry.guild != ""){
          db.collection('login').find({guild: relevantEntry.guild}).toArray().then((rawGuildMemberList) => {
            let guildMemberList = rawGuildMemberList.map(({ username, score, wins, losses }) => [username, score, wins, losses]);
            io.to(socket.id).emit("getUserDataBox", relevantEntry.username, retrievedCode, retrievedUses, relevantEntry.wins, relevantEntry.losses, relevantEntry.score, relevantEntry.userRank, relevantEntry.guild, guildMemberList);
          });
        } else {
          io.to(socket.id).emit("getUserDataBox", relevantEntry.username, retrievedCode, retrievedUses, relevantEntry.wins, relevantEntry.losses, relevantEntry.score, relevantEntry.userRank, relevantEntry.guild, []);
        }
      });
    });
  }

  socket.on("requestAllHeroboards", () => {
    if (!MONGO_CONNECTED) {
      io.to(socket.id).emit("heroboardUpdate", undefined);
    } else {
      db.collection('heroboard').aggregate([{$group: { _id: "$heroName", total: { $sum: "$heroWins" }}}]).sort({total:-1}).limit(5).toArray().then((res) => {
        io.to(socket.id).emit("heroboardUpdate", "TOTAL", res);
      });

      ALL_REGION_NAMES.forEach((regionName) => {
        db.collection('heroboard').find({region:regionName}).sort({heroWins:-1}).limit(5).toArray().then((res) => {
          io.to(socket.id).emit("heroboardUpdate", regionName, res);
        });
      });
    }
  });

  socket.on("requestGuildAndPlayerStats", () => {
    if (!MONGO_CONNECTED) {
      return; // heroboard will already send an error message
    } else {
      // guild board update
      db.collection('login').aggregate([
        {$group:      { _id: "$guild", 
                        guildScore: { $sum: "$score" }
                      }}
      ]).sort({guildScore:-1}).limit(6).toArray().then((res) => { // get 6 since one may be group where guild=""
        io.to(socket.id).emit("guildboardUpdate", res);
      });

      // player board update
      db.collection('login').find().sort({score:-1}).limit(5).toArray().then((userData) => {
        io.to(socket.id).emit("playerboardUpdate", userData);
      });
    }
  });
});

function addWinsToRegionHeroboard(regionName, cardNames) {
  cardNames.forEach((cardName) => {
    db.collection('heroboard').updateOne({region:regionName, heroName:cardName}, {$inc:{heroWins:1}});
  });
}

function addLossesToRegionHeroboard(regionName, cardNames) {
  cardNames.forEach((cardName) => {
    db.collection('heroboard').updateOne({region:regionName, heroName:cardName}, {$inc:{heroLosses:1}});
  });
}

server.listen(PORT);
console.log("listening on", PORT);

// pug router setup
var path = require('path');
const { receiveMessageOnPort } = require('worker_threads');
const router = express.Router();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

router.get("/", (req, res) => {
  res.render("entry");
});

router.get('/game',(req,res) => {
  //res.render("game", { socketid: req.body.socketid, nickname: req.body.nickname, gamecode: req.body.gamecode }); // for POST (not redirect)
  res.render("game", {room: req.query.room, self: req.query.self, other:req.query.other});
});

router.get('/index',(req,res) => {
  res.render("preview");
});

router.get('/help',(req,res) => {
  res.render("help");
});

router.get('/terms',(req,res) => {
  res.render("terms");
});

router.get('/victory',(req,res) => {
  res.render("victory", {opponent: req.query.opponent});
});

router.get('/defeat',(req,res) => {
  res.render("defeat", {opponent: req.query.opponent});
});

router.get('/tie',(req,res) => {
  res.render("tie", {opponent: req.query.opponent});
});

router.get('/lobby',(req,res) => {
  res.render("lobby",  {join_region: req.query.join_region});
});

app.use('/', router);
