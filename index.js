var config = require('./config');
var express = require('express');
var body_parser = require('body-parser');
var express_session = require('express-session');
var express_session_mongo = require('connect-mongo')(express_session);
var pug = require('pug');
var passport = require('passport');
var passport_twitter = require('passport-twitter').Strategy;
var mongodb = require('mongodb').MongoClient;

passport.use(new passport_twitter({
  consumerKey: config.auth.consumerKey,
  consumerSecret: config.auth.consumerSecret,
  callbackURL: config.auth.callbackURL
}, function(token, tokenSecret, profile, cb) {
  // TODO: Add the user account to the database.
  return cb(null, profile);
}));
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
var app = express();
app.set('x-powered-by', false);
app.set('view engine', 'pug');
app.set('views', './views');
app.use(express_session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  store: new express_session_mongo({url: config.db.mongoURL})
}));
app.use(express.static(__dirname+'/public'));
app.use(body_parser.urlencoded({extended: false}));
app.use(passport.initialize());
app.use(passport.session());

app.listen(process.env.PORT | 8080);
