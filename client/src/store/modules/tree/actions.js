import * as schemeTypes from '../scheme/mutation-types';
import * as mainTypes from '../../mutation-types';
import axios from '@/plugins/axios';
import Vue from 'vue';

export const saveAllTree = ({ commit, rootState }, payload) => {
  commit(mainTypes.SET_DATA_LOADING, true);

  const { user_id, states, active_tab } = payload;

  const targetScheme = rootState.scheme.targetScheme;

  if (targetScheme) {
    const cloneScheme = {...targetScheme};

    cloneScheme.active_tab = active_tab;

    cloneScheme.policies.forEach(d => {
      const state = states[d.id];

      d.tree_state = state.root;
      d.map_state = state.mapConfig;
      d.chart_view = state.chartView;
    })

    return axios.post('/api/schemes/save-scheme', { 
      user_id: user_id || rootState.auth.user._id, 
      scheme: cloneScheme 
    }).then(() => {
      
      commit(schemeTypes.SET_TARGET_SCHEME, cloneScheme);
  
      commit(mainTypes.SET_DATA_LOADING, false);
      Vue.prototype.$flashStorage.flash('All trees saved!', 'success', { timeout: 3000 });
    }).catch(() => {
      commit(mainTypes.SET_DATA_LOADING, false)
      Vue.prototype.$flashStorage.flash('Error', 'error', { timeout: 3000 });
    });
  } 

  return commit(mainTypes.SET_DATA_LOADING, false);
}