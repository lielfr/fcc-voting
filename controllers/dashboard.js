var mongodb = require('mongodb').MongoClient;
var express = require('express');
var config = require('../config');
var auth_middleware = require('../middleware/auth');


var router = express.Router();

router.use(auth_middleware);
router.get('/', function(req, res) {
  if (!req.isAuthorized) {
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
  } else {
    res.render('dashboard', {username: req.userObj.displayName});
    res.end();
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
        delete req.session.uid;
        res.end('Logged out.');
      });
    });
  }
});

module.exports = router;
