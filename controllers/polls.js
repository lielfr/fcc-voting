var mongodb = require('mongodb').MongoClient;
var express = require('express');
var config = require('../config');
var auth_middleware = require('../middleware/auth');


var router = express.Router();

//router.use(auth_middleware);

router.get('/view/:token', function(req, res) {
  mongodb.connect(config.db.mongoURL, function(err, db) {
    if (err) return console.error(err);

    var polls = db.collection('polls');
    var profiles = db.collection('profiles');
    var answers = db.collection('answers');

    polls.find({pid: req.params.token}).toArray(function(err, pollDocs) {
      if (err) return console.error(err);

      if (pollDocs.length === 0)
        res.send('No polls with token '+req.params.token+'.');
      else if (pollDocs.length > 1)
        res.send('Too many polls with token '+req.params.token+'.');
      else {
        var selectedPoll = pollDocs[0];
        profiles.find({uid: selectedPoll.uid}).toArray(function(err, userDocs) {
          if (userDocs.length !== 1)
            res.send(userdocs.length === 0?'No':'Too many'+
                    ' users were found with id '+selectedPoll.uid+'.');
          else {
            var creator = userDocs[0];
            var possibleAnswers = answers.distinct('answer', {pid: selectedPoll.uid});

            res.render('poll-view', {
              poll: selectedPoll,
              author: creator,
              answers: possibleAnswers
            });
          }
        });
      }
    });
  });
});
