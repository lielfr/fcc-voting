var mongodb = require('mongodb').MongoClient;
var express = require('express');
var config = require('../config');
var utils = require('../utils');
var auth_middleware = require('../middleware/auth');


var router = express.Router();

router.use(auth_middleware);
router.get('/', function(req, res) {
  if (!req.isAuthorized) {
    if (!req.user) {
      // TODO: Replace this with an error page.
      res.end('Not logged in, sorry!');
    } else {
      req.session.uid = req.user.id;
      mongodb.connect(config.db.mongoURL, function(err, db) {
        if (err) return console.error(err);
        var profiles = db.collection('profiles');
        profiles.insertOne({
          uid: req.user.id,
          displayName: req.user.displayName,
          image: req.user.profile_image_url
        }, function(err, result) {
          if (err) return console.error(err);
          if (result.insertedCount !== 1)
            console.log('Something is weird with '+req.user.id+'.');
          db.close();
          res.redirect('/dashboard');
        });
      });
    }
  } else {
    mongodb.connect(config.db.mongoURL, function(err, db) {
      if (err) return console.error(err);
      var polls = db.collection('polls');
      polls.find({author: req.userObj.uid}).toArray(function(err, docs) {
        if (err) return console.error(err);
        res.render('dashboard-home', {
          username: req.userObj.displayName,
          polls: docs
        });
        db.close();
        res.end();
      });
    });

  }
});

router.get('/logout', function(req, res) {
  if (!req.isAuthorized)
    res.end('Not logged in.');
  else {
    mongodb.connect(config.db.mongoURL, function(err, db) {
      if (err) return console.error(err);
      var profiles = db.collection('profiles');
      profiles.deleteOne({uid: req.session.uid}, function(err, result) {
        if (err) return console.error(err);
        req.session.destroy();
        res.end('Logged out.');
      });
    });
  }
});

router.get('/new', function(req, res) {
  if (!req.isAuthorized)
    res.end('Not logged in.');
  else {
    res.render('dashboard-new', {username: req.userObj.displayName});
    res.end();
  }
});

router.post('/new', function(req, res) {
  if (!req.isAuthorized)
    res.end('Not Logged in.');
  else {
    mongodb.connect(config.db.mongoURL, function(err, db) {
      if (err) return console.error(err);
      var polls = db.collection('polls');
      var answers = db.collection('answers');
      var newToken = utils.randomAlphanums();


      polls.insertOne({
        _id: newToken,
        author: req.userObj.uid,
        dateCreated: Date.now(),
        title: req.body['poll_title']
      }, function(err, doc) {
        if (err) return console.error(err);
        var questions = Object.keys(req.body).filter(function(elem, i, arr) {
          var splitted = elem.split('_');
          return (splitted.length === 3 && splitted[0] === 'poll' && splitted[1] === 'answer');
        }).map(function(currVal, i, arr) {
          return {
            pollID: newToken,
            answer: req.body[currVal],
            toCount: false
          };
        });
        answers.insertMany(questions, function(err, doc2) {
          if (err) return console.error(err);
          db.close();
          res.redirect('/dashboard'); // TODO: Maybe change this to the poll view?
        });
      });
    });
  }
});

module.exports = router;
