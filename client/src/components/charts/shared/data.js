import axios from '@/plugins/axios';
import { getMatch, getMatchArray } from '@/utils/chart';
import { mergeBins } from '@/utils/array';
import { nest } from 'd3-collection';

/**
 * Generates common request data that is used in both, pre and post requests
 * @param {Object} param0 group_id, node, config and categories
 */
const getCommonRequestData = ({
  group_id,
  node,
  config,
  groupCategories
}) => {
  // generate match query
  var match = getMatch(node);
  var subset_match = {
    ...config.matchCase
  };

  if (match) {
    match.forEach(d => {
      subset_match[d.name] = d.value
    })
  }

  var baseRequest = {
    collection: config.collection,
    match: subset_match,
    nodes: groupCategories.map(d => {
      return { [group_id]: d }
    })
  };

  // append criteria to the request data
  if (config.selectionType == '1d') {
    baseRequest.criteria = config.criteria[0];
  } else {
    baseRequest.criteriaX = config.criteria[0];
    baseRequest.criteriaY = config.criteria[1];
  }

  return baseRequest;
}

/**
 * Generates request data for pre policy
 * @param {Object} param0 group_id, node, config and categories
 */
const getPreRequestData = ({ 
  group_id,
  node,
  config,
  groupCategories
}) => { 
  const common = getCommonRequestData({
    group_id,
    node,
    config,
    groupCategories
  });

  let statistics = [];

  if (config.statistics) {
    statistics = config.statistics.map(d => {
      return {
        column: d.column,
        field: 'pre_' + d.column,
        type: d.type
      }
    })
  }

  var cost_factors = config.cost_factors ? config.cost_factors.map(d => d.name) : [];

  return {
    ...common,
    statistics,
    cost_factors
  }
}

/**
 * Generates request data for post policy
 * @param {Object} param0 group_id, node, config, categories, policies, threshold
 */
const getPostRequestData = ({
  group_id,
  node,
  config,
  groupCategories,
  policies,
  threshold
}) => { 
  const common = getCommonRequestData({
    group_id,
    node,
    config,
    groupCategories
  });

  const comparison = config.criteriaPriority == 'low' ? '$lte' : '$gte';
  const impact_factor = node.data.impact_factor;
  const cost_factor = node.data.cost_factor ? node.data.cost_factor.name : "";

  let statistics = [];

  if (config.statistics) {
    statistics = config.statistics.map(d => {
      return {
        column: d.column,
        field: 'post_' + d.column,
        type: d.type
      }
    })
  }

  if (config.type === 'normal') {
    return {
      ...common,
      statistics,
      comparison,
      policies: [
        {
          id: 'pol',
          name: 'pol',
          set: [],
          leaves: [
            {
              amount: node.data.mon_cost.value,
              threshold,
              impact_factor,
              cost_factor,
            }
          ]
        }
      ]
    }
  } else {
    return {
      ...common,
      statistics,
      comparison,
      policies
    }
  }
}

/**
 * Loads children of a node. Used when splitting.
 * @param {String} group_id segmentation variable
 * @param {Object} node tree node
 * @param {Number} threshold threshold value of node
 * @param {Object} config tree configuration parameters
 * @param {Array} policies other single policy trees. set only when aggregation tree
 * @param {Array} groupCategories group categories of segmentation variable
 */
export function loadChildren(group_id, node, threshold, config, policies, groupCategories) {
  const criteriaRange = config.numericalFilters[config.criteria[0]];

  const prePolReq = getPreRequestData({
    group_id,
    node,
    config,
    groupCategories
  });

  const requests = [prePolReq];

  if (config.hasPostPolicy) {
    const postPolReq = getPostRequestData({
      group_id,
      node,
      config,
      groupCategories,
      policies,
      threshold
    });

    requests.push(postPolReq)
  }

  return Promise.all(requests.map(req => {
    return axios.post(config.binsEndpoint, req);
  })).then(resp => {
    let pre = {};
    let post = {};
    let result = [];

    if (resp[0]) {
      const res = nest().key(d => d.subgroup).entries(resp[0].data);
      res.forEach(d => pre[d.key] = d.values);
    }

    if (resp[1]) {
      const res = nest().key(d => d.subgroup).entries(resp[1].data);
      res.forEach(d => post[d.key] = d.values);
    }

    for (let i = 0; i < groupCategories.length; i++) {
      const cat = groupCategories[i];
      const key = `${group_id}_${cat}`;

      if (pre[key] && post[key]) {
        result.push({
          key: cat,
          bins: mergeBins(pre[key], post[key], criteriaRange)
        })
      } else if (pre[key]) {
        result.push({
          key: cat,
          bins: pre[key]
        })
      }
    }

    if (!result.length) {
      throw new Error('No Data');
    }

    return result;
  });
}

