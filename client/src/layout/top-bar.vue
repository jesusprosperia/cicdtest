<template>
  <div class="top-bar">
    <b-navbar type="dark">
      <div class="side left">
        <!-- LOGO -->
        <div class="brand-logo" v-if="
          currentView === 'scenarios' || 
          currentView === 'specifications' || 
          currentView === 'tree'
        ">
          <img class="logo" :src="userSettings.logo_url" />
        </div>
          
        <!-- orgs -->
        <template v-if="showOrgPage">
          <b-button 
            size="sm"
            class="icon-btn"
            variant="primary-outline"
            to="/orgs"
          >
            <img :src="require('@/assets/grid-fill.svg')" />
          </b-button>
        </template>

        <!-- scenarios -->
        <template v-if="
          currentView === 'scenarios' || 
          currentView === 'specifications' || 
          currentView === 'tree'
        ">
          <span class="arrow" v-if="showOrgPage"></span>
          <b-button
            size="sm"
            variant="primary-outline"
            class="icon-btn"
            :to="baseUrl"
          >
            <img :src="require('@/assets/house-door-fill.svg')" />
          </b-button>
        </template>

        <!-- specifications -->
        <template v-if="
          currentView === 'specifications' || 
          currentView === 'tree'
        ">
          <span class="arrow"></span>
          <b-button
            size="sm"
            variant="primary-outline"
            class="icon-btn"
            :disabled="!userPermissions.update_schemes"
            :to="userPermissions.update_schemes  ? `${baseUrl}/specifications/${scheme_id}` : null"
          >
            <img :src="require('@/assets/gear-fill.svg')" />
          </b-button>
        </template>

        <!-- tree -->
        <template v-if="currentView === 'tree'">
          <span class="arrow"></span>
          <b-button
            size="sm"
            variant="primary-outline"
            class="icon-btn"
            :to="`${baseUrl}/tree/${scheme_id}`"
          >
            <img :src="require('@/assets/bar-chart-line-fill.svg')" />
          </b-button>
        </template>
      </div>

      <div class="side middle text-center text-white text-small">
        {{ currentView === "tree" ? schemeName : "" }}
      </div>

      <div class="side right">
        <b-dropdown
          right
          size="sm"
          variant="link" 
          toggle-class="text-decoration-none" 
          no-caret
        >
          <template #button-content>
            <div class="user-logo">
              <img class="logo" :src="require('@/assets/globe.svg')" />
            </div>
          </template>

          <b-dropdown-item
            v-for="(d, i) in allLangs"
            :key="i"
            :active="d === userLang"
            @click="changeLang(d)"
          >
            {{ d }}
          </b-dropdown-item>
        </b-dropdown>

        <b-dropdown
          right
          class="ml-1"
          size="sm"  
          variant="link" 
          toggle-class="text-decoration-none" 
          no-caret
        >
          <template #button-content>
            <div class="user-logo">
              <img class="logo" :src="require('@/assets/person-circle.svg')" />
            </div>
          </template>

          <b-dropdown-item disabled>
            {{ user.email }}
          </b-dropdown-item>

          <b-dropdown-item
            disabled
            v-for="(d, i) in dropDownSettings"
            :key="i"
          >
            {{ d.name }}: {{ d.value }}
          </b-dropdown-item>

          <div class="dropdown-divider"></div>

          <b-dropdown-item href="#" @click.prevent="logout()">
            {{ userTrans.log_out }}
          </b-dropdown-item>
        </b-dropdown>
      </div>
    </b-navbar>
  </div>
</template>

<script>
import { mapActions, mapState, mapGetters } from "vuex";

export default {
  computed: {
    scheme_id() {
      return this.$route.params.scheme_id;
    },
    ref_id() {
      return this.$route.params.ref_id;
    },
    baseUrl() {
      return `/scenarios/${this.ref_id}`;
    },
    currentView() {
      return this.$route.name;
    },
    ...mapGetters([ "userPermissions", "userSettings", "showOrgPage" ]),
    ...mapState({
      schemeName: (state) => state.scheme.currentSchemeName,
      user: (state) => state.auth.user,
      allLangs: (state) => state.lang.allLangs,
      userTrans: (state) => state.lang.userTrans,
      userLang: (state) => state.lang.lang,
    }),
    dropDownSettings() {
      return [
        "max_dataset_size",
        "max_datasets", 
        "max_targeting_schemes"
      ].map((key) => {
        return {
          name: key === "max_dataset_size" ? key + " mb" : key,
          value: this.userSettings[key],
        };
      });
    },
  },
  methods: {
    ...mapActions(["changeLang"]),
    ...mapActions(["logout"]),
  },
};
</script>

<style lang="scss">
.top-bar {
  background: var(--primary-color);
  height: 57px;
  position: fixed;
  width: 100%;
  z-index: 10;

  .text-small {
    font-size: 0.9rem;
  }

  .icon-btn {
    img {
      width: 24px;
      height: 24px;
    }
  }

  .side {
    flex-grow: 1;
    display: flex;
    align-items: center;
  }

  .side.right {
    justify-content: flex-end;
  }

  .navbar {
    height: 100%;
  }

  .arrow {
    height: 16px;
    width: 16px;
    background-image: url("../assets/arrow-right.svg");
    background-repeat: no-repeat;
    background-position-y: center;
    background-position-x: center;
  }

  .brand-logo {
    height: 36px;
    margin-right: 15px;

    .logo {
      height: 100%;
    }
  }

  .user-logo {
    height: 32px;

    .logo {
      height: 100%;
    }
  }

  .b-dropdown {
    button {
      padding: 0.25rem;
    }
  }
}
</style>