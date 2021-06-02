const express = require('express');
const router = express.Router();
const { authenticate, authenticateAdmin } = require("../middleware/authenticate");
const db = require("../db/db");
const mongodb = require("mongodb");
const _ = require("lodash");

const getRandomId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

/**
 * Lists all schemes and collections
 */
router.post("/list-schemes", authenticate, (req, res) => {
  var params = _.pick(req.body, ["user_id"]);

  if (!params.user_id) {
    return res.status(500).send("Please pass user_id");
  }

  const user_id = mongodb.ObjectId(params.user_id);

  db.get()
    .collection("user_schemes")
    .findOne({user_id})
    .then((_scheme) => {
      const scheme = _scheme || {};
      
      res.send({
        collections: (scheme.collections || []).map(d => ({
          collection: d.collection,
          name: d.name,
        })),
        schemes: (scheme.target_schemes || []).map(d => ({
          id: d.id,
          name: d.name,
        }))
      });
    })
    .catch(e => {
      res.status(500).send(e.message);
    });
});

/**
 * Returns a single scheme object
 */
router.post("/get-scheme", authenticate, (req, res) => {
  var params = _.pick(req.body, ["user_id", "scheme_id"]);

  if (!params.user_id || !params.scheme_id) {
    return res.status(500).send("Required params: user_id, scheme_id.");
  }

  const user_id = mongodb.ObjectId(params.user_id);

  db.get().collection("user_schemes")
    .findOne({ user_id })
    .then((scheme) => {
      const target_scheme = scheme.target_schemes.find(d => d.id === params.scheme_id);
      const collection = target_scheme
        ? scheme.collections.find(d => d.collection === target_scheme.collection)
        : null;

      if (target_scheme) {
        return res.send({
          scheme: target_scheme,
          collection: collection
        });
      }
    
      throw new Error("Scheme not found.");
    })
    .catch(e => {
      res.status(500).send(e.message)
    });
});

router.post("/get-collection", authenticate, (req, res) => {
  var params = _.pick(req.body, ["user_id", "collection"]);

  if (!params.user_id || !params.collection) {
    return res.status(500).send("Required params: user_id, collection");
  }

  const user_id = mongodb.ObjectId(params.user_id);

  db.get().collection("user_schemes")
    .findOne({ user_id })
    .then((scheme) => {
      if (scheme) {
        const collection = (scheme.collections || []).find(d => d.collection === params.collection);
        return res.send(collection);
      }
    
      throw new Error("Collection not found.");
    })
    .catch(e => {
      res.status(500).send(e.message)
    });
})

/**
 * Saves existing scheme
 * Note this is an array object in scheme.target_schemes
 */
router.post("/save-scheme", authenticate, (req, res) => {
  const params = _.pick(req.body, [
    "user_id",
    "scheme",
  ]);

  if (!params.user_id || !params.scheme) {
    return res.status(500).send('pass user_id and scheme.');
  }
  
  const user_id = mongodb.ObjectId(params.user_id);
  const scheme_id = params.scheme.id;
  const collection = db.get().collection("user_schemes");

  collection.update({
    user_id: user_id,
    "target_schemes.id": scheme_id
  }, {
    $set: { 
      "target_schemes.$": params.scheme
    }
  }).then(() => {
    res.send({msg: "OK! Updated!"});
  }).catch(e => {
    res.status(500).send(e.message)
  })
});

/**
 * adds target_scheme or collection to user's scheme
 */
router.post("/add-scheme-or-col", authenticate, (req, res) => {
  const params = _.pick(req.body, [
    "user_id",
    "scheme",
    "collection",
  ]);

  if (!params.user_id) {
    return res.status(500).send('user_id is missing');
  }

  if (!params.scheme && !params.collection) {
    return res.status(500).send('scheme or colleciton is missing');
  }
  
  const user_id = mongodb.ObjectId(params.user_id);
  const collection = db.get().collection("user_schemes");
  const $push = {};

  if (params.scheme) {
    $push.target_schemes = params.scheme;
  }

  if (params.collection) {
    $push.collections = params.collection;
  }

  collection.update({ user_id }, { $push }).then((resp) => {
    // if nModified is 0, then scheme does not exist, and need to create one
    if (resp.result.nModified === 0) {
      db.get().collection("user_schemes").insertOne({
        user_id: user_id,
        collections: params.collection ? [params.collection] : [],
        target_schemes: params.scheme ? [params.scheme] : [],
      }).then((resp) => {
        res.send({msg: "OK! Added!", resp});
      });
    } else {
      res.send({msg: "OK! Added!", resp});
    }
  }).catch(e => {
    res.status(500).send(e.message)
  });
});

