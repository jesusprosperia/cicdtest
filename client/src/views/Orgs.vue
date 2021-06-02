<template>
  <b-container class="orgs">
    <div class="cards" v-if="!orgsLoading">
      <div class="card-wrapper" v-for="(tile, i) in tiles" :key="'tile' + i">
        <b-card @click="onTileClick(tile)"
          :title="tile.name"
          :img-src="tile.img"
          :img-alt="tile.name"
          img-top
        >
          <b-button v-if="tile.edit"
            size="sm"
            class="dots-icon"
            variant="primary-outline"
            @click="onEditClick($event, tile)"
          >
            <b-icon icon="three-dots-vertical"></b-icon>
          </b-button>
        </b-card>
      </div>
    </div>

    <b-modal
      size="lg"
      title="Add new organization"
      v-model="showAddOrgModal"
    >
      <b-form-group label-cols="4" label="Enter organization name" label-for="org_name">
        <b-form-input
          :state="orgModel.name !== ''"
          v-model="orgModel.name"
          type="text"
          id="org_name"
          required
        />
      </b-form-group>

      <b-form-group label-cols-sm="4" label="Organization logo">
        <div class="d-flex align-items-center">
          <b-form-file v-model="orgLogo" accept=".png, .jpg, .PNG, .JPG, .svg"></b-form-file>
          <div class="ml-2">
            <img
              class="avatar"
              :src="orgLogoDisplay || require('@/assets/logo.png')"
            />
          </div>
        </div>
      </b-form-group>

      <b-form-group 
        v-if="updateOrg.profile_img_url"
        label-cols-sm="4" 
        label="Organization profile image"
      >
        <div class="d-flex align-items-center">
          <b-form-file 
            v-model="orgProfile" 
            accept=".png, .jpg, .PNG, .JPG, .svg"
          ></b-form-file>
          <div class="ml-2">
            <img
              class="avatar"
              :src="orgProfileDisplay || require('@/assets/logo.png')"
            />
          </div>
        </div>
      </b-form-group>

      <b-form-group label-cols="4" label="Primary color" label-for="primary_color">
        <b-form-input
          :state="orgModel.attrs.primary_color !== ''"
          v-model="orgModel.attrs.primary_color"
          type="color"
          id="primary_color"
          required
        />
      </b-form-group>

      <b-form-group label-cols="4" label="Secondary color" label-for="secondary_color">
        <b-form-input
          :state="orgModel.attrs.secondary_color !== ''"
          v-model="orgModel.attrs.secondary_color"
          type="color"
          id="secondary_color"
          required
        />
      </b-form-group>

      <b-form-group label-cols="4" label="Max number of users" label-for="max_users">
        <b-form-input
          :state="orgModel.attrs.max_users > 0"
          v-model="orgModel.attrs.max_users"
          type="number"
          id="max_users"
          required
        />
      </b-form-group>

      <b-form-group label-cols="4" label="Max dataset size (MB)" label-for="max_dataset_size">
        <b-form-input
          :state="orgModel.attrs.max_dataset_size > 0"
          v-model="orgModel.attrs.max_dataset_size"
          type="number"
          id="max_dataset_size"
          required
        />
      </b-form-group>

      <b-form-group label-cols="4" label="Max number of datasets" label-for="max_datasets">
        <b-form-input
          :state="orgModel.attrs.max_datasets > 0"
          v-model="orgModel.attrs.max_datasets"
          type="number"
          id="max_datasets"
          required
        />
      </b-form-group>

      <b-form-group label-cols="4" label="Max number of scenarios" label-for="max_targeting_schemes">
        <b-form-input
          :state="orgModel.attrs.max_targeting_schemes > 0"
          v-model="orgModel.attrs.max_targeting_schemes"
          type="number"
          id="max_targeting_schemes"
          required
        />
      </b-form-group>

      <template v-slot:modal-footer>
        <div class="w-100">
          <b-button variant="success" size="sm" class="float-right" @click="onCreate()">Create</b-button>
          <b-button variant="secondary" size="sm" class="float-right mr-3" @click="onCancel()">Cancel</b-button>
        </div>
      </template>
    </b-modal>

    <b-modal v-if="updateOrg"
      size="lg"
      title="Update organization"
      v-model="showEditOrg"
    >
      <b-form-group 
        v-if="updateOrg.org_name"
        label-cols="4" 
        label="Enter organization name" 
        label-for="edit_org_name"
      >
        <b-form-input
          :state="updateOrgModel.name !== ''"
          v-model="updateOrgModel.name"
          type="text"
          id="edit_org_name"
          required
        />
      </b-form-group>

      <b-form-group 
        v-if="updateOrg.logo_url"
        label-cols-sm="4" 
        label="Organization logo"
      >
        <div class="d-flex align-items-center">
          <b-form-file 
            v-model="updateOrgLogo" 
            accept=".png, .jpg, .PNG, .JPG, .svg"
          ></b-form-file>
          <div class="ml-2">
            <img
              class="avatar"
              :src="updateOrgLogoDisplay || require('@/assets/logo.png')"
            />
          </div>
        </div>
      </b-form-group>

      <b-form-group 
        v-if="updateOrg.profile_img_url"
        label-cols-sm="4" 
        label="Organization profile image"
      >
        <div class="d-flex align-items-center">
          <b-form-file 
            v-model="updateOrgProfile" 
            accept=".png, .jpg, .PNG, .JPG, .svg"
          ></b-form-file>
          <div class="ml-2">
            <img
              class="avatar"
              :src="updateOrgProfileDisplay || require('@/assets/logo.png')"
            />
          </div>
        </div>
      </b-form-group>

      <b-form-group 
        v-if="updateOrg.primary_color"
        label-cols="4" 
        label="Primary color" 
        label-for="edit_primary_color"
      >
        <b-form-input
          :state="updateOrgModel.attrs.primary_color !== ''"
          v-model="updateOrgModel.attrs.primary_color"
          type="color"
          id="edit_primary_color"
          required
        />
      </b-form-group>

      <b-form-group 
        v-if="updateOrg.secondary_color"
        label-cols="4" 
        label="Secondary color" 
        label-for="edit_secondary_color"
      >
        <b-form-input
          :state="updateOrgModel.attrs.secondary_color !== ''"
          v-model="updateOrgModel.attrs.secondary_color"
          type="color"
          id="edit_secondary_color"
          required
        />
      </b-form-group>

      <b-form-group 
        v-if="updateOrg.max_users"
        label-cols="4" 
        label="Max number of users" 
        label-for="edit_max_users"
      >
        <b-form-input
          :state="updateOrgModel.attrs.max_users > 0"
          v-model="updateOrgModel.attrs.max_users"
          type="number"
          id="edit_max_users"
          required
        />
      </b-form-group>

      <b-form-group 
        v-if="updateOrg.max_dataset_size"
        label-cols="4" 
        label="Max dataset size (MB)" 
        label-for="edit_max_dataset_size"
      >
        <b-form-input
          :state="updateOrgModel.attrs.max_dataset_size > 0"
          v-model="updateOrgModel.attrs.max_dataset_size"
          type="number"
          id="edit_max_dataset_size"
          required
        />
      </b-form-group>

      <b-form-group 
        v-if="updateOrg.max_datasets"
        label-cols="4" 
        label="Max number of datasets" 
        label-for="edit_max_datasets"
      >
        <b-form-input
          :state="updateOrgModel.attrs.max_datasets > 0"
          v-model="updateOrgModel.attrs.max_datasets"
          type="number"
          id="edit_max_datasets"
          required
        />
      </b-form-group>

      <b-form-group 
        v-if="updateOrg.max_targeting_schemes"
        label-cols="4" 
        label="Max number of scenarios" 
        label-for="edit_max_targeting_schemes"
      >
        <b-form-input
          :state="updateOrgModel.attrs.max_targeting_schemes > 0"
          v-model="updateOrgModel.attrs.max_targeting_schemes"
          type="number"
          id="edit_max_targeting_schemes"
          required
        />
      </b-form-group>

      <template v-if="
        userPermissions.delete_org && 
        user.type === 'super_admin'
      ">
        <hr>
        <b-form-group
          label="Delete Organization?"
          label-cols="4" 
        >
          <b-button 
            variant="danger" 
            size="sm"
            @click="deleteConfirmDialog = true;"
          >Delete</b-button>
        </b-form-group>
      </template>

      <template v-slot:modal-footer>
        <div class="w-100">
          <b-button 
            variant="success" 
            size="sm" 
            class="float-right" 
            @click="onUpdate()"
          >Update</b-button>
          <b-button 
            variant="secondary" 
            size="sm" 
            class="float-right mr-3" 
            @click="onEditCancel()"
          >Cancel</b-button>
        </div>
      </template>
    </b-modal>

    <b-modal
      v-if="
        userPermissions.delete_org && 
        user.type === 'super_admin'
      "
      size="lg"
      title="Are you sure you want to delete this organization?"
      v-model="deleteConfirmDialog"
    >
      <p class="text-danger">
        This organization will be removed permanently and can't be restored!
      </p>

      <p class="text-danger">It will also:</p>

      <ul class="text-danger">
        <li>Delete all the <strong>users</strong> in that organization.</li>
        <li>Update all the <strong>other users</strong> that are not in that organization, but are admins of that organization.</li>
        <li>Delete all the <strong>schemes and collections</strong> assigned to that organization.</li>
        <li>Delete all the <strong>schemes and collections</strong> assigned to users of that organization.</li>
      </ul>

      <p class="text-danger">I am sure I want to delete this organization and I am aware of its consequences.</p>

      <p class="text-danger">Please type below <strong><i>delete {{updateOrgModel.name}}</i></strong>.</p>

      <b-form-input
        v-model="orgNameConfirm"
      />

      <template v-slot:modal-footer>
        <div class="w-100">
          <b-button 
            variant="danger" 
            size="sm" 
            class="float-right ml-2" 
            @click="onDeleteClick()"
          >Delete</b-button>

          <b-button 
            variant="secondary" 
            size="sm" 
            class="float-right" 
            @click="deleteConfirmDialog = false; orgNameConfirm = null;"
          >Cancel</b-button>
        </div>
      </template>
    </b-modal>
  </b-container>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex';
