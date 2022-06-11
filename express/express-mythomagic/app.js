var express = require('express');
var app = express();
const server = require("http").Server(app); // create server
const io = require("socket.io")(server); // create instance of socketio

// {region: {socketid: nickname}}
const regionUsers = {"olympia=====": {}, "corinth=====": {}, "athens=====": {}};
function rk(regionName){
  return regionName + "=====";
}
function nk(rkRegion){
  return rkRegion.slice(0, -5);
}

app.use(express.static("public")); // use "public" directory for static files

io.on("connection", socket => {
  socket.on("lobbyJoin", (nickname, region) => {
    regionUsers[rk(region)][socket.id] = nickname;
    socket.join(rk(region));
    io.to(rk(region)).emit("lobbyJoined", nickname, region, regionUsers[rk(region)]);
  });
  socket.on("lobbyLeave", (nickname, region) => {
    socket.leave(rk(region));
    delete regionUsers[rk(region)][socket.id];
    io.to(rk(region)).emit("lobbyLeft", nickname, region, regionUsers[rk(region)]);
  });

  socket.on("gameInvite", (inviterNickname, inviterId, recipientNickname, recipientId)=>{
    io.to(recipientId).emit("gameInvite", inviterNickname, inviterId);
  });
  
  socket.on("roomRequest", (region, room, inviterNickname, inviterId, recipientNickname, recipientId)=>{
    delete regionUsers[rk(region)][inviterId];
    delete regionUsers[rk(region)][socket.id];
    io.to(rk(region)).emit("lobbyLeft2", inviterNickname, recipientNickname, region, regionUsers[rk(region)]);
    io.to(inviterId).emit("redirectToGame", inviterNickname, recipientNickname, room);
    io.to(socket.id).emit("redirectToGame", recipientNickname, inviterNickname, room);
  })

  socket.on("registerPlayer", (roomCode, selfName) => {
    socket.join(roomCode);
    io.to(roomCode).emit("gameSetupComplete");
  });

  socket.on("joined", (nickname, region) => { // when server receives the "joined" message
  });
  socket.on("disconnect", () => { // when someone closes the tab
    Object.keys(regionUsers).forEach(rkregion => {
      if (regionUsers[rkregion][socket.id] != undefined) {
        const nickname = regionUsers[rkregion][socket.id];
        delete regionUsers[rkregion][socket.id];
        io.to(rkregion).emit("lobbyLeft", nickname, nk(rkregion), regionUsers[rkregion]);
      }
    })
  });
});

server.listen(3000);
console.log("localhost:3000");

// post parsing setup
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

/*
router.post("/game/", (req, res) => {
  res.render("game", { title: "Hey", message: "Hello there!" });
});
*/
app.use('/', router);


/*
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/////////////////////////////////////////////////////
var cookieParser = require('cookie-parser');
var logger = require('morgan');
/////////////////////////////////////////////////////////////////
*/

// mongoose stuff
/*
var mongoose = require('mongoose');//Import the mongoose module

// mongoose set up and debug
var login = require('../express-mythomagic/login');
var mongoDB = login.mongoDB;
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection; //Get the default connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
var BaseCardModel = require('../express-mythomagic/models/basecard')
var samplecardX = new BaseCardModel({ name: 'aaaaaa', base_atk: 500 });
console.log(samplecardX.name);
samplecardX.name="New cool name";
samplecardX.save(function (err) { if (err) return console.error(err); });
*/

/////////////////////////////////////////////////////////////////

/*
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
*/