<template>
  <b-container class="manage-datasets">
    <b-row>
       <div class="pl-0 org-card-wrapper">
         <div class="org-card" v-if="org">
            <b-card
              :title="org.name"
              :img-src="org.attrs.profile_img_url"
              :img-alt="org.name"
              img-top
            >
              <p v-if="!isOrgPage" class="text-center mb-0 mt-1">
                {{ currentUserName }}
              </p>
            </b-card>
          </div>
       </div>

       <div class="schemes-and-datasets">
          <!-- Schemes -->
          <block-container 
            :title="userTrans.saved_targeting_scheme_title"
            :fullWidth="true" 
          >
            <list :list="schemeList">
              <template v-slot:actions="{ datum: d }">
                <div class="icon mr-2" @click="goToYourPopulation(d.id, d.name)">
                  <img src="@/assets/go_to.png" />
                </div>

                <div
                  class="icon"
                  v-if="userPermissions.delete_schemes"
                  @click="deleteScheme(d)"
                >
                  <img src="@/assets/delete.svg" />
                </div>
              </template>
            </list>

            <div>
              <b-button
                v-if="userPermissions.create_schemes"
                class="button-add"
                variant="success"
                @click="addMoreScheme"
              >
                {{ userTrans.craete_new_tar_scheme }}
              </b-button>

              <b-button 
                v-if="userPermissions.copy_schemes"
                class="ml-2 button-copy" 
                variant="success" 
                @click="() => showCopySchemes = true"
              >Copy Schemes</b-button>
            </div>
          </block-container>

          <!-- Datasets -->
          <block-container 
            :title="userTrans.available_datasets"
            :fullWidth="true" 
          >
            <list :list="collectionList">

              <template v-slot:actions="{ datum: d }">
                <div
                  v-if="userPermissions.delete_datasets"
                  class="icon"
                  @click="deleteDataset(d.collection)"
                >
                  <img src="@/assets/delete.svg" />
                </div>
              </template>

            </list>

            <div>
              <b-button
                v-if="userPermissions.create_datasets"
                class="button-add"
                variant="success"
                @click="addMoreDataset"
                >{{ userTrans.upload_new_dataset }}</b-button>
            </div>
          </block-container>
       </div>
    </b-row>

    <!-- Users -->
    <block-container 
      v-if="showUsers"
      title="Users" 
      :fullWidth="true" 
    >
      <UsersTable :users="users" v-if="users" />
    </block-container>

    <SchemeModal
      v-if="userPermissions.create_schemes"
      :show="showSchemeModal"
      @on-cancel="() => (showSchemeModal = false)"
      @on-save="onSchemeSave"
    />

    <DatasetModal
      v-if="userPermissions.create_datasets"
      :show="showDatasetModal"
      :sectionMap="sectionMap"
      @on-cancel="onDatasetCancel"
      @on-save="onDatasetCancel"
      @on-more-click="onMoreClick"
      @on-uploaded="onDatasetUploaded"
    />

    <MoreModal
      v-if="
        userPermissions.create_datasets &&
        currentModalVariable &&
        currentCollection
      "
      :show="showMoreModal"
      :field="currentModalVariable"
      :collectionName="currentCollection"
      :sections="sections"
      :xExtent="xExtent"
      :yExtent="yExtent"
      @on-cancel="() => showMoreModal = false"
    />

    <CopySchemes
      v-if="userPermissions.copy_schemes"
      :show="showCopySchemes"
      :org="org"
      @on-cancel="() => showCopySchemes = false"
    />
  </b-container>
</template>

<script>
import { mapActions, mapState, mapGetters } from "vuex";
import BlockContainer from "@/components/ui/block-container.vue";
import { getRandomId } from "@/utils/formatters";
import SchemeModal from "./popups/scheme";
import DatasetModal from "./popups/dataset";
import MoreModal from "./popups/more";
import List from "../../components/ui/list.vue";
import UsersTable from './UsersTable';
import axios from '@/plugins/axios';
import CopySchemes from './popups/copy-schemes';

