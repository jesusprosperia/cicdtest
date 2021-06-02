<template>
  <div id="app" class="app">
    <!-- Loader -->
    <div class="loader-container" v-if="dataLoading">
      <div class="loader">
        <div class="loader--dot"></div>
        <div class="loader--dot"></div>
        <div class="loader--dot"></div>
        <div class="loader--dot"></div>
        <div class="loader--dot"></div>
        <div class="loader--dot"></div>
        <div class="loader--text"></div>
      </div>
    </div>

    <router-view />
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';

export default {
  methods: {
    ...mapActions([ 'fetchTranslations' ])
  },
  computed: {
    ...mapState({
      dataLoading: state => state.dataLoading,
    })
  },
  created () {
    this.fetchTranslations();
  }
}
</script>


<style lang="scss">
@import url('./styles/main.css');
.loader-container {
  position: fixed;
  pointer-events: all !important;
  top: 0px;
  left: 0px;
  height: 100%;
  width: 100%;
  z-index: 1200;
  background-color: rgba(44, 62, 80, 0.44);
  overflow: hidden;
}
</style>
