var mongodb = require('mongodb').MongoClient;
var express = require('express');
var co = require('co');
var config = require('../config');
var utils = require('../utils');

var router = express.Router();

function onError(err) {
  console.error(err.stack);
}

router.get('/', function(req, res) {
  if (!req.isAuthorized) {
    if (!req.user) {
      // TODO: Replace this with an error page.
      res.end('Not logged in, sorry!');
    } else {
      req.session.uid = req.user.id;
      co(function* () {
        var result = yield req.mongo.profiles.insertOne({
          uid: req.user.id,
          displayName: req.user.displayName,
          image: req.user.profile_image_url
        });

        if (result.insertedCount !== 1)
          yield Promise.reject(new Error('Could not insert the profile into mongo.'));

        req.mongo.db.close();
        res.redirect('/dashboard');
      }).catch(onError);
    }
  } else {
    co(function* () {
      var polls = yield req.mongo.polls.find({
        author: req.userObj.uid
      }).toArray();
      res.render('dashboard-home', {
        polls: polls,
        loginText: req.welcomeString,
        navbarLinks: [
          {isActive: false, linkURL: '/', linkText: 'Home'},
          {isActive: true, linkText: 'Dashboard'},
          {isActive: false, linkURL: '/dashboard/new', linkText: 'New poll'}
        ]
      });
      req.mongo.db.close();
      res.end();
    }).catch(onError);
  }
});

router.get('/logout', function(req, res) {
  if (!req.isAuthorized)
    res.end('Not logged in.');
  else {

    co(function* () {
      yield req.mongo.profiles.deleteOne({uid: req.session.uid});
      req.mongo.db.close();
      req.session.destroy();
      console.log('logging out.');
      res.redirect('/');
      res.end();
    }).catch(onError);
  }
});

router.get('/new', function(req, res) {
  if (!req.isAuthorized)
    res.end('Not logged in.');
  else {
    res.render('dashboard-new', {
      loginText: req.welcomeString,
      navbarLinks: [
        {isActive: false, linkURL: '/', linkText: 'Home'},
        {isActive: false, linkURL: '/dashboard', linkText: 'Dashboard'},
        {isActive: true, linkText: 'New Poll'}
      ]
    });
    res.end();
  }
});

router.post('/new', function(req, res) {
  if (!req.isAuthorized)
    res.end('Not Logged in.');
  else {
    co(function* () {
      var newToken = utils.randomAlphanums();
      yield req.mongo.polls.insertOne({
        _id: newToken,
        author: req.userObj.uid,
        dateCreated: Date.now(),
        title: req.body['poll_title']
      });
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
      yield req.mongo.answers.insertMany(questions);
      req.mongo.db.close();
      res.redirect('/dashboard');
    }).catch(onError);
  }
});

module.exports = router;
