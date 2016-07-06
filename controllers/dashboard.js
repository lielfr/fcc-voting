var express = require('express');
var co = require('co');
var csrf = require('csurf');
var utils = require('../utils');

var csrfProtection = csrf();
var router = express.Router();

router.get('/', function(req, res) {
  if (!req.isAuthorized) {
    if (!req.user)
      utils.gotoError(req, res, 'Not logged in, sorry!');
    else {
      req.session.uid = req.user.id;
      co(function* () {
        var userRecords = yield req.mongo.profiles.find({
          uid: req.user.id
        }).toArray();
        if (userRecords.length === 0) {
          var result = yield req.mongo.profiles.insertOne({
            uid: req.user.id,
            displayName: req.user.displayName,
            image: req.user.profile_image_url
          });

          if (result.insertedCount !== 1)
            yield Promise.reject(new Error('Could not insert the profile into mongo.'));
        }
        req.mongo.db.close();
        res.redirect('/dashboard');
      }).catch(utils.onError);
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
    }).catch(utils.onError);
  }
});

router.get('/logout', function(req, res) {
  if (!req.isAuthorized)
    utils.gotoError(req, res, 'Not logged in.');
  else {

    co(function* () {
      req.mongo.db.close();
      req.session.destroy();
      res.redirect('/');
      res.end();
    }).catch(utils.onError);
  }
});

router.get('/new', csrfProtection, function(req, res) {
  if (!req.isAuthorized)
    utils.gotoError(req, res, 'Not logged in.');
  else {
    res.render('dashboard-new', {
      csrfToken: req.csrfToken(),
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

router.post('/new', csrfProtection, function(req, res) {
  if (!req.isAuthorized) {
    utils.gotoError(req, res, 'Not Logged in.');
  } else {
    co(function* () {
      var paramsLength = Object.keys(req.body).map(function(val, i, arr) {
        return val.length;
      });
      if (paramsLength.indexOf(0) > -1)
        utils.gotoError(req, res, 'One or more fields was empty.');
      else {
        var newToken = utils.randomAlphanums();
        yield req.mongo.polls.insertOne({
          _id: newToken,
          author: req.userObj.uid,
          dateCreated: Date.now(),
          title: req.body.poll_title
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
      }
    }).catch(utils.onError);
  }
});

module.exports = router;
