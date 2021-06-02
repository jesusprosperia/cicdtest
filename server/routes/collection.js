const express = require('express');
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const db = require("../db/db");
const _ = require("lodash");

router.post("/get-filters", authenticate, (req, res) => {
  var params = _.pick(req.body, ["collection", "filter"]);

  if (!params.collection || !params.filter) {
    return res.status(500).send({
      status: "error",
      msg: "Please pass collection and filter as an argument",
    });
  }

  var aggregations = [];

  if (params.filter.category == "categorical") {
    aggregations.push({
      $group: {
        _id: `$${params.filter.propName}`,
      },
    });
  } else if (params.filter.category == "numeric") {
    aggregations.push({
      $group: {
        _id: "$item",
        min: {
          $min: {
            $toDouble: `$${params.filter.propName}`,
          },
        },
        max: {
          $max: {
            $toDouble: `$${params.filter.propName}`,
          },
        },
      },
    });
  }

  const collection = db.get().collection(params.collection);

  collection.aggregate(aggregations, { allowDiskUse: true }, function (
    err,
    response
  ) {
    response.toArray((e, arr) => {
      if (e) {
        console.error("error blah", e);
        return res.status(500).send("Internal error");
      }

      res.send(arr);
    });
  });
});

router.post("/get-geojson", authenticate, (req, res) => { 
  var params = _.pick(req.body, ["collection"]);

  if (!params.collection) {
    return res.status(500).send({
      status: "error",
      msg: "Please pass shapefile collection",
    });
  }

  db.get().collection(params.collection)
    .find()
    .toArray()
    .then(arr => { 
      res.send({
        status: "ok",
        data: arr.map(d => { 
          return {
            p: d.properties,
            g: d.geometry
          }
        })
      });
    })
    .catch(e => { 
      res.status(500).send({
        status: "error",
        msg: e.message,
      });
    })
})

router.post("/upload", authenticate, (req, res) => {
  var params = _.pick(req.body, ["collection", "data"]);

  if (params.data && params.data.length) {
    db.get().collection(params.collection).insertMany(params.data, function (
      err,
      response
    ) {
      if (err) return res.status(500).send("error");
      console.log("Number of documents inserted: " + response.insertedCount);
      res.send({
        status: "ok",
        msg: "Documents saved!",
      });
    });
  }
});

module.exports = router;