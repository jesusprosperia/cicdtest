const {User} = require('../models/user');

var authenticate = (req, res, next) => {
  var token = req.header('x-auth');
  User.findByToken(token).then((user) => {
    if (!user) {
      return Promise.reject();
    }
    req.user = user
    req.token = token
    next()
  }).catch((err) => {
    return res.status(400).send(err.message);
  })
}

var authenticateAdmin = (req, res, next) => {
  var token = req.header('x-auth')

  User.findByToken(token).then((user) => {
    if (!user) {
      return Promise.reject();
    }

    var type = user.type || "level_1";

    if (type !== "admin" && type !== "super_admin") {
      return Promise.reject();
    }

    req.user = user
    req.token = token
    next()
  }).catch((err) => {
    return res.status(401).send()
  })
}

module.exports = {authenticate, authenticateAdmin}