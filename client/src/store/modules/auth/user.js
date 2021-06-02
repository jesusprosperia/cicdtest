import { color } from 'd3-color';

export const saveUser = (user) => {
  localStorage.setItem('current-user', JSON.stringify(user));
}

export const clearUser = () => {
  localStorage.removeItem('current-user');
}

export const getUser = () => {
  return JSON.parse(localStorage.getItem('current-user'));
}

export const changeThemeVars = (user) => { 
  let root = document.documentElement;

  if (user && user.settings) {
    let { primary_color, secondary_color } = user.settings;

    if (!primary_color) primary_color = '#2c3e50';
    if (!secondary_color) secondary_color = '#28a745';

    const secondary_shadow = color(secondary_color);
    secondary_shadow.opacity = 0.25;

    root.style.setProperty('--primary-color', primary_color);
    root.style.setProperty('--secondary-color', secondary_color);
    root.style.setProperty('--secondary-shadow', secondary_shadow.toString())
  }
}