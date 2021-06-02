import * as types from './mutation-types';

const mutations = {
  [types.SET_REQUEST_POLICIES](state, requestPolicies) {
    state.requestPolicies = requestPolicies;
  }
}

export default mutations;