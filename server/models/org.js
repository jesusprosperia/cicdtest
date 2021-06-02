const mongoose = require('mongoose')
const _ = require('lodash')

const OrgScheme = new mongoose.Schema({
  name: {
    type: String,
    minlength: 2,
    required: true,
    trim: true,
    unique: true,
  },

  attrs: {
    type: Object,
    required: true,
    'default': {
      primary_color: "#2c3e50",
      secondary_color: "#28a745",
      logo_url: null, // org logo
      profile_img_url: null, // org profile image
      max_users: 10, // max users in organization
      max_dataset_size: 50, // in megabytes
      max_datasets: 10, // number of datasets
      max_targeting_schemes: 10 // numer of targeting schemes
    }
  },
})

OrgScheme.methods.toJSON = function () {
  var user = this;
  var userObject = user.toObject();
  return _.pick(userObject, ['name', 'attrs', '_id']);
}

const Org = mongoose.model('Org', OrgScheme);

module.exports.Org = Org;
