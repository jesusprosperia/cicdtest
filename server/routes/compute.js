const express = require('express');
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const db = require("../db/db");
const _ = require("lodash");
const request = require('request');

router.post("/bins2d", authenticate, (req, res) => {
  var params = _.pick(req.body, [
    "criteriaX",
    "criteriaY",
    "collection",
    "match",
  ]);

  if (!params.criteriaX || !params.criteriaY) {
    return res.send([]);
  }

  var aggregations = [];

  if (params.match) {
    Object.keys(params.match).forEach((key) => {
      var m = params.match[key];

      if (m.$gte && m.$lte) {
        params.match[key] = {
          $gte: +m.$gte,
          $lte: +m.$lte,
        };
      }
    });

    aggregations.push({
      $match: params.match,
    });
  }

  aggregations.push({
    $group: {
      _id: {
        criteriaX: "$" + params.criteriaX,
        criteriaY: "$" + params.criteriaY,
      },
      sum: {
        $sum: {
          $toDouble: "$weight",
        },
      },
    },
  });

  const collection = db.get().collection(params.collection);

  collection.aggregate(aggregations, { allowDiskUse: true }, function (
    err,
    response
  ) {
    response.toArray((e, arr) => {
      if (e) {
        return res.status(500).send("Internal error");
      }

      if (arr) {
        arr = arr.map((d) => ({
          criteriaX: +d._id.criteriaX,
          criteriaY: +d._id.criteriaY,
          crit_x_y: `${d._id.criteriaX}_${d._id.criteriaY}`,
          sum: d.sum,
        }));
      }

      arr = _(arr)
        .groupBy("crit_x_y")
        .map((items, id) => {
          return {
            criteriaX: items[0].criteriaX,
            criteriaY: items[0].criteriaY,
            sum: _.sumBy(items, "sum"),
          };
        })
        .sort((a, b) => a.criteriaX - b.criteriaX);

      res.send(arr);
    });
  });
});

router.post("/bins", authenticate, async (req, res) => {
  const params = _.pick(req.body, [
    "criteria",
    "collection",
    "match",
    "comparison",
    "statistics",
    "nodes",
    "policies",
    "cost_factors",
  ]);

  if (!params.collection) {
    return res.status(500).send("collection is missing in request body.");
  }

  if (!params.criteria) {
    return res.status(500).send("criteria is missing in request body.");
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const options = {
        uri: process.env.AWS_LAMBDA_UNIFIED,
        method: 'POST',
        json: params
      };
      request(options, function(error, response, body) {
        if (error) {
          return reject(error);
        }
        if (response.statusCode !== 200 && body.message) {
          return reject(body);
        }
        resolve(body);      
      });
    });

    let arr = []
    result.forEach((d) => {
      const obj = {
        criteria: d._id[params.criteria],
        subgroup: d._id.subgroup,
        ...d,
      };
      delete obj._id;
      arr.push(obj);
    })
    arr.sort((a, b) => a.criteria - b.criteria);
    res.send(arr);
  } catch(e) {
    res.status(500).send(e.message);
  }
});

router.post("/get-sum", authenticate, (req, res) => {
  var params = _.pick(req.body, ["collection", "match"]);

  const collection = db.get().collection(params.collection);

  var aggregations = [];

  if (params.match) {
    Object.keys(params.match).forEach((key) => {
      var m = params.match[key];

      if (m.$gte && m.$lte) {
        params.match[key] = {
          $gte: +m.$gte,
          $lte: +m.$lte,
        };
      }
    });

    aggregations.push({
      $match: params.match,
    });
  }

  aggregations.push({
    $group: {
      _id: "",
      sum: {
        $sum: {
          $toDouble: "$weight",
        },
      },
    },
  });

  collection.aggregate(aggregations, { allowDiskUse: true }, function (
    err,
    response
  ) {
    if (err) {
      return console.error(err);
    }

    response.toArray().then((sum) => {
      res.send(sum);
    });
  });
});

module.exports = router;