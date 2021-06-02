import Vue from 'vue'
import Vuex from 'vuex'
import auth from './modules/auth'
import admin from './modules/admin'
import lang from './modules/lang'
import scheme from './modules/scheme'
import tree from './modules/tree'
import * as types from './mutation-types'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    errorMessage: null,
    resetMessage: null,
    dataLoading: false,
  },
  mutations: {
    [types.SET_ERROR_MESSAGE](state, message) {
      state.errorMessage = message;
    },
    [types.SET_RESET_MESSAGE](state, message) {
      state.resetMessage = message;
    },
    [types.SET_DATA_LOADING](state, loading) {
      state.dataLoading = loading;
    },
  },
  actions: {},
  modules: {
    auth,
    admin,
    lang,
    scheme,
    tree
  }
});