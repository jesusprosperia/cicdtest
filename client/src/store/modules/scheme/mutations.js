import * as types from './mutation-types';

const mutations = {
  [types.SET_BUDGET_SUM](state, budgetSum) {
    state.budgetSum = budgetSum;
  },
  [types.SET_MON_COST_VALUE](state, value) {
    if (state.config.mon_cost) {
      state.config.mon_cost.value = value 
    }
  },
  [types.SET_CURRENT_SCHEME_ID](state, scheme_id) {
    state.currentSchemeId = scheme_id;
  },
  [types.SET_CURRENT_SCHEME_NAME](state, scheme_name) {
    state.currentSchemeName = scheme_name;
  },
  [types.SET_SCHEME_LIST](state, schemes) {
    state.schemeList = schemes;
  },
  [types.SET_COLLECTION_LIST](state, collections) {
    state.collectionList = collections
  },
  [types.SET_TARGET_SCHEME](state, targetScheme) {
    state.targetScheme = targetScheme;
  },
  [types.SET_TARGET_COLLECTION](state, targetCollection) {
    state.targetCollection = targetCollection;
  }
}

export default mutations;