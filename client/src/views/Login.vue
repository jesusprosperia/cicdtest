<template>
  <div class="landing-page" v-if="userTrans">
    <div class="w-50">
      <div class="headlines">
        <div>
          <img class="logo" src="@/assets/logo.png" />
        </div>
        <div class="description">{{ userTrans.secondary_header }}</div>
      </div>
    </div>
    <div class="w-50">
      <div class="login-form">
        <b-form-select
          size="sm"
          class="change-lang"
          :value="userLang"
          :options="allLangs"
          @change="changeLang"
        />

        <div v-if="view == 'reset'" class="reset-password">
          <div class="error-message" v-if="resetMessage">
            {{ resetMessage }}
          </div>

          <b-form @submit="onSubmitReset">
            <b-form-group
              :label="userTrans.email + ':'"
              label-for="reset-email"
            >
              <b-form-input
                id="reset-email"
                v-model="resetEmail"
                type="email"
                required
              />
            </b-form-group>

            <div class="mt-2 d-flex align-items-center">
              <b-button 
                class="w-50" 
                variant="outline-success" 
                type="submit"
              >Reset</b-button>

              <b-button
                class="w-50 ml-2"
                variant="outline-secondary"
                type="btn"
                @click="view = 'login'"
              >{{ userTrans.cancel_btn }}</b-button>
            </div>
          </b-form>
        </div>

        <div class="login-inner" v-else>
          <div class="error-message" v-if="errorMessage">
            {{ errorMessage }}
          </div>
          <div class="login-header">
            <div :class="`w-100 text-center ${view == 'login' ? 'active' : ''}`"
              @click="view = 'login'"
            >{{ userTrans.login }}</div>
          </div>
          <div class="login-body">
            <b-form @submit="onSubmitLogin" v-if="view == 'login'">
              <b-form-group
                :label="userTrans.email + ':'"
                label-for="login-email"
              >
                <b-form-input
                  id="login-email"
                  v-model="formLogin.email"
                  type="email"
                  required
                />
              </b-form-group>

              <b-form-group
                :label="userTrans.password + ':'"
                label-for="login-password"
              >
                <b-form-input
                  id="login-password"
                  v-model="formLogin.password"
                  type="password"
                  required
                />
              </b-form-group>

              <div class="mt-2 d-flex align-items-center">
                <b-button
                  class="w-50 mt-2"
                  variant="outline-success"
                  type="submit"
                >{{ userTrans.login }}</b-button>

                <b-link 
                  href="#" 
                  class="ml-4" 
                  @click="view = 'reset'"
                >{{ userTrans.forgot_password }}?</b-link>
              </div>
            </b-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  name: "landing",
  data() {
    return {
      resetEmail: "",
      view: "login",
      formLogin: {
        email: "",
        password: "",
      },
      formSignUp: {
        email: "",
        password: "",
        confirmPassword: "",
      },
    };
  },
  computed: {
    ...mapState({
      errorMessage: (state) => state.errorMessage,
      resetMessage: (state) => state.resetMessage,
      allLangs: (state) => state.lang.allLangs,
      userTrans: (state) => state.lang.userTrans,
      userLang: (state) => state.lang.lang
    }),
  },
  methods: {
    ...mapActions(["login", "sendResetConfirmation"]),
    ...mapActions(["changeLang"]),
    onSubmitLogin(evt) {
      evt.preventDefault();

      if (this.formLogin.password != "") {
        this.login(this.formLogin);
      }
    },
    onSubmitReset(evt) {
      evt.preventDefault();

      if (this.resetEmail != "") {
        this.sendResetConfirmation(this.resetEmail);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.landing-page {
  height: 100%;
  display: flex;
  color: #01183c;
  position: relative;

  .change-lang {
    position: absolute;
    right: 0px;
    top: -32px;
    width: 100px;
  }

  & > div {
    height: 100%;
  }

  .logo {
    width: 50%;
  }

  .headlines {
    text-align: center;
    margin-top: 50px;
    padding-top: 100px;
    font-weight: bold;
    color: #a6a6a6;

    .description {
      font-size: 20px;
    }
  }

  .login-form {
    position: relative;
    background-color: #fff;
    padding: 30px;
    border-radius: 5px;
    margin-right: 50px;
    margin-top: 50px;
    height: calc(100% - 100px);
    -webkit-box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);
    -moz-box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);
    box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);

    .error-message {
      color: red;
      padding: 10px;
    }

    .login-header {
      border-bottom: 1px solid #ddd;
      display: flex;
      margin-bottom: 20px;
      padding: 0px 10px;

      & > div {
        cursor: pointer;
      }

      & > div.active {
        border-bottom: 1.5px solid #28a745;
      }
    }

    .login-inner,
    .reset-password {
      width: 360px;
      margin: auto;
      margin-top: 50%;
      transform: translateY(-50%);
    }
  }
}
</style>
