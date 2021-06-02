import loadSheet from '@/plugins/sheet';
import * as types from './mutation-types';

export const fetchTranslations = async ({ commit }) => {
  const sheet = await loadSheet();
  
  const translations = sheet['translations'];
  const columns = translations.columnNames;
  const elements = translations.elements;
  const availableLangs = columns.filter(d => d.includes('Label')).map(d => d.split('_')[1]);
  const pageTranslations = {};

  availableLangs.forEach(a => pageTranslations[a] = {});

  elements.forEach(d => {
    availableLangs.forEach(a => {
      pageTranslations[a][d.Field] = d['Label_' + a];
    })
  })

  commit(types.SET_ALL_LANGS, availableLangs);
  commit(types.SET_TRANSLATIONS, pageTranslations);
  commit(types.SET_USER_TRANSLATIONS);

  localStorage.setItem('translations', JSON.stringify(pageTranslations));
}

export const changeLang = ({ commit }, lang) => {
  commit(types.SET_LANG, lang);
  commit(types.SET_USER_TRANSLATIONS);

  localStorage.setItem('user_lang', lang);
}