import mutations from "./mutations";
import * as actions from "./actions";
import * as getters from "./getters";

export const state = {
  users: [],
  userFromAdmin: null,
};

export default {
  state,
  getters,
  actions,
  mutations
};
