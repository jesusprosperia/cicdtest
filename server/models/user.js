const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const bcrypt = require('bcryptjs')
const userTypes = require('../usertypes');

var UserScheme = new mongoose.Schema({
  email: {
    type: String,
    minlength: 1,
    required: true,
    trim: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  name: {
    type: String,
    minlength: 1,
    required: false,
    trim: true,
  },
  lastname: {
    type: String,
    minlength: 1,
    required: false,
    trim: true,
  },
  type: {
    type: String,
    enum: Object.keys(userTypes),
    default: 'level_1',
    required: false,
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }],
  reset_password_token: {
    type: String,
    required: false
  },
  reset_password_expires: {
    type: Number,
    required: false
  },
  added_by_admin: {
    type: Boolean,
    required: false,
    'default': false
  },
  org_id: {
    type: String,
    required: true,
  },
  admin_rights: {
    type: Array,
    required: true,
    default: [],
  }
})

UserScheme.methods.toJSON = function () {
  var user = this;
  var userObject = user.toObject();
  return _.pick(userObject, [
    '_id',
    'email',
    'name',
    'lastname',
    'type',
    'added_by_admin',
    'org_id',
    'admin_rights',
  ]);
}

UserScheme.methods.generateAuthToken = function () {
  var user = this;
  var access = 'auth';
  var token = jwt.sign({ _id: user._id.toHexString(), access }, process.env.JWT_SECRET).toString();

  user.tokens = user.tokens.concat([{access, token}])

  return user.save().then(() => {
    return token;
  })
}

UserScheme.methods.removeToken = function (token) {
  var user = this;

  return user.update({
    $pull: {
      tokens: { token }
    }
  })
}

UserScheme.statics.findByToken = function (token) {
  var User = this;
  var decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return Promise.reject(error);
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  })
}

UserScheme.statics.findByCredentials = function (email, password) {
  var User = this;

  return User.findOne({email}).then((user) => {
    if (!user) {
      return Promise.reject()
    }

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, result) => {
        if (result) resolve(user)
        else reject() 
      })
    })
  })
}

UserScheme.pre('save', function (next) {
  var user = this;

  if (user.isModified('password')) {
    var password = user.password;

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        user.password = hash;
        next();
      })
    })
  } else {
    next();
  }
})

var User = mongoose.model('User', UserScheme)

module.exports.User = User
