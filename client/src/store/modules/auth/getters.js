import { state as adminState } from '../admin/index';

export const userSettings = (state) => {
  var user = state.user;
  return user && user.org.attrs;
}

// is main user logged in?
export const isLoggedIn = (state) => {
  var user = state.user;

  if (user) {
    return user && user.token;
  }

  return false;
}

// the user that is being viewed, 
// might be main user that is logged in or user browsed by admin
export const currentUser = (state) => {
  if (adminState.userFromAdmin) {
    return adminState.userFromAdmin;
  }
  return state.user;
}

export const userPermissions = (state) => {
  var user = state.user;
  return user.permissions;
}

export const showOrgPage = (state) => {
  if (adminState.userFromAdmin) {
    return false;
  }
  var user = state.user;
  return user && (user.type === "admin" || user.type === "super_admin")
}