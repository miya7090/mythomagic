var createError = require('http-errors');

var express = require('express');
var app = express();
var path = require('path');
const router = express.Router();

app.use(express.static('public'));

// pug router setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

router.get("/", (req, res) => {
  res.render("lobby");
});

router.get("/GAMECODEHERE", (req, res) => {
  res.render("game", { title: "Hey", message: "Hello there!" });
});

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


/////////////////////////////////////////////////////////////////

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
