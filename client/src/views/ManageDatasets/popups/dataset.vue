<template>
    <b-modal
      size="xl"
      v-model="show"
      no-close-on-esc
      no-close-on-backdrop
      hide-header-close
      class="dataset"
    >
      <!-- Drop and Load file -->
      <b-form-group :label="userTrans.upload_file" label-cols="4">
        <b-form-file
          v-model="file"
          :browse-text="userTrans.browse_txt"
          :state="Boolean(file)"
          :drop-placeholder="userTrans.drop_file"
          :placeholder="userTrans.choose_file"
          accept=".csv"
        />
      </b-form-group>

      <!-- Dataset name and upload btn -->
      <div v-if="file">
        <b-form-group 
          :label="userTrans.name_the_dataset" 
          label-cols="4" class="uploader"
        >
          <input type="text" class="form-control" v-model="datasetName" />

          <b-button
            v-if="datasetName"
            variant="success"
            size="sm"
            class="float-right ml-2 upload-btn"
            @click="handleFileUpload"
            >{{ userTrans.upload_text }}</b-button
          >
        </b-form-group>
      </div>

      <!-- Upload status messages -->
      <div class="form-row">
        <div class="col-4"></div>
        <div class="col">
          <b-progress
            v-if="progress"
            :value="progress"
            :max="100"
            show-progress
            animated
            variant="success"
          ></b-progress>
          <b-alert variant="success" :show="showSuccessMessage">
              {{userTrans.upload_successful}}
          </b-alert>

          <b-alert variant="danger" :show="showErrorMessage">
              {{userTrans.upload_failed}}
          </b-alert>
        </div>
      </div>

      <!-- Variable table -->
      <div v-if="variables && !uploading">
        <b-form-group :label="userTrans.classify_variables" label-cols="4">
          <div class="matrix">
            <table class="table">
              <thead>
                <tr>
                  <th></th>
                  <th>{{ userTrans.numeric }}</th>
                  <th>{{ userTrans.categorical }}</th>
                  <th>{{ userTrans.factor_column }}</th>
                  <th>{{ userTrans.statistic_column }}</th>
                  <th>{{ userTrans.weight_column }}</th>
                  <th class="red">{{ userTrans.ignore }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(d, i) in variables" :key="`d-${i}`">
                  <th class="row-header">{{ d.propName }}</th>
                  <td>
                    <b-form-radio
                      :name="d.propName"
                      value="numeric"
                      v-model="d.category"
                    ></b-form-radio>
                  </td>
                  <td>
                    <b-form-radio
                      :name="d.propName"
                      value="categorical"
                      v-model="d.category"
                    ></b-form-radio>
                  </td>
                  <td>
                    <b-form-radio
                      :name="d.propName"
                      value="factor"
                      v-model="d.category"
                    ></b-form-radio>
                  </td>
                  <td>
                    <b-form-radio
                      :name="d.propName"
                      value="statistic"
                      v-model="d.category"
                    ></b-form-radio>
                  </td>
                  <td>
                    <b-form-radio
                      :name="d.propName"
                      value="weight"
                      v-model="d.category"
                    ></b-form-radio>
                  </td>
                  <td>
                    <b-form-radio
                      :name="d.propName"
                      value="ignore"
                      checked="checked"
                      v-model="d.category"
                    ></b-form-radio>
                  </td>
                  <td>
                    <b-button
                      size="sm"
                      variant="light"
                      @click="$emit('on-more-click', d)"
                      class="more-btn"
                    >
                      <img src="@/assets/more.svg" />
                    </b-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </b-form-group>
      </div>

      <!-- Footer -->
      <template v-slot:modal-footer>
        <div class="w-100">
          <b-button
            v-if="variables && !uploading"
            variant="success"
            size="sm"
            class="float-right"
            @click="onSave"
            >Save</b-button
          >

          <b-button
            variant="light"
            size="sm"
            class="float-right mr-3"
            @click="onCancelDatasetModal"
            >Cancel</b-button
          >
        </div>
      </template>
    </b-modal>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import transMixin from '@/mixins/translation';
import parseFile from "@/utils/uploader";
import * as mainTypes from '@/store/mutation-types';
import axios from "@/plugins/axios";
import {getRandomId} from '@/utils/formatters';

export default {
  name: "DatasetModal",
  mixins: [
    transMixin
  ],
  props: {
    show: {
      type: Boolean,
      required: true
    },
    sectionMap: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      file: null,
      datasetName: "",
      canceled: false,
      // variables: [{"propName": "income per capita before AE, BF and BPC", category: "numeric"}, {"propName":"uid","category":"ignore"},{"propName":"income_pov","category":"ignore"},{"propName":"y","category":"ignore"},{"propName":"urban","category":"ignore"},{"propName":"family_type","category":"ignore"},{"propName":"region","category":"ignore"},{"propName":"multidim_pov","category":"ignore"},{"propName":"filter","category":"ignore"},{"propName":"weight","category":"weight"},{"propName":"vulnerability","category":"ignore"},{"propName":"income_pov_p","category":"ignore"},{"propName":"multidim_pov_p","category":"ignore"}],
      variables: null,
      currentColletion: null,
      progress: 0,
      uploading: false,
      showSuccessMessage: false,
      showErrorMessage: false,
      chunkSize: 256 * 1024, // in bytes
    }
  },
  computed: {
    ...mapGetters(["userSettings"]),
    uniqueCollection() {
      return `data_${this.datasetName.split(" ").join("_")}_${getRandomId()}`;
    },
    user_id() {
      return this.$route.params.ref_id;
    }
  },
  methods: {
    ...mapActions([
      "addSchemeOrCol",
      "removeCollection"
    ]),
    async onCancelDatasetModal() {
      // force to save variables
      if (this.variables && !this.uploading) {
        var res = await this.$dialog.confirm({
          title: `Are you sure you want to cancel? The dataset will be removed. Please save to keep it!`,
        });

        if (!res) {
          return;
        }
      }

      // cancel if upload in progress
      if (this.uploading) {
        this.canceled = true;
      }

      // if collection, remove collection
      if (this.currentColletion) {
        await this.removeCollection({
          collection: this.currentColletion,
          user_id: this.user_id,
        });

        this.currentColletion = null;
      }

      this.showErrorMessage = false;
      this.showSuccessMessage = false;
      this.file = null;
      this.variables = null;
      this.datasetName = "";

      this.$emit('on-cancel');
    },
    async onSave() {
      var variables = this.variables.filter((d) => d.category !== "ignore");

      if (variables.length === 0) {
        return this.flash(
          this.userTrans.no_variables_warning,
          "error"
        );
      }

      if (variables.filter(d => d.category === "weight").length !== 1) {
        return this.flash(
          this.userTrans.no_weight_warning,
          "error"
        );
      }

      this.$store.commit(mainTypes.SET_DATA_LOADING, true);

      var uniqueCollection = this.uniqueCollection;
      var filters = await this.getFilters(variables.filter(d => d.category === "numeric" || d.category === "categorical"));
      var numericVariables = this.variables.filter((d) => d.category === "numeric");
      var categoricalVariables = this.variables.filter((d) => d.category === "categorical");

      var sections = [];
      var extents = [];

      numericVariables.forEach((d) => {
        const m = this.sectionMap[d.propName];

        if (m) {
          sections.push({
            sections: m.sections,
            variable: m.variable,
          });

          extents.push({
            xExtent: m.xExtent,
            yExtent: m.yExtent,
            variable: m.variable,
          });
        }
      });

      var shapeFiles = [];

      categoricalVariables.forEach(d => {
        if (this.sectionMap[d.propName]) {
          shapeFiles.push({
            collection: this.sectionMap[d.propName].shapeFile,
            variable: d.propName
          })
        }
      })

      var payload = {
        collection: {
          name: this.datasetName,
          collection: uniqueCollection,
          variables: variables,
          filters: filters,
          sections: sections,
          extents: extents,
          shapeFiles: shapeFiles
        },
      };

      if (this.user_id) {
        payload.user_id = this.user_id;
      }

      await this.addSchemeOrCol(payload);

      this.$store.commit(mainTypes.SET_DATA_LOADING, false);

      this.file = null;
      this.variables = null;
      this.currentColletion = null;
      this.showSuccessMessage = false;
      this.showErrorMessage = false;
      this.datasetName = "";

      this.$emit('on-save');
    },
    getFilters(variables) {
      return Promise.all(
        variables.map((d) => {
          return axios.post("/api/collection/get-filters", {
            filter: d,
            collection: this.uniqueCollection,
          });
        })
      ).then((resp) => {
        var filters = [];

        resp
          .map((d) => d.data)
          .forEach((r, i) => {
            var v = variables[i];

            if (v.category === "numeric") {
              filters.push({
                type: "numerical",
                text: v.propName,
                value: v.propName,
                min: r[0].min,
                max: r[0].max,
              });
            } else if (v.category === "categorical") {
              var groups = r.map((d) => d._id);

              filters.push({
                type: "categorical",
                text: v.propName,
                value: v.propName,
                values: groups,
              });
            }
          });

        return filters;
      });
    },
    uploadChunk(data, collection) {
      this.currentColletion = collection;

      data.forEach((d) => {
        Object.keys(d).forEach((key) => {
          var val = d[key];

          if (!isNaN(val)) {
            d[key] = +val;
          }
        });
      });

      return axios.post("/api/collection/upload", { data, collection });
    },
    handleFileUpload() {
      const file = this.file;
      const self = this;

      if (!file) return;

      var allowed_size = this.userSettings.max_dataset_size;

      if (file.size > allowed_size * (1024 * 1024)) {
        return this.flash(
          `File size exceeds ${allowed_size} megabytes`,
          "error"
        );
      }

      this.uploading = true;
      this.showSuccessMessage = false;

      parseFile(file, {
        chunk_size: this.chunkSize,
        chunk_read_callback: (data, p, chunkNumber, next) => {
          if (!data.length) {
            return;
          }

          if (chunkNumber == 1) {
            var header = Object.keys(data[0]).filter((d) => d.length);
            this.variables = header.map((d) => ({
              propName: d,
              category: d === "weight" ? "weight" : "ignore"
            }));
          }

          this.progress = p * 100;

          this.uploadChunk(data, this.uniqueCollection)
            .then(() => {
              if (this.canceled) {
                throw new Error();
              }
              next();
            })
            .catch(this.errorCallback);
        },
        success: () => {
          self.showSuccessMessage = true;
          self.progress = 0;
          self.uploading = false;

          self.$emit('on-uploaded', {
            collection: self.uniqueCollection
          });
        },
        error_callback: this.errorCallback,
      });
    },
    errorCallback() {
      this.progress = 0;
      this.uploading = false;
      this.variables = null;
      this.showSuccessMessage = false;
      this.showErrorMessage = true;
      this.canceled = false;
      this.file = null;
    },
  },
}
</script>

<style lang="scss">
.uploader .upload-btn {
  height: calc(1.5em + 0.9rem + 2px);
}

.matrix {
  overflow: auto;
  height: 450px;

  .red {
    color: red;
  }

  td {
    text-align: center;
  }

  thead th {
    text-align: center;
    border-top: none;
    position: sticky;
    background-color: #fff;
    top: 0;
    border-collapse: separate;
    cursor: pointer;
    z-index: 1;
  }

  .more-btn {
    padding: 0px 5px;
    img {
      width: 24px;
      height: 24px;
    }
  }
}
</style>