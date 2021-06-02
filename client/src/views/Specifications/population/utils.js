import {isArrayEqual} from '@/utils/array';
import _ from 'lodash';

export const schemeChanged = function(newScheme, oldScheme) {
  // if first save..
  if (oldScheme == null && newScheme) {
    return true;
  }

  var scheme = oldScheme;

  // collection
  if (scheme.collection != newScheme.collection) {
    return true;
  }

  // criterias
  if (!isArrayEqual(scheme.criterias, newScheme.criterias)) {
    return true;
  }

  // matchCase. This also includes filters check. 
  if (!_.isEqual(scheme.matchCase, newScheme.matchCase)) {
    return true;
  }

  // policies
  if (newScheme.policies.length !== oldScheme.policies.length) {
    return true;
  } else if (newScheme.policies.length === oldScheme.policies.length) {
    const diff = oldScheme.policies.filter((d, i) => {
      return !_.isEqual(d, newScheme.policies[i]);
    }).map(d => d.id);

    return diff.length ? diff : false;
  }

  return false;
};