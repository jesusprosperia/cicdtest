import mutations from "./mutations";
import * as actions from "./actions";
import * as getters from "./getters";

const user_lang = localStorage.getItem('user_lang');
const translations = JSON.parse(localStorage.getItem('translations'));
const userTrans = user_lang && translations ? translations[user_lang] : null;

const state = {
  userTrans: userTrans,
  translations: translations,
  lang: user_lang || 'EN',
  allLangs: ['EN', 'ES', 'KA']
};

if (!user_lang) {
  localStorage.setItem('user_lang', state.lang);
}

export default {
  state,
  getters,
  actions,
  mutations
};
