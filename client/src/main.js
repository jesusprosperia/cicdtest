import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import VueFlashMessage from 'vue-flash-message';
import Dialog from 'bootstrap-vue-dialog';
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'

import {formatNumber, thousandFormat} from '@/utils/formatters';
import Notifications from 'vue-notification';
import tippy from "tippy.js";
import svgSpriteLoader from '@/utils/sprite-loader';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue/dist/bootstrap-vue.min.css';
import 'vue-range-component/dist/vue-range-slider.css';
import "vue-multiselect/dist/vue-multiselect.min.css";
import 'vue-flash-message/dist/vue-flash-message.min.css';
import 'tippy.js/themes/light-border.css';
import 'vue-slider-component/theme/default.css';

// inject icons for text editor in specifications page
const __svg__ = { path: './assets/icons/*.svg', name: 'assets/[hash].sprite.svg' }
svgSpriteLoader(__svg__.filename);

Vue.use(BootstrapVue)
Vue.use(BootstrapVueIcons)
Vue.use(Dialog);

Vue.use(VueFlashMessage, {
  messageOptions: {
    timeout: 3000,
    pauseOnInteract: true
  }
});

Vue.use(Notifications);

Vue.prototype.$tippy = tippy;
Vue.prototype.$tippy.setDefaults({
  theme: 'light-border',
  arrow: true,
  distance: 0,
  delay: 0,
  placement: 'right'
})

Vue.config.productionTip = false;

Vue.filter('format', function(num) {
  return formatNumber(num)
});

Vue.filter('formatThousand', function(num) {
  return thousandFormat(num)
});

window.tooltips = [];

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
