<template>
  <div class="table-container">
    <table class="users-table table table-sm">
      <thead>
        <tr>
          <th>Email</th>
          <th>Type</th>
          <th>Org</th>
          <th>Admin Rights</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(user) in users" :key="user._id" class="table-row">
          <td class="cell">{{user.email}}</td>
          <td class="cell">{{user.type}}</td>
          <td class="cell">{{orgMap.get(user.org_id)}}</td>
          <td class="cell">{{getAdminRights(user)}}</td>
          <td class="cell">
            <div class="d-flex align-items-center justify-content-end">
              <div class="icon mr-2" @click="goToUsersProfile(user)">
                <img src="@/assets/go_to.png" />
              </div>
              <div 
                class="icon" 
                @click="onUserDelete(user)" 
                v-if="canDeleteUser(user)"
              >
                <img src="@/assets/delete.svg" />
              </div>
              <div 
                class="icon" 
                v-if="canUpdateUser(user)"
              >
                <b-button
                  size="sm"
                  class="dots-icon"
                  variant="primary-outline"
                  @click="onMoreClick(user)"
                >
                  <b-icon icon="three-dots-vertical"></b-icon>
                </b-button>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <b-button
      v-if="userPermissions.create_users"
      class="button-add"
      variant="success"
      @click="onAddUserClick"
    >
      {{ userTrans.add_user }}
    </b-button>

    <b-modal v-if="userPermissions.update_users"
      size="lg"
      :title="popupTitle"
      v-model="showEditUserModal"
    >
      <b-form-group 
        label-cols="4" 
        label="Change user's name:" 
        label-for="edit-user-name"
      >
        <b-form-input
          :state="editUserModel.name !== ''"
          v-model="editUserModel.name"
          type="text"
          id="edit-user-name"
          required
        ></b-form-input>
      </b-form-group>

      <b-form-group 
        label-cols="4" 
        label="Change user's lastname:" 
        label-for="edit-user-lastname"
      >
        <b-form-input
          :state="editUserModel.lastname !== ''"
          v-model="editUserModel.lastname"
          type="text"
          id="edit-user-lastname"
          required
        ></b-form-input>
      </b-form-group>

      <b-form-group 
        label-cols="4" 
        label="Change user's type:"
      >
        <b-form-select
          v-model="editUserModel.type"
          :options="userTypes"
          track-by="value"
          label="text"
        ></b-form-select>
      </b-form-group>

      <b-form-group 
        label-cols="4" 
        label="Change user's organization:" 
        label-for="edit-user-org"
      >
        <b-form-select
          :disabled="isOrgPage"
          :state="editUserModel.org_id !== ''"
          v-model="editUserModel.org_id"
          :options="orgOptions"
          id="edit-user-org"
          track-by="value"
          label="text"
        ></b-form-select>
      </b-form-group>

      <b-form-group 
        label-cols="4"
        label="Assign admin rights"
        v-if="editUserModel.type === 'admin'"
      >
        <multiselect
          v-model="editUserModel.admin_rights"
          :options="orgOptions"
          :multiple="true"
          :searchable="true"
          track-by="value"
          label="text"
        />
      </b-form-group>
      
      <template v-slot:modal-footer>
        <div class="w-100">
          <b-button variant="success" size="sm" class="float-right" @click="onUpdate()">Update</b-button>
          <b-button variant="light" size="sm" class="float-right mr-3" @click="onEditCancel()">Cancel</b-button>
        </div>
      </template>
    </b-modal>

    <b-modal 
      size="lg" 
      id="user-modal" 
      title="Add New User"
      v-model="showNewUserModal"
    >
      <b-form-group 
        label-cols="4" 
        label="Enter user's email:" 
        label-for="add-user-email"
      >
        <b-form-input
          :state="addUserModel.email !== ''"
          v-model="addUserModel.email"
          type="email"
          id="add-user-email"
          required
        ></b-form-input>
      </b-form-group>

      <b-form-group 
        label-cols="4" 
        label="Enter user's name:" 
        label-for="add-user-email"
      >
        <b-form-input
          :state="addUserModel.name !== ''"
          v-model="addUserModel.name"
          type="text"
          id="add-user-name"
          required
        ></b-form-input>
      </b-form-group>

      <b-form-group 
        label-cols="4" 
        label="Enter user's lastname:" 
        label-for="add-user-email"
      >
        <b-form-input
          :state="addUserModel.lastname !== ''"
          v-model="addUserModel.lastname"
          type="text"
          id="add-user-lastname"
          required
        ></b-form-input>
      </b-form-group>

      <b-form-group
        label-cols="4"
        label="Enter user's default password:"
        label-for="add-user-password"
        description="User will be forced to change the password after first login."
      >
        <b-form-input
          :state="addUserModel.password !== '' && addUserModel.password.length >= 8"
          v-model="addUserModel.password"
          type="password"
          id="add-user-password"
        ></b-form-input>
      </b-form-group>

      <b-form-group 
        label-cols="4" 
        label="Enter user's type:" 
        label-for="add-user-type"
      >
        <b-form-select
          :state="addUserModel.type !== ''"
          v-model="addUserModel.type"
          :options="userTypes"
          id="add-user-type"
          track-by="value"
          label="text"
        ></b-form-select>
      </b-form-group>

      <b-form-group 
        label-cols="4" 
        label="Enter user's organization:" 
        label-for="add-user-org"
      >
        <b-form-select
          :disabled="isOrgPage"
          :state="addUserModel.org_id !== ''"
          v-model="addUserModel.org_id"
          :options="currentUserOrgs"
          id="add-user-org"
          track-by="value"
          label="text"
        ></b-form-select>
      </b-form-group>

      <b-form-group 
        v-if="addUserModel.type === 'admin'"
        label-cols="4"
        label="Assign admin rights"
      >
        <multiselect
          v-model="addUserModel.admin_rights"
          :options="orgOptions"
          :multiple="true"
          :searchable="true"
          track-by="value"
          label="text"
        />
      </b-form-group>

      <template v-slot:modal-footer>
        <div class="w-100">
          <b-button 
            variant="success" 
            size="sm" 
            class="float-right" 
            @click="addNewUser()"
          >Add</b-button>

          <b-button
            variant="light"
            size="sm"
            class="float-right mr-3"
            @click="onAddUserCancel()"
          >Cancel</b-button>
        </div>
      </template>
    </b-modal>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex';
