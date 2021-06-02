import mutations from "./mutations";
import * as actions from "./actions";
import * as getters from "./getters";

const state = {
  budgetSum: null,
  chunkSize: 100,
  currentSchemeId: null,
  currentSchemeName: null,

  targetScheme: null,
  targetCollection: null,

  schemeList: [],
  collectionList: [],
};

export default {
  state,
  getters,
  actions,
  mutations
};
