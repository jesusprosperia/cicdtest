const MongoClient = require('mongodb').MongoClient

const dbName = "SociaiDB";

const state = {
  client: null,
  db: null,
}

exports.connect = function(url, done) {
  if (state.client) return done()

  MongoClient.connect(url, {useNewUrlParser: true}, function(err, client) {
    if (err) return done(err)
    state.client = client
    state.db = client.db(dbName)
    done()
  })
}

exports.get = function() {
  return state.db
}

exports.close = function(done) {
  if (state.client) {
    state.client.close(function(err, result) {
      state.db = null
      state.mode = null
      state.client = null
      done(err)
    })
  }
}