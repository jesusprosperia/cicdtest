<template>
  <b-modal
    no-close-on-esc
    no-close-on-backdrop
    hide-header-close
    size="xl"
    v-model="show"
  >
    <div class="modal-inner-content">
      <div class="top-switch">
        <div class="tab-switcher">
          <div
            v-if="field && field.category === 'numeric'"
            :class="`w-50 text-center ${view == 'sections' ? 'active' : ''}`"
            @click="view = 'sections'"
          >
            Define Sections
          </div>
          <div
            v-if="field && field.category === 'categorical'"
            :class="`w-50 text-center ${view == 'map' ? 'active' : ''}`"
            @click="view = 'map'"
          >
            Geographic visualization
          </div>
        </div>
      </div>

      <Sections 
        v-show="view === 'sections'"
        v-if="field && field.category === 'numeric'"
        :currentSections="currentSections"
        :propName="field.propName"
        :collectionName="collectionName"
        @sections-updated="onSectionsUpdate"
      />

      <Mapviz 
        v-show="view === 'map'"
        v-if="field && field.category === 'categorical'"
        :field="field"
        :collectionName="collectionName"
        @on-save="(col) => shapeFile = col"
      />
    </div>
    <template v-slot:modal-footer>
      <div class="w-100">
        <b-button
          variant="success"
          size="sm"
          class="float-right"
          @click="onSave()"
        >
          Ok
        </b-button>

        <b-button
          variant="light"
          size="sm"
          class="float-right mr-3"
          @click="$emit('on-cancel')"
        >
          Cancel
        </b-button>
      </div>
    </template>
  </b-modal>
</template>

<script>
import Mapviz from './mapviz';
import Sections from './sections';

export default {
  props: {
    show: {
      type: Boolean,
      required: true
    },
    field: {
      type: Object,
      required: true
    },
    collectionName: {
      type: String,
      required: true
    },
    sections: {
      type: Array,
      default() {
        return [];
      }
    },
    xExtent: {
      type: Array,
      default() {
        return [1, 50];
      }
    },
    yExtent: {
      type: Array,
      default() {
        return [0, 0];
      }
    },
  },
  components: {
    Sections,
    Mapviz
  },
  data() {
    return {
      view: this.field && this.field.category === 'categorical' ? 'map' : "sections",
      currentSections: this.sections,
      currentXExtent: this.xExtent,
      currentYExtent: this.yExtent,
      shapeFile: null,
    }
  },
  methods: {
    onSave() {
      this.$emit('on-save', {
        sections: this.currentSections,
        shapeFile: this.shapeFile,
        xExtent: this.currentXExtent,
        yExtent: this.currentYExtent,
      });
    },
    onSectionsUpdate({
      sections,
      xExtent,
      yExtent,
    }) {
      this.currentSections = sections;
      this.currentXExtent = xExtent;
      this.currentYExtent = yExtent;
    }
  },
  watch: {
    sections() {
      this.currentSections = this.sections;
    },
    field() {
      this.view = this.field && this.field.category === 'categorical' ? 'map' : "sections";
    }
  }
}
</script>

<style lang="scss">
  .modal-inner-content {
    padding: 15px 80px;

    .tab-switcher {
      border-bottom: 1px solid #ddd;
      display: flex;
      padding: 0px 10px;
      width: 500px;
      margin: 0 auto 30px auto;

      & > div {
          cursor: pointer;
      }

      & > div.active {
          border-bottom: 1.5px solid #28a745;
      }
    }
  }
</style>