import Multiselect from "vue-multiselect";
import axios from '@/plugins/axios';

const addUserModel = {
  email: '',
  name: '',
  lastname: '',
  password: '',
  added_by_admin: true,
  type: 'level_1',
  org_id: '',
  admin_rights: [],
};

const editUserModel = {
  type: null,
  admin_rights: [],
  org_id: '',
  user_id: '',
  name: '',
  lastname: '',
};

export default {
  props: {
    users: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      showEditUserModal: false,
      showNewUserModal: false,
      currentEditUser: null,
      editUserModel,
      addUserModel,
    }
  },
  components: {
    Multiselect
  },
  computed: {
    ...mapGetters(["userPermissions", "currentUser"]),
    ...mapState({
      user: state => state.auth.user,
      userTrans: (state) => state.lang.userTrans,
      orgs: state => state.auth.orgs || [],
    }),
    isOrgPage() {
      return this.$route.params.ref_id !== this.currentUser._id;
    },
    popupTitle() {
      if (this.currentEditUser) {
        return `${this.currentEditUser.email}'s settings`;
      }
      return '';
    },
    userTypes() {
      const isAdmin = this.currentUser.type === "admin";
      const isSuperAdmin = this.currentUser.type === "super_admin";

      const levelUsers = [
        { text: "level_1", value: "level_1" }, 
        { text: "level_2", value: "level_2"}, 
        { text: "level_3", value: "level_3"}, 
      ];

      if (isAdmin) {
        return levelUsers;
      }

      if (isSuperAdmin) {
        return [
          ...levelUsers,
          { text: "admin", value: "admin" }, 
          { text: "super_admin", value: "super_admin" },
        ]
      }

      return [];
    },
    orgOptions() {
      return this.orgs.map(d => {
        return {
          text: d.name,
          value: d._id,
        }
      });
    },
    currentUserOrgs() {
      if (this.currentUser.type === "super_admin") {
        return this.orgOptions;
      }
      const admin_rights = this.currentUser.admin_rights;
      return this.orgOptions.filter(d => admin_rights.indexOf(d.value) > -1);
    },
    orgMap() {
      return new Map(this.orgs.map(d => [d._id, d.name]));
    },
  },
  methods: {
    ...mapActions([
      "createUser",
      "deleteUser",
      "updateUser",
      "browseUser",
      "fetchOrgs",
    ]),
    getAdminRights(user) {
      return user.admin_rights
        .map(d => this.orgMap.get(d))
        .filter(d => d)
        .join(", ");
    },
    onAddUserClick() {
      if (this.isOrgPage) {
        this.addUserModel.org_id = this.$route.params.ref_id;
      }
      this.showNewUserModal = true;
    },
    addNewUser() {
      if (!this.userPermissions.create_users) {
        return;
      }

      const {
        email,
        name,
        lastname,
        password,
        type,
        org_id,
        admin_rights,
      } = this.addUserModel;

      // validate user
      if (
        email !== '' && name !== '' && lastname !== '' &&
        password.length >= 8 &&
        type !== '' &&
        org_id !== '' && Array.isArray(admin_rights)
      ) {
        axios.get('/api/orgs/find-one?user_count=1&org_id=' + org_id).then(resp => {
          const org = resp.data;

          if (org.user_count < org.attrs.max_users) {
            const form = {
              ...this.addUserModel,
              admin_rights: admin_rights.map(d => d.value),
            }
            // post user to server
            this.createUser(form).then(this.onAddUserCancel);
          } else {
            throw new Error("User limit reached");
          }

        }).catch((e) => {
          this.flash(e.message, "error");
        });
      }
    },
    onAddUserCancel() {
      this.showNewUserModal = false;
      this.addUserModel = addUserModel;
    },
    async onUserDelete(user) {
      if (this.userPermissions.delete_users) {
        const res = await this.$dialog.confirm({
          title: "Are you sure you want to delete this user?",
          text: "This user will be removed permanently and can't be restored!"
        });

        if (res) {
          this.deleteUser(user._id);
        }
      }
    },
    goToUsersProfile(user) {
      this.browseUser(user);
    },
    onUpdate() {
      if (!this.userPermissions.update_users) {
        return;
      }

      const {
        user_id,
        org_id,
        admin_rights,
        type
      } = this.editUserModel;

      // validate user
      if (
        org_id !== '' &&
        Array.isArray(admin_rights) &&
        type !== '' && 
        user_id !== ''
      ) {
        const form = {
          ...this.editUserModel,
          admin_rights: admin_rights.map(d => d.value),
        }
        // put user to the server
        this.updateUser(form).then(this.onEditCancel);
      }
    },
    onEditCancel() {
      this.currentEditUser = null;
      this.showEditUserModal = false;
      this.editUserModel = editUserModel;
    },
    onMoreClick(user) {
      this.currentEditUser = user;
      this.editUserModel.admin_rights = user.admin_rights.map(d => ({
        text: this.orgMap.get(d),
        value: d
      }));
      this.editUserModel.type = user.type;
      this.editUserModel.org_id = user.org_id;
      this.editUserModel.user_id = user._id;
      this.editUserModel.name = user.name || '';
      this.editUserModel.lastname = user.lastname || '';
      this.showEditUserModal = true;
    },
    loadOrgs() {
      let payload = {};

      if (this.currentUser.type === "admin") {
        payload.admin_rights = this.currentUser.admin_rights;
      }

      this.fetchOrgs(payload);
    },
    canDeleteUser(user) {
      // if no permission, return false
      if (!this.userPermissions.delete_users) {
        return false;
      }

      // no-one can delete super_admin
      if (user.type !== 'super_admin') {
        // if logged in user is super_admin, he can delete admins, level_X users
        if (this.user.type === 'super_admin') {
          return true;
        } 
        // if logged in user is admin, he can delete only level_X users
        else if (this.user.type === 'admin') {
          return user.type !== 'admin'
        }
      }

      return false;
    },
    canUpdateUser(user) {
      // if no permission, return false
      if (!this.userPermissions.update_users) {
        return false;
      }

      // no-one can update super_admin
      if (user.type !== 'super_admin') {
        // if logged in user is super_admin, he can update admins, level_X users
        if (this.user.type === 'super_admin') {
          return true;
        } 
        // if logged in user is admin, he can update only level_X users
        else if (this.user.type === 'admin') {
          return user.type !== 'admin'
        }
      } 
      // super admin can update himself
      else if (this.user.email === user.email && this.user.type === 'super_admin') {
        return true;
      }

      return false;
    }
  },
  watch: {
    currentUser() {
      this.loadOrgs();
    }
  },
  created() {
    if (this.orgs.length === 0) {
      this.loadOrgs();
    }
  }
}
</script>

<style scoped>
  .cell {
    padding: 5px;
    vertical-align: middle;
  }

  .dots-icon {
    padding-right: 0px;
  }

  .users-table thead th {
    border-top: none;
  }
</style>