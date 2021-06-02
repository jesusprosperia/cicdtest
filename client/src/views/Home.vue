<template>
  <div class="home">
    <!-- Top Navigation Bar -->
    <top-bar></top-bar>
    
    <!-- Notification popups -->
    <flash-message class="flashpool"></flash-message>

    <b-container fluid class="content">
      <!-- Green alert box shown when logged in as other user -->
      <b-container v-if="userFromAdmin">
        <b-row>
          <b-col class="p-0">
            <b-alert variant="success" show class="mt-3 mb-0">
              You are logged in as <strong>{{userFromAdmin.email}}</strong>. 
              <a href="#" @click="browseUser(user)">exit</a>
            </b-alert>
          </b-col>
        </b-row>
      </b-container>

      <!-- router outlet -->
      <router-view></router-view>

    </b-container>
  </div>
</template>

<script>
import topBar from '@/layout/top-bar.vue';
import {mapState, mapActions} from 'vuex';

export default {
  components: {
    'top-bar': topBar
  },
  computed: {
    ...mapState({
      userFromAdmin: (state) => state.admin.userFromAdmin,
      user: state => state.auth.user,
    })
  },
  methods: {
    ...mapActions(["browseUser"])
  }
};
</script>

<style lang="scss" scoped>
.home {
  .content {
    padding-top: 57px;
    padding-left: 0px;
    padding-right: 0px;

    .main {
      overflow: hidden;
    }

    .budget-view-container {
      border-left: 1px solid #ddd;
    }
  }
}
</style>

