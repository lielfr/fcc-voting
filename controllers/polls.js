var express = require('express');
var co = require('co');
var csrf = require('csurf');
var utils = require('../utils');

var csrfProtection = csrf();
var router = express.Router();

router.get('/:token', csrfProtection, function(req, res) {
  co (function* () {
    var matchedPolls = yield req.mongo.polls.find({
      _id: req.params.token
    }).toArray();
    if (matchedPolls.length !== 1) {
      utils.gotoError(req, res,
        (matchedPolls.length === 0?'No poll was ':'Too many polls were ')
               + 'found.');
    } else {
      var poll = matchedPolls[0];
      var pollAuthor = yield req.mongo.profiles.find({
        uid: poll.author
      }).toArray();
      if (pollAuthor.length !== 1) {
        utils.gotoError(req, res, 'Unexpected error occured.');
        yield Promise.reject(new Error('Could not find user: '+poll.author));
      } else {
        var possibleAnswers = yield req.mongo.answers.distinct('answer', {
          pollID: poll._id
        });
        var navbarLinks = [
          {isActive: false, linkURL: '/', linkText: 'Home'},
          {isActive: true, linkText: 'Vote'}
        ];
        var loginText = 'Not logged in.';
        if (req.isAuthorized) {
          navbarLinks.push({
            isActive: false,
            linkURL: '/dashboard',
            linkText: 'Dashboard'
          });
          navbarLinks.push({
            isActive: false,
            linkURL: '/dashboard/logout',
            linkText: 'Sign Out'
          });
          loginText = 'Hello, '+req.userObj.displayName+'.';
        }
        var showDelete = req.isAuthorized && poll.author === req.session.uid;
        res.render('poll-view-vote', {
          poll: poll,
          author: pollAuthor[0],
          answers: possibleAnswers,
          loginText: loginText,
          navbarLinks: navbarLinks,
          showDelete: showDelete,
          csrfToken: req.csrfToken()
        });
      }
    }
  }).catch(utils.onError);
});

router.post('/:token', csrfProtection, function(req, res) {

  co(function* () {
    var currentAnswers = yield req.mongo.answers.distinct('answer', {
      pollID: req.params.token
    });
    if (currentAnswers.length === 0)
      utils.gotoError(req, res, 'No such poll.');
    else {
      var selectedAnswer;
      if (req.body['new-answer'] === '')
        selectedAnswer = req.body['selected-answer'];
      else
        selectedAnswer = req.body['new-answer'];
      var insertResult = yield req.mongo.answers.insertOne({
        pollID: req.params.token,
        answer: selectedAnswer,
        toCount: true
      });
      if (insertResult.insertedCount !== 1) {
        yield Promise.reject(new Error('Could not insert a new answer.'));
        utils.gotoError(req, res, 'Unexpected error occured.');
      } else {
        res.redirect('/polls/'+req.params.token+'/results');
        req.mongo.db.close();
        res.end();
      }
    }
  }).catch(utils.onError);
});

router.get('/:token/results', csrfProtection, function(req, res) {
  co(function* () {
    var matchedPolls = yield req.mongo.polls.find({
      _id: req.params.token
    }).toArray();
    if (matchedPolls.length !== 1) {
      utils.gotoError(req, res,
        (matchedPolls.length === 0?'No poll was ':'Too many polls were ')
               + 'found.');
    } else {
      var poll = matchedPolls[0];
      var pollAuthor = yield req.mongo.profiles.find({
        uid: poll.author
      }).toArray();
      if (pollAuthor.length !== 1) {
        utils.gotoError(req, res, 'Unexpected error occured.');
        yield Promise.reject(new Error('Could not find user: '+poll.author));
      } else {
        var navbarLinks = [
          {isActive: false, linkURL: '/', linkText: 'Home'},
          {isActive: true, linkText: 'Vote'}
        ];
        var loginText = 'Not logged in.';
        if (req.isAuthorized) {
          navbarLinks.push({
            isActive: false,
            linkURL: '/dashboard',
            linkText: 'Dashboard'
          });
          navbarLinks.push({
            isActive: false,
            linkURL: '/dashboard/logout',
            linkText: 'Sign Out'
          });
          loginText = 'Hello, '+req.userObj.displayName+'.';

        }
        var showDelete = req.isAuthorized && poll.author === req.session.uid;
        res.render('poll-view-results', {
          poll: poll,
          author: pollAuthor[0],
          loginText: loginText,
          navbarLinks: navbarLinks,
          showDelete: showDelete,
          csrfToken: req.csrfToken()
        });
      }
    }
  }).catch(utils.onError);
});

router.get('/:token/raw', function(req, res) {
  co(function* () {
    var currentAnswers = yield req.mongo.answers.distinct('answer', {
      pollID: req.params.token
    });
    if (currentAnswers.length === 0) {
      // This is supposed to be a clean representation, so I decided to leave it like this instead of using thecustom error page.
      req.mongo.db.close();
      res.writeHead(404);
      res.end('ERROR: No such poll.');
    } else {
      var resultsData = [];
      for (answer of currentAnswers) {
        var currentCount = yield req.mongo.answers.count({
          pollID: req.params.token,
          answer: answer,
          toCount: true
        });
        resultsData.push(currentCount);
      }
      req.mongo.db.close();
      var responseObj = {
        labels: currentAnswers,
        datasets: [{
          label: 'Poll results',
          data: resultsData,
          backgroundColor: [
            'rgba(217, 83, 79, 0.2)',
            'rgba(91, 192, 222, 0.2)',
            'rgba(92, 184, 92, 0.2)',
            'rgba(66, 139, 202, 0.2)'
          ]
        }]
      };
      res.writeHead(200, {'Content-Type': 'text/json'});
      res.end(JSON.stringify(responseObj));
    }
  }).catch(utils.onError);
});

router.post('/:token/delete', csrfProtection, function(req, res) {
  co(function* () {
    if (!req.isAuthorized)
      return utils.gotoError(req, res, 'Not logged in, sorry!');
    var selectedPoll = yield req.mongo.polls.find({
      _id: req.params.token,
      author: req.session.uid
    }).toArray();
    if (selectedPoll.length === 0)
      utils.gotoError(req, res, 'Could not delete the poll.');
    else if (selectedPoll.length !== 1) {
      // Should never happen, but it's here just in case.
      utils.gotoError(req, res, 'Unknown error occured.');
      yield Promise.reject(new Error('Found many polls with the same id!'));
    } else {
      var selectedPID = selectedPoll[0]._id;
      yield req.mongo.polls.deleteOne({_id: selectedPID});
      yield req.mongo.answers.deleteMany({pollID: selectedPID});
      req.mongo.db.close();
      res.redirect('/dashboard');
      res.end();
    }
  }).catch(utils.onError);
});

module.exports = router;
