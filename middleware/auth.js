var config = require('../config');
var mongodb = require('mongodb').MongoClient;

function authMiddleware(req, res, next) {
  if (!req.session || !req.session.uid)
    req.isAuthorized = false;
  else {
    mongodb.connect(config.db.mongoURL, function(err, db) {
      if (error) return console.error(err);

      var profiles = db.collection('profiles');
      profiles.find({uid: req.session.uid}).toArray(function(err, docs) {
        if (err) return console.error(err);
        if (docs.length == 0)
          req.isAuthorized = false;
        else if (docs.length > 1)
          console.log('Something is going wrong with user '+req.session.uid+'.');
        else {
          req.isAuthorized = true;
          req.userObj = docs[0];
        }
        db.close();
      });
    });
  }
  next();
}

module.exports = authMiddleware;
