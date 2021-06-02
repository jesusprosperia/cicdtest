import * as types from './mutation-types';
import * as mainTypes from '../../mutation-types';
import * as adminTypes from '../admin/mutation-types';
import axios from '@/plugins/axios';
import {saveUser, clearUser, changeThemeVars} from './user';

import router from '@/router';
import Vue from 'vue';
import {getRoutePath} from '@/utils/user';

export const login = ({ commit }, form) => {
  return axios.post('/api/users/login', form).then(res => {
    const token = res.headers['x-auth'];
    const user = { ...res.data, token };
    axios.defaults.headers.common['x-auth'] = token;

    commit(types.SET_USER, user);
    changeThemeVars(user);
    saveUser(user);

    if (user.added_by_admin) {
      Vue.prototype.$flashStorage.flash('Please change password', 'info', { timeout: 3000 });
      router.push('/change-password');
    } else {
      router.push(getRoutePath(user));
    }
  })
  .catch(() => {
    commit(mainTypes.SET_ERROR_MESSAGE, 'Username or Password is incorrect');

    setTimeout(() => {
      commit(mainTypes.SET_ERROR_MESSAGE, null);
    }, 3000);
  });
}

export const logout = ({ commit }) => {
  const callback = () => {
    clearUser();
    commit(types.SET_USER, null);
    commit(adminTypes.SET_USER_FROM_ADMIN, null);
    router.push('/login');
  }
  return axios.delete('/api/users/logout').then(callback).catch(callback);
}

export const changePassword = ({commit}, password) => {
  return axios.post('/api/users/change-password', {password}).then(() => {
    Vue.prototype.$flashStorage.flash('Password Changed, please login.', 'success', { timeout: 3000 });

    clearUser();
    commit(types.SET_USER, null);

    setTimeout(() => {
      router.push('/login');
    }, 1000);
  }).catch(e => {
    Vue.prototype.$flashStorage.flash(e.message, 'error', { timeout: 3000 });
  });
}

export const resetPassword = ({ commit }, form) => {
  if (form.token) {
    return axios.post('/api/users/reset/' + form.token, form).then(res => {
      if (res.status == 200) {
        commit(mainTypes.SET_RESET_MESSAGE, res.data);

        setTimeout(() => {
          commit(mainTypes.SET_RESET_MESSAGE, '');
          router.push('/');
        }, 1500);
      }
    }).catch(e => {
      Vue.prototype.$flashStorage.flash(e.message, 'error', { timeout: 3000 });
    });
  }
}

export const sendResetConfirmation = ({ commit }, email) => {
  return axios.post('/api/users/forgot', {
    email: email,
    redirectUrl: location.origin
  }).then(res => {
    if (res.status == 200) {
      commit(mainTypes.SET_RESET_MESSAGE, res.data);
    }
  })
}

export const fetchOrgs = ({ commit }, payload) => {
  commit(mainTypes.SET_DATA_LOADING, true);
  commit(types.SET_ORGS, []);
  return axios.post('/api/orgs/list', payload).then(({ data }) => {
    commit(types.SET_ORGS, data);
    commit(mainTypes.SET_DATA_LOADING, false);
  }).catch(e => {
    console.error(e);
    commit(mainTypes.SET_DATA_LOADING, false);
  })
}

export const addOrg = async ({ commit }, { org, image_file, profile_img_url }) => {
  commit(mainTypes.SET_DATA_LOADING, true);

  if (image_file) {
    var resp = await axios.post('/api/users/upload-image', image_file);
    org.attrs.logo_url = resp.data.file;
  }

  if (profile_img_url) {
    var resp1 = await axios.post('/api/users/upload-image', profile_img_url);
    org.attrs.profile_img_url = resp1.data.file;
  }

  return axios.post('/api/orgs', org).then((resp) => {
    commit(types.ADD_ORG, resp.data);
    Vue.prototype.$flashStorage.flash('Organization added', 'success', { timeout: 3000 });
    commit(mainTypes.SET_DATA_LOADING, false);
  }).catch(e => {
    console.error(e);
    Vue.prototype.$flashStorage.flash('Error', 'error', { timeout: 3000 });
    commit(mainTypes.SET_DATA_LOADING, false);
  });
}

export const editOrg = async ({ commit, state }, { org_id, org, image_file, profile_img_url }) => {
  commit(mainTypes.SET_DATA_LOADING, true);

  if (image_file) {
    var resp1 = await axios.post('/api/users/upload-image', image_file);
    org.attrs.logo_url = resp1.data.file;
  }

  if (profile_img_url) {
    var resp = await axios.post('/api/users/upload-image', profile_img_url);
    org.attrs.profile_img_url = resp.data.file;
  }

  return axios.put('/api/orgs', org).then(() => {
    const orgIndex = state.orgs.findIndex(d => d._id === org_id);
    if (orgIndex > -1) {
      const newOrgs = [...state.orgs];
      newOrgs[orgIndex] = org;
      commit(types.SET_ORGS, newOrgs);
    }
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash('Organization updated', 'success', { timeout: 3000 });
  }).catch(e => {
    console.error(e);
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash('Error', 'error', { timeout: 3000 });
  })
}

export const deleteOrg = ({ commit, state }, org_id) => {
  commit(mainTypes.SET_DATA_LOADING, false);
  return axios.delete('/api/orgs', {data: { org_id }}).then(() => {
    const orgs = [...state.orgs].filter(d => d._id !== org_id);
    commit(types.SET_ORGS, orgs);
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash('Organization deleted', 'success', { timeout: 3000 });
  }).catch(e => {
    console.error(e);
    commit(mainTypes.SET_DATA_LOADING, false);
    Vue.prototype.$flashStorage.flash('Error', 'error', { timeout: 3000 });
  })  
}