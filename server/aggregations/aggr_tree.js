/**
 * Creates aggregations array used to produce aggregation tree from ordinal trees
 * @param {Object} param0 
 * 
 * criteria - string, basically what is on x axis in histogram
 * 
 * policies in this form:
 * [
 *    {"name":"pol_0","leaves":[{"set":["urban_0"],"amount":1,"threshold":0,"impact_factor":"impact_factor","cost_factor":"factor_1"},
 *    {"name":"pol_1","leaves":[{"set":["urban_1"],"amount":1,"threshold":0,"impact_factor":"impact_factor","cost_factor":"factor_1"}
 * ]
 * 
 * comparison: either $lte or $gte, depending priority is low or high in specifications page
 * 
 * match: basically a match aggregation pipeline
 * 
 * statistics in this form:
 * [ {column: "family_size", field: "post_family_size", type: "sum"} ]
 * 
 * If policies are not provided, it is pre policy aggregation
 * If policies provided, it is post policy aggregation
 * 
 * Take a look at the stackoverflow question of mine:
 * https://stackoverflow.com/questions/62911140/find-corresponding-object-from-js-array-and-use-its-fields-in-mongodb-aggregatio?noredirect=1#comment111278569_62911140
 * 
 * aggregation logic is following:
 * 
 * impact: [criteria + amount_policy_1 * impact_factor_policy_1 + amount_policy_2 * impact_factor_policy_2 + ...]
 * cost: [criteria + amount_policy_1 * cost_factor_policy_1 + amount_policy_2 * cost_factor_policy_2 + ...]
 */

const getAggregatedTreeAggrs = ({ 
  criteria, 
  policies, 
  comparison,
  match,
  statistics,
  nodes
}) => {
  const aggregations = [];

  // MATCH
  // match pipeline will filter subset of data
  if (match) {
    Object.keys(match).forEach(key => {
      var m = match[key];

      if (m.$gte && m.$lte) {
        match[key] = {
          $gte: +m.$gte,
          $lte: +m.$lte
        };
      }
    });

    aggregations.push({
      $match: match
    });
  }

  // STATISTICS
  // statistics aggregation pipelines
  // doing sum: [.. weight * ${column} ]
  const statistic_groups = {};
  const statistic_vars = {};
  if (statistics) {
    statistics.forEach(d => {
      statistic_groups[d.field] = {
        $sum: {
          $multiply: [
            { $toDouble: "$weight" },
            { $toDouble: `$${d.column}` }
          ]
        }
      }
      if (d.column !== criteria) {
        statistic_vars[d.column] = 1;
      }
    })
  }

  // NODES
  let switchQuery
  if (nodes) {
    switchQuery = { "$switch": { "branches": []}};
    nodes.map(node => {
      let key = Object.keys(node)[0]
      branch = {
        "case": {
          $eq: [`$${key}`, node[key]]
        },
        "then": `${key}_${node[key]}`
      }
      switchQuery['$switch']['branches'].push(branch)
    })
    switchQuery = { "subgroup": switchQuery }
  }

  // POLICIES
  if (policies) {
    const query = {}
  
    policies.forEach(policy => {
      const name = policy.name;

      if (policy.leaves) {
        let switchQuery = { "$switch": { "branches": [], default: {
          cost: 0,
          impact: 0
        }}};
          
        policy.leaves.forEach(leave => {
          branch = {
            "case": {
              "$and": leave.set.map(set => {
                let key = Object.keys(set)[0]
                return { $eq: [`$${key}`, set[key]] }
              })
            },
            "then": {
              "$cond": { 
                "if":  {
                  [comparison]: [`$${criteria}`, leave.threshold ]
                },
                "then": {
                  cost: { "$multiply" : [`$${leave.cost_factor}`, leave.amount ] },
                  impact: { "$multiply" : [`$${leave.impact_factor}`, leave.amount ] },
                },
                "else": {
                  cost: 0,
                  impact: 0
                }
              }
            }
          }
          switchQuery['$switch']['branches'].push(branch)
          query[name] = switchQuery
        })
      }
    });
  
    // PROJECT STAGE 1: find proper group
    aggregations.push({
      $project: {
        ...query,
        _id: 0,
        [criteria]: 1,
        weight: 1,
        ...statistic_vars,
        ...switchQuery
      }
    })

    // PROJECT STAGE 2: sum impacts and criteria and round
    aggregations.push({
      $project: {
        subgroup: 1,
        [criteria]: {
          $round: [
            {
              $add: [
                '$' + criteria,
                ...policies.map(d => `$${d.name}.impact`)
              ]
            },
            0
          ]
        },
        cost_factor: {
          $multiply: [
            {
              $toDouble: "$weight"
            },
            {
              $add: [
              ...policies.map(d => `$${d.name}.cost`)
              ]
            }
          ]
        },
        weight: 1,
        ...statistic_vars
      }
    })
  } else {
    aggregations.push({
      $project: {
        _id: 0,
        [criteria]: 1,
        weight: 1,
        ...switchQuery,
        ...statistic_vars,
      }
    })
  }

  // GROUP BY CRITERIA
  aggregations.push({
    $group: {
      _id: {
        [criteria]: '$' + criteria,
        "subgroup": "$subgroup"
      },
      sum: {
        $sum: {
          $toDouble: "$weight"
        }
      },
      cost: {
        $sum: '$cost_factor'
      },
      ...statistic_groups
    }
  });

  return aggregations;
}

module.exports = {
  getAggregatedTreeAggrs
}
