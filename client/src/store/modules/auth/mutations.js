import * as types from './mutation-types';

const mutations = {
  [types.SET_USER](state, user) {
    state.user = user;
  },
  [types.SET_ORGS](state, orgs) {
    state.orgs = orgs;
  },
  [types.ADD_ORG](state, org) {
    state.orgs = [
      ...state.orgs,
      org,
    ]
  }
}

export default mutations;