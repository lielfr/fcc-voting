var config = require('./config');
var utils = require('./utils');
var co = require('co');
var express = require('express');
var body_parser = require('body-parser');
var express_session = require('express-session');
var express_session_mongo = require('connect-mongo')(express_session);
var pug = require('pug');
var helmet = require('helmet');
var passport = require('passport');
var passport_twitter = require('passport-twitter').Strategy;
var mongodb = require('mongodb').MongoClient;
var controller_dashboard = require('./controllers/dashboard');
var controller_polls = require('./controllers/polls');
var middleware_mongo = require('./middleware/mongo');
var middleware_auth = require('./middleware/auth');

passport.use(new passport_twitter({
  consumerKey: config.auth.consumerKey,
  consumerSecret: config.auth.consumerSecret,
  callbackURL: config.auth.callbackURL
}, function(token, tokenSecret, profile, cb) {
  return cb(null, profile);
}));
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
var app = express();
app.set('view engine', 'pug');
app.set('views', './views');
app.use(helmet());
app.use(express_session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  store: new express_session_mongo({url: config.db.mongoURL})
}));
app.use(express.static(__dirname+'/static'));
app.use(body_parser.urlencoded({extended: false}));
app.use(passport.initialize());
app.use(passport.session());
app.use(middleware_mongo);
app.use(middleware_auth);
app.use('/dashboard', controller_dashboard);
app.use('/polls', controller_polls);

app.get('/', function(req, res) {
  co(function* () {
    var polls = yield req.mongo.polls.find({}).toArray();
    req.mongo.db.close();
    res.render('index', {
      loginText: req.welcomeString,
      navbarLinks: [],
      isAuthorized: req.isAuthorized,
      polls: polls
    });
  }).catch(utils.onError);
});
app.get('/auth', passport.authenticate('twitter'));
app.get('/auth/cb', passport.authenticate('twitter', {failureRedirect: '/'}),
function(req, res) {
  res.redirect('/dashboard');
});
app.get('/error', function(req, res) {
  var prevError;
  if (req.session.hasOwnProperty('errText')) {
    prevError = req.session.errText;
    delete req.session.errText;
  } else
    prevError = 'No error.';
  res.render('error', {errorText: prevError});

  res.end();
});
app.use(function(err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  utils.gotoError(req, res,
    'Disallowed behavior was detected, therefore nothing has changed.');
});
app.use(function(req, res, next) {
  utils.gotoError(req, res, 'Page does not exist.');
});

app.listen(process.env.PORT || 8080);
