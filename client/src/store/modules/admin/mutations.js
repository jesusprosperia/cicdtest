import * as types from './mutation-types';

const mutations = {
  [types.SET_USERS](state, users) {
    state.users = users;
  },
  [types.SET_USER_FROM_ADMIN](state, user) {
    state.userFromAdmin = user;
  },
  [types.ADD_USER](state, user) {
    state.users.push(user);
  }
}

export default mutations;