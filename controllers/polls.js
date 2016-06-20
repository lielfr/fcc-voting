var express = require('express');
var co = require('co');
var utils = require('../utils');


var router = express.Router();

router.get('/:token', function(req, res) {
  co (function* () {
    var matchedPolls = yield req.mongo.polls.find({
      _id: req.params.token
    }).toArray();
    if (matchedPolls.length !== 1) {
      req.mongo.db.close();
      res.end((matchedPolls.length === 0?'No poll was ':'Too many polls were ')
               + 'found.');
    } else {
      var poll = matchedPolls[0];
      var pollAuthor = yield req.mongo.profiles.find({
        uid: poll.author
      }).toArray();
      if (pollAuthor.length !== 1) {
        req.mongo.db.close();
        res.end('Unexpected error occured.');
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
        res.render('poll-view-vote', {
          poll: poll,
          author: pollAuthor[0],
          answers: possibleAnswers,
          loginText: loginText,
          navbarLinks: navbarLinks
        });
      }
    }
  }).catch(utils.onError);
});

router.post('/:token', function(req, res) {

  co(function* () {
    var currentAnswers = yield req.mongo.answers.distinct('answer', {
      pollID: req.params.token
    });
    if (currentAnswers.length === 0) {
      req.mongo.db.close();
      res.end('ERROR: No such poll.');
    } else {
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
        req.mongo.db.close();
        res.end('Unexpected error occured.')
      } else {
        res.redirect('/polls/'+req.params.token+'/results');
        req.mongo.db.close();
        res.end();
      }
    }
  }).catch(utils.onError);
});

module.exports = router;
