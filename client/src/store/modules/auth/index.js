import mutations from "./mutations";
import * as actions from "./actions";
import * as getters from "./getters";

import {getUser, changeThemeVars} from './user';

const user = getUser();

changeThemeVars(user);

const state = {
  user: user,
  orgs: null,
};

export default {
  state,
  getters,
  actions,
  mutations
};
