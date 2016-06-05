var utilities = function() {
  this.randomChoice = function(arr) {
    return arr[Math.floor(Math.random()*(arr.length - 1))];
  };

  this.randomAlphanum = function() {
    var alphanums = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    alphanums = alphanums.split();
    return this.randomChoice(alphanums);
  }

  this.randomAlphanums = function(length=6) {
    var ret = '';
    for (var i = 0; i < length; i++)
      ret += this.randomAlphanum();
    return ret;
  }
};

module.exports = utilities;
