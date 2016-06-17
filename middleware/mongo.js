var config = require('../config');
var mongodb = require('mongodb').MongoClient;


function mongoMiddleware(req, res, next) {
  mongodb.connect(config.db.mongoURL, function(err, db) {
    if (err) return console.error(err);

    var mongoObj = {
      db: db,
      answers: db.collection('answers'),
      polls: db.collection('polls'),
      profiles: db.collection('profiles'),
      sessions: db.collection('sessions')
    };

    req.mongo = mongoObj;
    next();
  });
}

module.exports = mongoMiddleware;
