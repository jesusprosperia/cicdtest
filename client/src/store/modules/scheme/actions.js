import * as types from './mutation-types';
import * as mainTypes from '../../mutation-types';
import axios from '@/plugins/axios';
import Vue from 'vue';

export const getBudgetSum = ({ commit }, data) => {
  commit(types.SET_BUDGET_SUM, null);

  return axios.post('/api/compute/get-sum', data).then(res => {
    var value = 0;

    if (res.data) {
      if (res.data.length) {
        value = Math.round(res.data[0].sum);
        commit(types.SET_BUDGET_SUM, value);
      } else {
        commit(types.SET_BUDGET_SUM, 0);
      }
    }
    return value;
  })
}

export const removeTargetingScheme = ({ commit }, { scheme_id, user_id }) => {
  commit(mainTypes.SET_DATA_LOADING, true);

  return axios.post(
    '/api/schemes/remove-scheme-or-col', 
    { 
      user_id: user_id, 
      schemes: [scheme_id] 
    }
  ).then(({ data }) => {
    commit(types.SET_SCHEME_LIST, data.schemes);
    commit(types.SET_COLLECTION_LIST, data.collections);
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash('Deleted', 'success', { timeout: 3000 });
  }).catch(e => {
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash(e.message, 'error', { timeout: 3000 });
  });
}

export const removeCollection = ({ commit }, { collection, user_id }) => {  
  commit(mainTypes.SET_DATA_LOADING, true);

  return axios.post(
    '/api/schemes/remove-scheme-or-col', 
    { 
      user_id: user_id, 
      collections: [collection]
    }
  ).then(({ data }) => {
    commit(types.SET_SCHEME_LIST, data.schemes);
    commit(types.SET_COLLECTION_LIST, data.collections);
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash('Deleted', 'success', { timeout: 3000 });
  }).catch(e => {
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash(e.message, 'error', { timeout: 3000 });
  });
}

export const saveScheme = ({ commit }, scheme) => {
  commit(mainTypes.SET_DATA_LOADING, true)

  return axios.post('/api/schemes/save-scheme', scheme).then(() => {

    commit(types.SET_TARGET_SCHEME, scheme.scheme);
    commit(mainTypes.SET_DATA_LOADING, false);

    Vue.prototype.$flashStorage.flash('Scheme Saved', 'success', { timeout: 3000 });
  }).catch(() => {
    commit(mainTypes.SET_DATA_LOADING, false)
    Vue.prototype.$flashStorage.flash('Error', 'error', { timeout: 3000 });
  });
}

export const addSchemeOrCol = ({ commit, state }, payload) => {
  commit(mainTypes.SET_DATA_LOADING, true)

  return axios.post('/api/schemes/add-scheme-or-col', payload).then(() => {

    if (payload.collection) {
      commit(types.SET_TARGET_COLLECTION, payload.collection);
      commit(types.SET_COLLECTION_LIST, [
        ...state.collectionList,
        { 
          collection: payload.collection.collection, 
          name: payload.collection.name 
        }
      ]);
    }

    if (payload.scheme) {
      commit(types.SET_TARGET_SCHEME, payload.scheme);
      commit(types.SET_SCHEME_LIST, [
        ...state.schemeList,
        { 
          id: payload.scheme.id, 
          name: payload.scheme.name 
        }
      ]);
    }

    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash('Scheme Saved', 'success', { timeout: 3000 });
  }).catch(() => {
    commit(mainTypes.SET_DATA_LOADING, false)
    Vue.prototype.$flashStorage.flash('Error', 'error', { timeout: 3000 });
  });
}

export const getScheme = ({ commit }, { scheme_id, user_id }) => {
  commit(mainTypes.SET_DATA_LOADING, true);
  commit(types.SET_TARGET_SCHEME, null);

  axios.post("/api/schemes/get-scheme", {
    user_id: user_id,
    scheme_id: scheme_id,
  }).then(({ data }) => {
    commit(types.SET_TARGET_COLLECTION, data.collection);
    commit(types.SET_TARGET_SCHEME, data.scheme);
    commit(mainTypes.SET_DATA_LOADING, false);
    commit(types.SET_CURRENT_SCHEME_ID, scheme_id);
    commit(types.SET_CURRENT_SCHEME_NAME, data.scheme.name);
  }).catch(() => {
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash('Error', 'error', { timeout: 3000 });
  });
}

export const getCollection = ({ commit }, { collection, user_id }) => {
  commit(mainTypes.SET_DATA_LOADING, true);
  commit(types.SET_TARGET_COLLECTION, null);

  return axios.post("/api/schemes/get-collection", {
    user_id: user_id,
    collection: collection,
  }).then(({ data }) => {
    commit(types.SET_TARGET_COLLECTION, data);
    commit(mainTypes.SET_DATA_LOADING, false);
    return data;
  }).catch(() => {
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash('Error', 'error', { timeout: 3000 });
  });
}

export const browsePopulationPage = ({ commit, state }, { id, name }) => {
  if (state.currentSchemeId !== id) {
    commit(types.SET_TARGET_COLLECTION, null);
    commit(types.SET_TARGET_SCHEME, null);
  }

  commit(types.SET_CURRENT_SCHEME_ID, id);
  commit(types.SET_CURRENT_SCHEME_NAME, name);
}

export const copyUserSchemes = ({ commit }, {
  userFromId, 
  userToId, 
  selectedSchemeIds
}) => {
  commit(mainTypes.SET_DATA_LOADING, true);

  return axios.post('/api/schemes/copy-schemes', {
    userFromId, 
    userToId, 
    selectedSchemeIds
  }).then(() => {
    commit(mainTypes.SET_DATA_LOADING, false);
    return true;
  }).catch(() => {
    commit(mainTypes.SET_DATA_LOADING, false);
    return false;
  })
}

// new endpoints
export const listSchemes = ({ commit }, ref_id) => {
  commit(mainTypes.SET_DATA_LOADING, true);
  commit(types.SET_SCHEME_LIST, []);
  commit(types.SET_COLLECTION_LIST, []);

  return axios.post('/api/schemes/list-schemes', { user_id: ref_id }).then(({ data }) => {
    commit(types.SET_SCHEME_LIST, data.schemes);
    commit(types.SET_COLLECTION_LIST, data.collections);
    commit(mainTypes.SET_DATA_LOADING, false);
  }).catch(() => {
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash('Error', 'error', { timeout: 3000 });
  });
}