import { fixIntegers } from '@/utils/formatters';

export default {
  data() {
    return {
      deleteConfirmDialog: false,
      showAddOrgModal: false,
      showEditOrg: false,
      orgLogo: [],
      orgLogoDisplay: null,
      updateOrgLogo: [],
      updateOrgLogoDisplay: null,
      orgProfile: [],
      orgProfileDisplay: null,
      updateOrgProfile: [],
      updateOrgProfileDisplay: null,
      orgsLoading: false,
      updateOrgModel: {
        name: '',
        org_id: '',
        attrs: {
          logo_url: '',
          profile_img_url: '',
          primary_color: '',
          secondary_color: '',
          max_users: 10, 
          max_dataset_size: 50,
          max_datasets: 10,
          max_targeting_schemes: 10,
        }
      },
      orgModel: {
        name: '',
        attrs: {
          logo_url: '',
          profile_img_url: '',
          primary_color: '#2c3e50',
          secondary_color: '#28a745',
          max_users: 10, 
          max_dataset_size: 50,
          max_datasets: 10,
          max_targeting_schemes: 10,
        }
      },
      orgNameConfirm: null
    }
  },
  computed: {
    ...mapGetters([ 'userPermissions', 'currentUser' ]),
    ...mapState({
      user: state => state.auth.user,
      orgs: state => state.auth.orgs,
      userFromAdmin: (state) => state.admin.userFromAdmin,
    }),
    tiles() {
      const myWorkspace = {
        name: "My Workspace",
        img: require('@/assets/person.svg'),
        cmd: 'my-workspace',
        edit: false,
      };

      const newOrg = {
        name: "Add New Org",
        img: require('@/assets/file-plus.svg'),
        edit: false,
        cmd: 'add-new'
      };

      const orgs = this.orgs.map(d => {
        return {
          id: d._id,
          name: d.name,
          img: d.attrs.profile_img_url,
          cmd: 'open-org',
          edit: true,
          model: d,
        }
      });

      const tiles = [
        myWorkspace,
        ...orgs
      ];

      // do we need "add new org tile" when browsed by X user?
      if (this.currentUser.type === "super_admin") {
        tiles.push(newOrg);
      }

      return tiles;
    },
    updateOrg() {
      return this.userPermissions.update_org;
    }
  },
  methods: {
    ...mapActions([
      'fetchOrgs', 
      'addOrg', 
      'editOrg',
      'deleteOrg',
    ]),
    browseOrgPage({ _id }) {
      this.$router.push(`/scenarios/${_id}`);
    },
    onTileClick(tile) {
      switch (tile.cmd) {
        case "open-org":
          this.$router.push(`/scenarios/${tile.id}`);
          break;
        case "my-workspace":
          this.$router.push(`/scenarios/${this.currentUser._id}`);
          break;
        case "add-new":
          this.showAddOrgModal = true;
          break;

        default:
          break;
      }
    },
    onCreate() {
      this.orgModel.attrs = fixIntegers(
        this.orgModel.attrs,
        ['max_users', 'max_dataset_size', 'max_datasets', 'max_targeting_schemes']
      );

      const { 
        name, 
        attrs: {
          primary_color,
          secondary_color,
          max_users, 
          max_dataset_size,
          max_datasets,
          max_targeting_schemes,
        }
      } = this.orgModel;

      const isLogoFile = this.orgLogo instanceof File;
      const isProfileFile = this.orgProfile instanceof File;

      // validate input
      if (
        name === '' || !isLogoFile || !isProfileFile ||
        max_users <= 0 || max_dataset_size <= 0 ||
        max_datasets <= 0 || max_targeting_schemes <= 0 ||
        primary_color === '' || secondary_color === ''
      ) {
        return;
      }

      // image decode as form data
      var formData = new FormData();
      formData.append("image_file", this.orgLogo);

      var profileImg = new FormData();
      profileImg.append("image_file", this.orgProfile);

      // post to server
      this.addOrg({
        org: this.orgModel,
        image_file: formData,
        profile_img_url: profileImg,
      }).then(() => {
        this.showAddOrgModal = false;
      });
    },
    onCancel() {
      this.showAddOrgModal = false;
    },
    onEditCancel() {
      this.showEditOrg = false;
    },
    async onDeleteClick() {
      if (!this.updateOrgModel.org_id) {
        return;
      }
      debugger
      if (this.orgNameConfirm) {
        const command = this.orgNameConfirm.trim();

        if (command === 'delete ' + this.updateOrgModel.name) {
          this.deleteOrg(this.updateOrgModel.org_id).then(() => {
            this.showEditOrg = false;
            this.orgNameConfirm = null;
            this.deleteConfirmDialog = false;
          }).catch(() => {
            this.orgNameConfirm = null;
          });
        }
      }
    },
    onEditClick(e, tile) {
      e.stopPropagation();

      this.updateOrgModel = Object.assign({}, tile.model);
      this.updateOrgModel.org_id = tile.id;
      this.showEditOrg = true;
      this.updateOrgProfileDisplay = tile.model.attrs.profile_img_url;
      this.updateOrgLogoDisplay = tile.model.attrs.logo_url;
    },
    onUpdate() {
      this.updateOrgModel.attrs = fixIntegers(
        this.updateOrgModel.attrs, 
        ['max_users', 'max_dataset_size', 'max_datasets', 'max_targeting_schemes']
      );

      const { 
        id,
        name, 
        attrs: {
          primary_color,
          secondary_color,
          max_users, 
          max_dataset_size,
          max_datasets,
          max_targeting_schemes,
        }
      } = this.updateOrgModel;

      const isLogoFile = this.updateOrgLogo instanceof File;
      const isProfileFile = this.updateOrgProfile instanceof File;

      // validate input
      if (
        id === '' && name === '' && !isLogoFile && !isProfileFile &&
        max_users <= 0 && max_dataset_size <= 0 &&
        max_datasets <= 0 && max_targeting_schemes <= 0 &&
        primary_color === '' && secondary_color === ''
      ) {
        return;
      }

      // image decode as form data
      const req = {
        org_id: this.updateOrgModel.org_id,
        org: this.updateOrgModel,
      };

      if (isLogoFile) {
        var formData = new FormData();
        formData.append("image_file", this.updateOrgLogo);
        req.image_file = formData;
      }

      if (isProfileFile) {
        var profileImg = new FormData();
        profileImg.append("image_file", this.updateOrgProfile);
        req.profile_img_url = profileImg;
      }
  
      // post to server
      this.editOrg(req).then(() => {
        this.showEditOrg = false;
      });
    },
    loadImg(file, cb) {
      if (file) {
        const reader = new FileReader();
        reader.onload = cb;
        reader.readAsDataURL(file);
      }
    },
    loadOrgs() {
      const userType = this.currentUser.type;

      if (userType === "admin" || userType === "super_admin") {
        let payload = {};

        if (userType === "admin") {
          payload.admin_rights = this.currentUser.admin_rights;
          if (payload.admin_rights.indexOf(this.currentUser.org_id)) {
            payload.admin_rights.push(this.currentUser.org_id);
          }
        }

        this.orgsLoading = true;
        this.fetchOrgs(payload).then(() => {
          this.orgsLoading = false;
        }).catch(() => {
          this.orgsLoading = false;
        });
      }
    }
  },
  watch: {
    orgLogo(file) {
      this.loadImg(file, (e) => {
        this.orgLogoDisplay = e.target.result;
      });
    },
    updateOrgLogo(file) {
      this.loadImg(file, (e) => {
        this.updateOrgLogoDisplay = e.target.result;
      });
    },
    orgProfile(file) {
      this.loadImg(file, e => {
        this.orgProfileDisplay = e.target.result;
      })
    },
    updateOrgProfile(file) {
      this.loadImg(file, e => {
        this.updateOrgProfileDisplay = e.target.result;
      })
    },
    userFromAdmin() {
      this.loadOrgs();
    },
  },
  created() {
    this.loadOrgs();
  }
}
</script>

<style lang="scss" scoped>
$padding: 7.5px;

.orgs {
  .cards {
    flex-flow: row wrap;
    display: flex;
    margin-left: -$padding;
    margin-right: -$padding;
    margin-top: 20px;
    margin-bottom: 20px;

    .card-wrapper {
      width: 215px;
      padding: $padding;

      .card {
        flex: none;
        margin: 0;
        height: 100%;
        position: relative;
        padding-top: 20px;

        img {
          height: 200px;
          width: 100%;
        }

        &:hover {
          box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);
        }

        .card-title {
          margin-bottom: 0px;
          text-align: center;
          font-size: 1.1rem;
          font-weight: 500;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dots-icon {
          position: absolute;
          z-index: 1;
          top: 0px;
          right: 0px;
          padding: 3px;
        }
      }
    }
  }
}

</style>

<style>
  .avatar {
    width: 24px;
    height: 24px;
  }
</style>