export default {
  props: [ 'ref_id' ],
  data() {
    return {
      currentCollection: null,
      showDatasetModal: false,
      showSchemeModal: false,
      showMoreModal: false,
      showCopySchemes: false,
      sectionMap: {},
      currentModalVariable: null,
      sections: [],
      xExtent: [],
      yExtent: [],
      org: null,
    };
  },
  components: {
    BlockContainer,
    SchemeModal,
    DatasetModal,
    MoreModal,
    List,
    UsersTable,
    CopySchemes,
  },
  computed: {
    ...mapGetters([
      "userPermissions", 
      "userSettings",
      "currentUser",
    ]),
    ...mapState({
      users: (state) => state.admin.users,
      userTrans: (state) => state.lang.userTrans,
      schemeList: ({ scheme }) => scheme.schemeList,
      collectionList: ({ scheme }) => scheme.collectionList,
    }),
    currentUserName() {
      const { name, lastname, email } = this.currentUser;

      if (name && lastname) {
        return name + ' ' + lastname;
      }

      return email;
    },
    showUsers() {
      return this.isOrgPage && 
            (this.currentUser.type === "admin" ||
             this.currentUser.type === "super_admin");
    },
    isOrgPage() {
      return this.ref_id !== this.currentUser._id;
    },
    org_id() {
      if (this.isOrgPage) {
        return this.ref_id;
      }
      return this.currentUser.org_id;
    },
  },
  methods: {
    ...mapActions([
      "removeCollection",
      "removeTargetingScheme",
      "browsePopulationPage",
      "listSchemes",
      "listUsers",
    ]),
    async onMoreClick(field) {
      this.currentModalVariable = field;
      this.showMoreModal = true;

      const d = this.sectionMap[field.propName];

      if (d) {
        this.sections = d.sections;
        this.xExtent = d.xExtent;
        this.yExtent = d.yExtent;
      } else {
        this.sections = [];
        this.xExtent = [1, 50];
        this.yExtent = [0, 0];
      }
    },
    async deleteScheme(scheme) {
      var res = await this.$dialog.prompt({
        text: "",
        title: `Are you sure you want to delete scheme ${scheme.name}? 
        If so, please type below '${scheme.name}'`,
      });

      if (res == scheme.name) {
        this.removeTargetingScheme({
          user_id: this.ref_id,
          scheme_id: scheme.id,
        });
      }
    },
    async deleteDataset(collection) {
      var splitName = collection.split("_");
      var name = "";

      // old names
      if (!isNaN(splitName[1]) && splitName[1].length === 13) {
        name = splitName.slice(2).join("_");
      }
      // new names
      else {
        name = splitName.slice(1, splitName.length - 1).join("_");
      }

      var res = await this.$dialog.prompt({
        text: "",
        title: `Are you sure you want to delete dataset ${name}? 
        If so, please type below '${name}'`,
      });

      var confirmName = [];

      // old names
      if (!isNaN(splitName[1]) && splitName[1].length === 13) {
        confirmName = [splitName[0], splitName[1], res];
      }
      // new names
      else {
        confirmName = [splitName[0], res, splitName[splitName.length - 1]];
      }

      if (confirmName.join("_") === collection) {
        this.removeCollection({
          collection,
          user_id: this.ref_id,
        });
      }
    },
    addMoreScheme() {
      var max_targeting_schemes = this.userSettings.max_targeting_schemes;
      var current_targeting_schemes = this.schemeList.length;

      if (current_targeting_schemes + 1 > max_targeting_schemes) {
        this.showSchemeModal = false;
        return this.flash(
          `You are only allowed to have ${max_targeting_schemes} schemes`,
          "error"
        );
      }

      this.showSchemeModal = true;
    },
    addMoreDataset() {
      var max_datasets = this.userSettings.max_datasets;
      var current_datasets = this.collectionList.length;

      if (current_datasets + 1 > max_datasets) {
        this.showDatasetModal = false;
        return this.flash(
          `You are only allowed to have ${max_datasets} datasets`,
          "error"
        );
      }

      this.showDatasetModal = true;
    },
    onMoreModalSave({ sections, shapeFile, xExtent, yExtent }) {
      this.sectionMap[this.currentModalVariable.propName] = {
        sections: sections.map((d) => ({ name: d.name, value: +d.value })),
        xExtent: xExtent,
        yExtent: yExtent,
        variable: this.currentModalVariable.propName,
        shapeFile: shapeFile,
      };
      this.showMoreModal = false;
    },
    onDatasetUploaded({ collection }) {
      this.currentCollection = collection;
    },
    onDatasetCancel() {
      this.showDatasetModal = false;
      this.data = null;
      this.dataFetchedFor = null;
      this.currentCollection = null;
    },
    goToYourPopulation(id, name) {
      const base = `/scenarios/${this.ref_id}`;
      if (this.userPermissions.update_schemes) {
        this.browsePopulationPage({ id, name });
        this.$router.push(`${base}/specifications/${id}`);
      } else {
        this.$router.push(`${base}/tree/${id}`);
      }
    },
    onSchemeSave(schemeName) {
      var id = getRandomId();
      this.goToYourPopulation(id, schemeName);
    },
    loadOrg(org_id) {
      if (org_id) {
        this.org = null;
        axios.get('/api/orgs/find-one?org_id=' + org_id).then(resp => {
          this.org = resp.data;
        }).catch(() => {});
      }
    },
    init() {
      this.listSchemes(this.ref_id);
      this.loadOrg(this.org_id);

      if (this.userPermissions.copy_schemes || this.showUsers) {
        this.listUsers({ org_id: this.org_id });
      }
    },
  },
  watch: {
    currentUser() {
      this.init();
    }
  },
  created() {
    this.init();
  }
};
</script>

<style lang="scss">
.manage-datasets {
  padding-bottom: 30px;

  .org-card-wrapper {
    width: 230px !important;
    padding-right: 15px;
  }

  .schemes-and-datasets {
    width: calc(100% - 230px) !important;
    padding-left: 15px;
    padding-right: 15px;
  }

  .uploader .upload-btn {
    height: calc(1.5em + 0.9rem + 2px);
  }

  .blue {
    color: #01183c;
  }

  .red {
    color: red;
  }

  .icon img {
    width: 20px;
    cursor: pointer;
  }

  .org-card {
    margin-top: 30px;
    position: sticky;
    top: 60px;

    .card {
      border: none;
      border-radius: 5px;
      box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.15);
    }

    .card-title {
      margin-bottom: 0px;
      text-align: center;
      font-size: 1.1rem;
      font-weight: 500;
    }
  }
}

.form-group.uploader .col {
  display: flex;
}
</style>
