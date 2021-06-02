<template>
  <block-container 
    :title="userTrans.define_tar_pop"
  >
    <div class="filter-container"
      v-for="(d, i) in filtersConfig.filter(d => d.active)" 
      :key="i" 
    >
      <div class="d-flex align-items-center">

        <multiselect
          v-model="d.selectedFilter"
          :options="filters"
          :multiple="false"
          :searchable="false"
          track-by="value"
          label="text"
        />

        <div 
          class="pl-2 delete-icon" 
          @click="removeFilter(d)"
        >
          <img src="@/assets/delete.svg" />
        </div>

      </div>
      <div v-if="d.selectedFilter">
        <div v-if="d.selectedFilter.type == 'categorical'" class="filter-row">

          <b-form-group>
            <b-form-checkbox-group
              v-model="d.selectedFilter.filterValue"
              :options="d.selectedFilter.values.slice().sort().map(x => ({text: x, value: x}))"
            />
          </b-form-group>

        </div>
        <div v-if="d.selectedFilter.type == 'numerical'" class="filter-row numerical">

          <VueSlider
            :enable-cross="false"
            :tooltip-merge="false"
            :clickable="false"
            :step="0.01"
            :min="d.selectedFilter.min"
            :max="d.selectedFilter.max"
            v-model="d.selectedFilter.filterValue"
          />

        </div>
      </div>
    </div>
    <div class="mt-2" v-if="filtersCounter < numOfFilters">
      <b-button
        class="button-add"
        variant="success"
        @click="addFilter()"
      >{{userTrans.add_filter}}</b-button>
    </div>
  </block-container>
</template>

<script>
import {mapState} from 'vuex';
import BlockContainer from "@/components/ui/block-container.vue";
import Multiselect from "vue-multiselect";
import VueSlider from "vue-slider-component";

export default {
  props: {
    value: {
      type: Array,
      required: true
    },
    filters: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      numOfFilters: 1,
      filtersCounter: 0,
      filtersConfig: []
    }
  },
  components: {
    BlockContainer,
    Multiselect,
    VueSlider
  },
  computed: {
    ...mapState({
      userTrans: state => state.lang.userTrans,
    })
  },
  methods: {
    addFilter() {
      const filter = this.filtersConfig[this.filtersCounter];
      if (filter) {
        filter.active = true;

        this.filtersConfig = this.filtersConfig.sort((a, b) => b.active - a.active);
        this.filtersCounter++;
      }
    },
    removeFilter(d) {
      d.active = false;
      d.selectedFilter = null;

      this.filtersCounter = Math.max(this.filtersCounter - 1, 0);
      this.filtersConfig = this.filtersConfig.sort((a, b) => b.active - a.active);
    },
    setFilterConfig() {
      this.numOfFilters = this.filters.length;

      this.filtersConfig = this.filters.map(() => ({
        active: false,
        selectedFilter: null
      }));
      
      if (this.value && this.value.length) {
        this.value.forEach((d, i) => {
          if (this.filtersConfig[i]) {
            this.filtersConfig[i].active = true;
            this.filtersConfig[i].selectedFilter = d;
          }
        });
        this.filtersCounter = this.value.length;
      }

    }
  },
  watch: {
    filters() {
      this.setFilterConfig();
    },
    filtersConfig: {
      handler(value) {
        const filters = value
          .filter(d => d.active && d.selectedFilter)
          .map(d => d.selectedFilter);

        this.$emit('input', filters);
      },
      deep: true
    }
  },
  created() {
    this.setFilterConfig();
  }
}
</script>

<style lang="scss">
  .filter-container {
    margin-bottom: 10px;

    .filter-row {
      padding: 10px;

      .form-group {
        margin: 0;
      }
    }

    .numerical {
      padding-top: 40px;

      .vue-slider-dot-tooltip-inner, .vue-slider-process {
        background-color: var(--secondary-color) !important;
        border-color: var(--secondary-color) !important;
      }

      .vue-slider-dot-tooltip {
        visibility: visible !important;
      }
    }
  }
</style>