import {min, max} from 'd3-array';
import _ from 'lodash';

export function isArrayEqual(x, y) {
  return _(x).differenceWith(y, _.isEqual).isEmpty();
}

export function allocateBinsToBounds(data, range) {
  const [minCriteria, maxCriteria] = range;
  const keys = data.length ? Object.keys(data[0]).filter(key => key !== 'criteria') : [];

  const minAllocation = {
    criteria: minCriteria
  };

  const maxAllocation = {
    criteria: maxCriteria
  };

  data.forEach(d => {
    keys.forEach(key => {
      const field = key;
      const val = (d[key] || 0);

      // allocating to minCriteria
      if (d.criteria <= minCriteria) {

        if (minAllocation[field]) {
          minAllocation[field] += val;
        } else {
          minAllocation[field] = val;
        }

      }
      // allocating to maxCriteria
      else if (d.criteria >= maxCriteria) {

        if (maxAllocation[field]) {
          maxAllocation[field] += val;
        } else {
          maxAllocation[field] = val;
        }

      }
    })
  });

  return data.filter(d => d.criteria >= minCriteria && d.criteria <= maxCriteria).map(d => {
    if (d.criteria === minCriteria) {
      return minAllocation;
    } else if (d.criteria === maxCriteria) {
      return maxAllocation;
    } else {
      return d;
    }
  })
}

/**
 * Merges two arrays. Used to merge pre and post policy data as a single array. 
 * if post policy criterias are out of [min, max] bounds, they are allocated to [min, max] criterias respectively.
 * if post policy has a criteria (between [min, max]) that was missing in pre policy, it will be added to the result array.
 * sum = pre policy value
 * current = post policy value
 * if post policy does not have a criteria, presented in pre data, fields of b[0] set to 0, except 'sum'.
 * please visit this notebook for testing: https://observablehq.com/d/3142c825a0fd1310
 * @param {Array} a pre policy array
 * @param {Array} b post policy array
 * @param {Object} criteriaRange min and max criteria being displayed in histogram
 * @returns a new array, merged a and b
 */
export function mergeBins(a, b, criteriaRange) {
  let minCriteria; 
  let maxCriteria;

  if (criteriaRange) {
    minCriteria = criteriaRange.min;
    maxCriteria = criteriaRange.max;
  } else {
    minCriteria = min(a, d => d.criteria);
    maxCriteria = max(a, d => d.criteria);
  }

  const keys = b.length ? Object.keys(b[0]).filter(key => key !== 'criteria') : [];

  // map of array `a`
  const oldDataMap = {};
  a.forEach(d => oldDataMap[d.criteria] = d);

  // map of array `b`. also commulative values at min and max criterias.
  const newDataMap = {};

  // fill maps
  b.forEach(d => {
    keys.forEach(key => {
      const field = key == 'sum' ? 'current' : key;
      const val = (d[key] || 0);

      // allocating to minCriteria
      if (d.criteria < minCriteria) {
        if (newDataMap[minCriteria]) {
          if (newDataMap[minCriteria][field]) {
            newDataMap[minCriteria][field] += val;
          } else {
            newDataMap[minCriteria][field] = val;
          }
        } else {
          newDataMap[minCriteria] = { [field]: val };
        }
      }
      // allocating to maxCriteria
      else if (d.criteria > maxCriteria) {
        if (newDataMap[maxCriteria]) {
          if (newDataMap[maxCriteria][field]) {
            newDataMap[maxCriteria][field] += val;
          } else {
            newDataMap[maxCriteria][field] = val;
          }
        } else {
          newDataMap[maxCriteria] = { [field]: val };
        }
      }
      // just save
      else {
        if (newDataMap[d.criteria]) {
          newDataMap[d.criteria][field] = val;
        } else {
          newDataMap[d.criteria] = {[field]: val}
        }
      }
    })
  });

  const data = [];

  for (let i = minCriteria; i <= maxCriteria; i++) {
    const aObj = oldDataMap[i];
    const bObj = newDataMap[i];

    // if pre and post objects, merge together
    if (aObj && bObj) {
      data.push({
        ...aObj,
        ...bObj
      });
    }
    // if only pre, but no post, then set all fields in pre to 0
    else if (aObj) {
      keys.filter(key => key !== 'sum')
        .concat(['current'])
        .forEach(key => {
          aObj[key] = 0;
        });
      data.push(aObj);
    }
    // if new criteria in post policy, then just set sum to 0 and push
    else if (bObj) {
      data.push({
        criteria: i,
        sum: 0,
        ...bObj
      });
    }
  }

  return data;
}

/**
 * Merges all children nodes together by summing up all numeric fields
 * @param {Array} children array of leaf nodes' data
 */
export function sumBins(children) {
  const maxCriteria = max(children, d => max(d, x => x.criteria));
  const minCriteria = min(children, d => min(d, x => x.criteria));

  const maxFieldChild = children[0].slice().sort((a, b) => {
    return Object.keys(b).length - Object.keys(a).length;
  })[0];

  const keys = Object.keys(maxFieldChild).filter(key => key !== 'criteria');

  const maps = {};
  
  children.forEach((arr, i) => {
    maps[i] = {};
    
    arr.forEach(d => {
      maps[i][d.criteria] = d;
    })
  });

  const data = [];
  
  for (let i = minCriteria; i <= maxCriteria; i++) {
    let obj = { criteria: i };  
    
    for (let j = 0; j < children.length; j++) {
      const child = maps[j][i] || {};

      keys.forEach(key => {
        if (child[key]) {
          
          if (isNaN(child[key])) {
            obj[key] = child[key];
          } else if (obj[key]) {
            obj[key] += child[key];
          } else {
            obj[key] = child[key];
          }
          
        }
      })
    }
     
    if (obj.hasOwnProperty("sum")) {
      data.push(obj);
    }
  }
  
  return data;
}