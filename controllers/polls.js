var mongodb = require('mongodb').MongoClient;
var express = require('express');
var config = require('../config');
var auth_middleware = require('../middleware/auth');


var router = express.Router();

//router.use(auth_middleware);

router.get('/:token', function(req, res) {
  mongodb.connect(config.db.mongoURL, function(err, db) {
    if (err) return console.error(err);

    var polls = db.collection('polls');
    var profiles = db.collection('profiles');
    var answers = db.collection('answers');

    polls.find({_id: req.params.token}).toArray(function(err, pollDocs) {
      if (err) return console.error(err);

      if (pollDocs.length === 0) {
        db.close();
        res.end('No polls with token '+req.params.token+'.');
      }
      else if (pollDocs.length > 1) {
        db.close();
        res.end('Too many polls with token '+req.params.token+'.');
      } else {
        var selectedPoll = pollDocs[0];
        profiles.find({uid: selectedPoll.author}).toArray(function(err, userDocs) {
          if (userDocs.length !== 1) {
            db.close();
            res.end((userDocs.length === 0?'No':'Too many')+
                    ' users were found with id '+selectedPoll.author+'.');
           } else {
            var creator = userDocs[0];
            var possibleAnswers = answers.distinct('answer', {pollID: selectedPoll._id}, function(err, answers) {
              if (err) return console.error(err);
              res.render('poll-view-vote', {
                poll: selectedPoll,
                author: creator,
                answers: answers
              });
              db.close();
              res.end();
            });
          }
        });
      }
    });
  });
});

router.post('/:token', function(req, res) {
  mongodb.connect(config.db.mongoURL, function(err, db) {
    if (err) return console.error(err);
    var answers = db.collection('answers');
    var currentAnswers = answers.distinct('answer', {pollID: req.params.token}, function(err, docs) {
      if (err) return console.error(err);
      if (docs.length === 0) {
        db.close();
        response.end('ERROR: No such poll.');
      } else {
        var selectedAnswer;
        if (req.body['new-answer'] === '')
          selectedAnswer = req.body['selected-answer'];
        else
          selectedAnswer = req.body['new-answer'];
        answers.insertOne({
          pollID: req.params.token,
          answer: selectedAnswer,
          toCount: true
        }, function(err, result) {
          if (err) return console.error(err);
          if (result.insertedCount !== 1)
            return console.error('ERROR: Could not insert a nwe answer.');
          res.redirect('/polls/'+req.params.token+'/results');
          db.close();
          res.end();
        });
      }
    });
  });
});

module.exports = router;