/**
 * Updates all leaf nodes of aggregation tree
 * @param {Array} nodes leaf nodes
 * @param {Object} config tree configuration parameters
 * @param {Array} policies other single policy trees. set only when aggregation tree
 */
 export function updateAggrTree(nodes, config, policies) {
  const comparison = config.criteriaPriority == 'low' ? '$lte' : '$gte';
  const criteriaRange = config.numericalFilters[config.criteria[0]];

  const request_data = {
    collection: config.collection,
    comparison: comparison,
    criteria: config.criteria[0],
    match: config.matchCase || {},
    policies: policies,
    nodes: [],
  };

  const pre_data = [];

  if (config.statistics) {
    request_data.statistics = config.statistics.map(d => {
      return {
        column: d.column,
        field: 'post_' + d.column,
        type: d.type
      }
    })
  }

  if (nodes) {
    nodes.forEach(node => {
      const matchArr = getMatchArray(node);

      if (matchArr) {
        request_data.nodes.push(matchArr);

        let group_name = '';

        if (Array.isArray(matchArr)) {
          group_name += matchArr.map(x => {
            return Object.entries(x).map(m => m.join("_")).join("_");
          }).join("_");
        } else {
          group_name += Object.entries(matchArr).map(m => m.join("_")).join("_");
        }

        pre_data.push({
          nodeId: node.data.id,
          group_name,
          data: node.data.data
        });
      }
    });
  }

  return axios.post(
    config.binsEndpoint, 
    request_data
  ).then(({ data }) => {
    const grouped = nest().key(d => d.subgroup).entries(data);
    const map = new Map(grouped.map(d => [d.key, d.values]));

    return pre_data.map(d => {
      let mergedData = [];
      const values = map.get(d.group_name);

      if (values) {
        mergedData = mergeBins(d.data, values, criteriaRange);
      }

      return {
        nodeId: d.nodeId,
        data: mergedData,
      }
    });
  });
}

/**
 * Loads post policy data. Used when refreshing histogram.
 * @param {Object} node tree node
 * @param {Number} threshold threshold value of node
 * @param {Object} config tree configuration parameters
 * @param {Array} requestPolicies policies in case of aggregation tree
 */
export function loadPostPolicyData(node, threshold, config, requestPolicies) {
  const match = getMatch(node);

  const mon_cost = node.data.mon_cost;
  const comparison = config.criteriaPriority == 'low' ? '$lte' : '$gte';

  const data = {
    collection: config.collection,
    criteria: config.criteria[0]
  };

  // generate match query
  var _match = {
    ...config.matchCase
  };

  if (match) {
    match.forEach(d => {
      _match[d.name] = d.value
    })
  }

  if (_match !== {}) {
    data.match = _match;
  }

  data.comparison = comparison;

  if (config.statistics) {
    data.statistics = config.statistics.map(d => {
      return {
        column: d.column,
        field: 'post_' + d.column,
        type: d.type
      }
    })
  }

  if (config.type === 'normal') {
    data.policies = [
      {
        id: 'pol_1',
        name: 'pol_1',
        set: [],
        leaves: [
          {
            amount: mon_cost.value,
            threshold: threshold,
            impact_factor: node.data.impact_factor,
            cost_factor: node.data.cost_factor ? node.data.cost_factor.name : "",
          }
        ]
      }
    ]
  } else {
    data.policies = requestPolicies;
  }

  return axios.post(config.binsEndpoint, data).then(resp => resp.data);
}

/**
 * Loads total population bins. 
 * Used to load initial data when tree is rendered first time.
 * @param {Object} config tree configuration parameters
 */
export function loadTotalPopulationBins(config) {
  var data = {
    collection: config.collection
  };

  if (config.matchCase) {
    data.match = config.matchCase;
  }

  if (config.criteria) {
    if (config.selectionType == '1d') {
      data.criteria = config.criteria[0];
    } else {
      data.criteriaX = config.criteria[0];
      data.criteriaY = config.criteria[1];
    }
  }

  if (config.cost_factors) {
    data.cost_factors = config.cost_factors.map(d => d.name);
  }

  if (config.statistics && config.statistics.length) {
    data.statistics = config.statistics.map(d => {
      return {
        type: d.type,
        column: d.column,
        field: 'pre_' + d.column
      }
    })
  }

  return axios.post(config.binsEndpoint, data).then(resp => {
    const responseData = config.current_impact_factor ? resp.data.map(d => {
      return {
        ...d,
        current: d.sum
      }
    }) : resp.data;

    return responseData;
  });
}