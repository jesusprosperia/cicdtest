import * as types from './mutation-types';
import * as mainTypes from '../../mutation-types';
import * as authTypes from '../auth/mutation-types';
import axios from '@/plugins/axios';
import { changeThemeVars, saveUser } from '../auth/user';
import router from '@/router';
import Vue from 'vue';
import {getRoutePath} from '@/utils/user';

export const listUsers = ({ commit }, payload) => {
  commit(types.SET_USERS, []);
  return axios.post('/api/users/list-users', payload).then(res => {
    commit(types.SET_USERS, res.data);
  }).catch((e) => {
    console.log(e.message);
  })
}

export const createUser = ({ commit, state }, form) => {
  commit(mainTypes.SET_DATA_LOADING, true);
  return axios.post('/api/users', form).then(res => {
    const user = res.data;
    commit(types.SET_USERS, [ ...state.users, user ]);
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash('User added', 'success', { timeout: 3000 });
    return user;
  }).catch((e) => {
    commit(mainTypes.SET_DATA_LOADING, false);
    const err = JSON.parse(e.request.response);
    Vue.prototype.$flashStorage.flash(err.errmsg, 'error', { timeout: 3000 });
  });
}

export const updateUser = ({ commit, state, rootState }, form) => {
  commit(mainTypes.SET_DATA_LOADING, true);
  return axios.put('/api/users', form).then(({ data: user }) => {
    const userIndex = state.users.findIndex(d => d._id === user._id);
    const users = [...state.users];

    if (userIndex > -1) {
      users[userIndex] = user;
    }
    
    commit(types.SET_USERS, users);
    commit(mainTypes.SET_DATA_LOADING, false);

    // if updating current logged in user, update it in the store
    if (rootState.auth.user._id === user._id) {
      const usr = {
        ...rootState.auth.user,
        ...user,
      };
      commit(authTypes.SET_USER, usr);
      saveUser(usr);
    }

    Vue.prototype.$flashStorage.flash('User updated', 'success', { timeout: 3000 });
    return form;
  }).catch((e) => {
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash(e.message, 'error', { timeout: 3000 });
  });
}

export const deleteUser = ({ state, commit }, user_id) => {
  commit(mainTypes.SET_DATA_LOADING, true)
  Promise.all([
    axios.delete('/api/users', {data: {user_id}}),
    axios.delete('/api/schemes/delete-scheme', {data: {user_id}})
  ])
  .then(() => {
    const users = state.users.filter(d => d._id !== user_id);
    commit(types.SET_USERS, users);
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash('User deleted', 'success', { timeout: 3000 });
    return true;
  }).catch((e) => {
    commit(mainTypes.SET_DATA_LOADING, false);
    const err = JSON.parse(e.request.response);
    Vue.prototype.$flashStorage.flash(err.errmsg, 'error', { timeout: 3000 });
    return false;
  })
}

export const browseUser = ({ commit, rootState }, user) => {
  var userId = user._id;
  var mainUser = rootState.auth.user;

  changeThemeVars(user);

  // if the user is not admin itself
  if (mainUser._id === userId) {
    // clear it
    commit(types.SET_USER_FROM_ADMIN, null);
    router.push(getRoutePath(user));
  } else  {
    // save the user to be used in the user's page
    commit(types.SET_USER_FROM_ADMIN, user);
    router.push("/scenarios/" + userId);
  }
}