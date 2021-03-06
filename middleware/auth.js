var config = require('../config');
var utils = require('../utils');
var mongodb = require('mongodb').MongoClient;
var co = require('co');

function authMiddleware(req, res, next) {
  if (!req.session || !req.session.uid) {
    req.isAuthorized = false;
    req.welcomeString = '';
    next();
  } else {
    co(function *() {
      var profiles = yield req.mongo.profiles.find({
        uid: req.session.uid
      }).toArray();
      if (profiles.length !== 1)
        console.log('Something is going wrong with user '+req.session.uid+'.');
      else {
        req.isAuthorized = true;
        req.userObj = profiles[0];
        req.welcomeString = 'Hello, ' + req.userObj.displayName + '.';
      }
    }).then(function() {
      next();
    }).catch(utils.onError);

  }
}

module.exports = authMiddleware;
