const express = require('express');
const router = express.Router();
const { authenticate, authenticateAdmin } = require("../middleware/authenticate");
const _ = require("lodash");

const { mongoose } = require("../db/mongoose");
const { Org } = require("../models/org");
const { User } = require("../models/user");

const db = require("../db/db");
const mongodb = require("mongodb");

// GET /orgs
router.get("/", authenticateAdmin, (req, res) => {
  Org.find({})
    .then((orgs) => {
      res.send(orgs);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

router.get("/find-one", authenticate, (req, res) => {
  const user_count = req.query.user_count;

  Org.findOne({ _id: req.query.org_id })
    .then((org) => {
      if (user_count) {
        User.find({ org_id: org._id }).count().then(count => {
          res.send({
            ...org.toJSON(),
            user_count: count,
          });
        });
      } else {
        res.send(org);
      }
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

// POST /orgs/list
router.post("/list", authenticateAdmin, (req, res) => {
  const admin_rights = req.body.admin_rights;

  const find = {};

  if (admin_rights) {
    find._id = {
      $in: admin_rights
    }
  }

  Org.find(find)
    .then((orgs) => {
      res.send(orgs);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});


// POST /orgs
router.post("/", authenticateAdmin, (req, res) => {
  const body = _.pick(req.body, ["name", "attrs"]);

  if (!body.name) {
    return res.status(400).send("name is missing");
  }

  if (body.attrs && typeof body.attrs !== 'object') {
    return res.status(400).send("attrs must be an object");
  }

  const org = new Org(body);

  org
    .save()
    .then((resp) => {
      res.send(resp._doc);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

// DELETE /orgs
router.delete("/", authenticateAdmin, (req, res) => {
  var org_id = req.body.org_id;

  if (!org_id) {
    return res.status(400).send("No org_id Provided");
  }

  // first find all the users that are in that org
  User.find({ org_id }).then(users => {
    const userIds = users.map(d => d._id);

    Promise.all([
      // delete all schemes and collections assigned
      db.get().collection("user_schemes").deleteMany({
        user_id: {
          $in: [
            ...userIds.map(d => mongodb.ObjectID(d)), // users of that organization
            mongodb.ObjectID(org_id), // org itself
          ]
        }
      }),

      // remove this org from admin_rights array
      User.updateMany({
        $pull: {
          admin_rights: {
            $elemMatch: {
              $eq: org_id
            }
          }
        }
      }, { multi: true }),

      // delete all the users in that organization
      User.deleteMany({ org_id }),

      // update admin_rights of all other users that include org_id
      User.update(
        {},
        {
          $pull: {
            admin_rights: org_id
          }
        }, 
        { multi: true }
      ),
  
      // delete organization
      Org.findByIdAndDelete(org_id),
    ])
    .then(() => {
      res.status(200).send({
        status: "org deleted",
      });
    })
    .catch((err) => {
      res.status(400).send(err);
    });

  })
  .catch((err) => {
    res.status(400).send(err);
  });
});

// PUT /orgs
router.put("/", authenticateAdmin, (req, res) => {
  var body = _.pick(req.body, ["org_id", "name", "attrs"]);

  if (!body.org_id) {
    return res.status(400).send("No org_id provided");
  }

  if (!body.name && !body.attrs) {
    return res.status(400).send("Not enough args provided, pass name or attrs");
  }

  const setObj = {};

  if (body.name) {
    setObj['name'] = body.name;
  }

  if (body.attrs && typeof body.attrs === "object") {
    Object.keys(body.attrs).forEach(k => {
      setObj['attrs.' + k] = body.attrs[k];
    });
  }

  Org.findByIdAndUpdate(
    body.org_id, 
    { $set: setObj }
  )
  .then(() => {
    res.status(200).send({
      status: "ok",
    });
  })
  .catch((err) => {
    res.status(400).send(err);
  });
});

module.exports = router;