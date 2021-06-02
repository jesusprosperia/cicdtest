import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home";
import Login from "./views/Login";
import auth from "./middleware/auth";
import PasswordReset from "./views/PasswordReset";
import ChangePassword from "./views/ChangePassword";
// import Admin from "./views/Admin";
import store from "./store";
import NotFound from "@/views/NotFound";

Vue.use(Router);

const router = new Router({
  mode: "history",
  routes: [
    {
      path: "/",
      component: Home,
      meta: { requiresAuth: true },
      children: [
        {
          path: "/orgs",
          name: "orgs",
          component: () => import("./views/Orgs.vue"),
          meta: { requiresAuth: true, type: "admin" },
        },
        {
          path: "scenarios/:ref_id",
          name: "scenarios",
          props: true,
          component: () => import("./views/ManageDatasets/ManageDatasets.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "scenarios/:ref_id/specifications/:scheme_id",
          name: "specifications",
          component: () => import("./views/Specifications/Specifications.vue"),
          props: true,
          meta: { requiresAuth: true }
        },
        {
          path: "scenarios/:ref_id/tree/:scheme_id",
          name: "tree",
          component: () => import("./views/Tree/Tree.vue"),
          props: true,
          meta: { requiresAuth: true }
        }
      ]
    },
    {
      path: "/login",
      name: "login",
      component: Login
    },
    {
      path: "/reset",
      name: "pass-reset",
      component: PasswordReset
    },
    {
      path: "/change-password",
      name: "pass-change",
      component: ChangePassword
    },
    // {
    //   path: "/admin",
    //   name: "admin-panel",
    //   component: Admin,
    //   meta: {
    //     requiresAuth: true,
    //     type: "admin"
    //   }
    // },
    {
      path: "*",
      name: "e404",
      component: NotFound
    }
  ],
  scrollBehavior () {
    return { x: 0, y: 0 }
  }
});

router.beforeEach((to, from, next) => { 

  if (to.path === "/" && store.getters.isLoggedIn) {
    if (store.getters.showOrgPage) {
      if (from.path !== "/orgs") {
        return next("/orgs");
      }
    } else {
      const user = store.state.auth.user;
      const userUrl = "/scenarios/" + user._id;
      if (from.path !== userUrl) {
        return next(userUrl);
      }
    }
  }

  if (to.meta.requiresAuth) {
    auth({ next, to });
  } else {
    next();
  }
});

export default router;
