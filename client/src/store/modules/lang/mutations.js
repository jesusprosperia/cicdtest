import * as types from './mutation-types';

const mutations = {
  [types.SET_LANG](state, lang) {
    state.lang = lang;
  },
  [types.SET_USER_TRANSLATIONS](state) {
    state.userTrans = state.translations[state.lang];
  },
  [types.SET_TRANSLATIONS](state, translations) {
    state.translations = translations
  },
  [types.SET_ALL_LANGS](state, langs) {
    state.allLangs = langs;
  }
}

export default mutations;