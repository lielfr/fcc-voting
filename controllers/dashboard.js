var mongodb = require('mongodb').MongoClient;
var express = require('express');
var config = require('../config');
var router = express.Router();

router.get('/', function(req, res) {
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
      if (result.n !== 1)
        console.log('Something is weird with '+req.user.id+'.');
      db.close();
    });
  });
  res.end('Done: '+JSON.stringify(req.user));
});

module.exports = router;
