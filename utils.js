var utils = {};
utils.randomChoice = function(arr) {
  return arr[Math.floor(Math.random()*(arr.length - 1))];
};

utils.randomAlphanum = function() {
  var alphanums = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  alphanums = alphanums.split('');
  return utils.randomChoice(alphanums);
};

utils.randomAlphanums = function() {
  var ret = '';
  for (var i = 0; i < length; i++)
    ret += utils.randomAlphanum();
  return ret;
};

utils.onError = function (err) {
  console.error(err.stack);
}

utils.gotoError = function(req, res, errText) {
  req.session.errText = errText;
  res.redirect('/error');
  req.mongo.db.close();
  res.end();
}
module.exports = utils;
