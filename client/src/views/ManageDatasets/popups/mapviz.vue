<template>
  <div class="map-viz">
    <!-- Drop and Load file -->
    <b-form-group>
      <div class="d-flex align-items-center" id="">
        <div class="upload-label" style="min-width: 100px">
          <span>
            {{userTrans.add_shapefile}}
          </span>
          <span id="dataset_upload_info">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
          </span>
        </div>
        <b-form-file
          v-model="file"
          :browse-text="userTrans.browse_txt"
          :state="Boolean(file)"
          :drop-placeholder="userTrans.drop_file"
          :placeholder="userTrans.choose_file"
          accept=".geojson, .json"
        />

        <b-button
          v-if="file"
          variant="success"
          class="float-right ml-2 upload-btn"
          @click="handleFileUpload"
          >{{ userTrans.upload_text }}</b-button
        >
      </div>
    </b-form-group>

    <div>
      <b-alert variant="success" :show="showSuccessMessage">
        {{userTrans.upload_successful}}
      </b-alert>

      <b-alert variant="danger" :show="showErrorMessage !== false">
        {{showErrorMessage}}
      </b-alert>
    </div>
  </div>
</template>

<script>
import transMixin from '@/mixins/translation';
import {getRandomId} from '@/utils/formatters';
import axios from "@/plugins/axios";
import rewind from "geojson-rewind";

export default {
  props: {
    field: {
      type: Object,
      required: true
    },
    collectionName: {
      type: String,
      required: true
    }
  },
  mixins: [
    transMixin
  ],
  data() {
    return {
      file: null,
      showSuccessMessage: false,
      showErrorMessage: false,
    }
  },
  computed: {
    uniqueCollection() {
      let fileName = this.file ? this.file.name : "";
      fileName = fileName.slice(0, fileName.lastIndexOf("."));
      return `shapefile_${fileName.split(" ").join("_")}_${getRandomId()}`;
    }
  },
  methods: {
    handleFileUpload() {
      if (this.file && this.uniqueCollection) {
        this.file.text()
          .then(text => {
            const geojson = JSON.parse(text);

            if (geojson.features) {
              const { features = [] } = rewind(geojson, true);

              if (features.length) {
                axios.post(
                  '/api/collection/get-filters', 
                  { 
                    filter: this.field, 
                    collection: this.collectionName 
                  }
                ).then(resp => {
                  const arr = resp.data.map(d => d._id);
                  const names = features.map(d => d.properties.name);

                  if (!arr.some(d => names.indexOf(d) === -1)) {
                    this.upload(features);
                  } else {
                    this.showErrorMessage = "Shapefile does not have required properties. Name column of the shapefile should coincide with the categories of [segmentation variable name]";
                  }
                }).catch(e => {
                  this.showErrorMessage = e.message;
                })
              }
            }
          })
          .catch(e => {
            this.showErrorMessage = e.message;
          });
      }
    },
    upload(data) {
      var collection = this.uniqueCollection;
      return axios.post("/api/collection/upload", { data, collection }).then(() => {
        this.showSuccessMessage = true;
        this.showErrorMessage = false;
        this.$emit('on-save', collection);
      }).catch(e => {
        this.showErrorMessage = e.message;
      });
    }
  },

  mounted() {
    this.$tippy(this.$el.querySelector('#dataset_upload_info'), {
      allowHTML: true,
      content: this.userTrans.geojson_info_btn,
      maxWidth: 300,
      interactive: true
    })
  }
}
</script>