router.post("/remove-scheme-or-col", authenticate, (req, res) => {
  const params = _.pick(req.body, [
    "user_id",
    "schemes",
    "collections",
  ]);

  if (!params.user_id) {
    return res.status(500).send('user_id is missing');
  }

  if (!params.schemes && !params.collections) {
    return res.status(500).send('schemes or collections is missing');
  }

  const user_id = mongodb.ObjectId(params.user_id);
  const update = {};

  if (params.schemes) {
    update["target_schemes"] = { id: { $in: params.schemes } };
  }

  if (params.collections) {
    update["collections"] = { collection: { $in: params.collections } };
    update["target_schemes"] = { collection: { $in: params.collections } };
  }

  db.get().collection("user_schemes")
    .findOneAndUpdate(
      { user_id }, 
      { $pull: update },
      { returnOriginal: false }
    ).then((response) => {
      const _scheme = response.value;

      res.send({
        collections: (_scheme.collections || []).map(d => ({
          collection: d.collection,
          name: d.name,
        })),
        schemes: (_scheme.target_schemes || []).map(d => ({
          id: d.id,
          name: d.name,
        }))
      });
    }).catch(e => {
      res.status(500).send(e.message)
    });
});

router.post("/copy-schemes", authenticateAdmin, (req, res) => {
  var params = _.pick(req.body, [
    "userFromId",
    "userToId",
    "selectedSchemeIds",
  ]);

  var collection = db.get().collection("user_schemes");

  if (params.userFromId && params.userToId && params.selectedSchemeIds) {
    // find user that we want to copy scheme from
    collection.findOne({ user_id: mongodb.ObjectID(params.userFromId)}, function (err, scheme) {
        if (err) return res.status(500).send("error");

        if (scheme && scheme.target_schemes) {
          // find correct target scheme
          const targetSchemes = scheme.target_schemes.filter(
            (d) => params.selectedSchemeIds.indexOf(d.id) > -1
          );

          // if we copy scheme within the same user
          if (params.userFromId === params.userToId) {
            targetSchemes.forEach(d => {
              d.id = getRandomId();
              d.name = d.name + ' Copy'; 
            });
          }

          const targetSchemeIds = targetSchemes.map(d => d.id);
          const collectionNames = targetSchemes.map((d) => d.collection);
          const collections = scheme.collections.filter((d) => {
            return collectionNames.indexOf(d.collection) > -1;
          });

          if (targetSchemes.length > 0) {
            collection.findOne(
              { user_id: mongodb.ObjectID(params.userToId) },
              function (_err, _scheme) {
                if (_err) return res.status(500).send("error");

                if (_scheme) {
                  // append to existing schemes and collection
                  // replace existing scheme and collection if duplicated
                  var update = {
                    collections: (_scheme.collections || [])
                      .filter((d) => {
                        return collectionNames.indexOf(d.collection) === -1;
                      })
                      .concat(collections),
                    target_schemes: (_scheme.target_schemes || [])
                      .filter((d) => {
                        return targetSchemeIds.indexOf(d.id) === -1;
                      })
                      .concat(targetSchemes),
                  };

                  // final update
                  collection.findOneAndUpdate(
                    { user_id: mongodb.ObjectID(params.userToId) },
                    { $set: update },
                    { returnOriginal: false },
                    function (err, response) {
                      if (err) return res.status(500).send("error");
                      res.send({
                        status: "ok",
                        msg: "Documents updated!",
                        data: response,
                      });
                    }
                  );
                } else {
                  collection.insertOne(
                    { user_id: mongodb.ObjectID(params.userToId), 
                      collections,
                      target_schemes: targetSchemes
                    },
                    function (err, response) {
                      if (err) return res.status(500).send("error");

                      res.send({
                        status: "ok",
                        msg: "Documents saved!",
                        data: {
                          value: response.ops[0],
                        },
                      });
                    }
                  );
                }
              }
            );
          }
        }
      }
    );
  } else {
    return res.status(500).send("Insufficient Params");
  }
});

router.delete("/delete-scheme", authenticateAdmin, (req, res) => {
  var params = _.pick(req.body, ["user_id"]);

  if (!params.user_id) {
    return res.status(400).send("No User Id Provided");
  }

  var user_id = mongodb.ObjectId(params.user_id);

  var collection = db.get().collection("user_schemes");

  collection
    .remove({
      user_id,
    })
    .then(() => {
      res.send({
        status: "ok",
        msg: "Scheme deleted!",
      });
    })
    .catch((err) => {
      res.status(500).send({
        status: "error",
        msg: err.message,
      });
    });
});

module.exports = router;