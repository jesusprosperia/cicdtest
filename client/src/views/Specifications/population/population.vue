<template>
  <div class="your-population">
    <!-- Dataset Dropdown -->
    <block-container :title="userTrans.select_dataset">
      <b-form-group :label="userTrans.load_from_server" label-for="dataset_select">
        <b-form-select 
          id="dataset_select" 
          v-model="selectedCollection" 
          :options="collections"
          :disabled="targetScheme != undefined"
          @change="changeServerFile"
        />
      </b-form-group>
    </block-container>

    <template v-if="selectedCollection && targetCollection">

      <filters 
        :filters="filterable"
        v-model="filters"
      />
      
      <criterias 
        :options="availableCriterias"
        v-model="criterias"
      />

      <policies ref="policies"
        :policies="policies"
        :variables="variables"
        :sections="sections"
        :shapeFiles="shapeFiles"
        @on-update="onPoliciesUpdate"
      />

      <b-row>
        <div class="w-100 d-flex justify-content-end mt-3">
          <b-button variant="success" @click="goToChart()">{{userTrans.go_to_chart}}</b-button>
        </div>
      </b-row>
    </template>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import { schemeChanged } from './utils';
import { roundToTwo } from '@/utils/round-number.js';
import { getRandomId } from '@/utils/formatters';
import BlockContainer from "@/components/ui/block-container.vue";
import filters from './filters/filters.vue';
import criterias from './criterias/criterias.vue';
import policies from './policies/policies.vue';
import _ from 'lodash';

export default {
  data() {
    return {
      // SCHEME PARAMS
      savedTargetSchemeId: null,
      savedTagetSchemeName: null,
      collection: null,
      selectedCollection: null,

      // FILTERS
      filterable: [], // filter options
      filters: [], // user selected filters

      // PRIORITIZATION CRITERIAS
      criterias: [],

      variables: [],
      policies: [],
      sections: [],
      shapeFiles: []
    };
  },
  computed: {
    ...mapState({
      userTrans: state => state.lang.userTrans,

      // list all available collections
      collections: state => {
        var files = [
          {
            value: null,
            text: "Please select"
          }
        ];

        state.scheme.collectionList.forEach(d => {
          files.push({
            value: d.collection,
            text: d.name
          });
        });

        return files;
      },

      // actual target_scheme object
      targetScheme: ({ scheme }) => scheme.targetScheme,

      schemeList: ({ scheme }) => scheme.schemeList,

      // actual collection object
      targetCollection: ({ scheme }) => scheme.targetCollection,

      dataLoading: state => state.dataLoading,

      target_scheme_name: ({ scheme }) => scheme.currentSchemeName,
    }),
    numericals() {
      return this.variables.filter(d => d.category == "numeric").map(d => d.propName);
    },
    availableCriterias() {
      const _criterias = this.criterias.map(d => d.criteria);
      return this.numericals.filter(d => _criterias.indexOf(d) === -1);
    },
    matchCase() {
      var match = {};

      this.filters.forEach(filter => {
        const filterValue = filter.filterValue;
        const field = filter.value;

        if (filter.type === 'categorical') {
          if (filterValue.length !== filter.values.length) {
            if (!match[field]) {
              match[field] = { $in: [] }
            }

            filterValue.forEach(d => {
              match[field].$in.push(d);
            });
          }
        } 
        else if (filter.type === 'numerical') {
          if (
            filterValue[0] != roundToTwo(filter.min) || 
            filterValue[1] != roundToTwo(filter.max)
          ) {
            match[field] = {
              $gte: filterValue[0].toString(),
              $lte: filterValue[1].toString()
            };
          }
        }
      });

      return match;
    },
    targetSchemeId () {
      return this.$route.params.scheme_id;
    },
    refId() {
      return this.$route.params.ref_id;
    }
  },
  methods: {
    ...mapActions([
      "getBudgetSum",
      "saveScheme",
      "addSchemeOrCol",
      "getCollection"
    ]),
    onPoliciesUpdate(policies) {
      this.policies = policies;
    },
    async goToChart() {
      if (!this.criterias.length) {
        return this.$flashStorage.flash('Please add prioritization criteria.', 'error', { timeout: 3000 });
      }

      await this.saveTargetScheme();

      this.$router.push(`/scenarios/${this.refId}/tree/${this.targetSchemeId}`)
    },
    changeServerFile() {
      if (this.selectedCollection) {
        this.getCollection({
          collection: this.selectedCollection,
          user_id: this.refId
        });
      }
    },
    setFilters() {
      var scheme = this.targetScheme;
      var collection = this.targetCollection;

      this.variables = collection.variables;
      
      // criterias can also be selectable as statistic field
      if (scheme && scheme.criterias) {
        scheme.criterias.forEach(d => {
          this.variables.push({ 
            propName: d.criteria, 
            category: 'statistic' 
          });
        })
      }

      this.setSections();
      this.setShapefiles();

      // all available filters
      this.filterable = collection.filters.map((d) => {
        var schemeFilter = scheme ? scheme.filters.find(x => x.filter === d.value) : null;
        var filterValue = null;

        if (d.type == "categorical") {
          filterValue = schemeFilter ? schemeFilter.values : d.values;
        }

        if (d.type == "numerical") {
          filterValue = schemeFilter ? 
            [roundToTwo(schemeFilter.min), roundToTwo(schemeFilter.max)] : 
            [roundToTwo(d.min), roundToTwo(d.max)];
        }

        return {
          ...d,
          filterValue
        }
      });

      // saved filters
      this.filters = scheme ? scheme.filters : [];
    },
    setTargetScheme() {
      this.selectedCollection = this.targetScheme.collection;
      this.criterias = this.targetScheme.criterias || [];
      this.policies = _.cloneDeep(this.targetScheme.policies) || [];

      this.savedTargetSchemeId = this.targetScheme.id;
      this.savedTagetSchemeName = this.targetScheme.name;
    },
    setSections() {
      if (
        this.targetCollection && 
        this.targetCollection.sections && 
        this.targetCollection.sections.length
      ) {
        let sections = [];
        let activeCriteria = this.criterias[0];

        if (activeCriteria) {
          const sectionByCriteria = this.targetCollection.sections.find(d => {
            return d.variable === activeCriteria.criteria;
          });

          if (sectionByCriteria) {
            sections = sectionByCriteria.sections;
          }
        }

        this.sections = sections;
      }
    },
    setShapefiles() {
      const {shapeFiles = []} = this.targetCollection || {};
      this.shapeFiles = shapeFiles.map(d => d.variable);
    },
    saveTargetScheme() {
      var targetScheme = {
        id: this.targetScheme ? this.targetScheme.id : (this.targetSchemeId || getRandomId()),
        name: this.targetScheme ? this.targetScheme.name : (this.target_scheme_name || 'scheme_' + getRandomId()),
        collection: this.selectedCollection,
        matchCase: JSON.stringify(this.matchCase),
        filters: this.filters,
        criterias: this.criterias,
        policies: this.policies
      }

      this.savedTargetSchemeId = targetScheme.id;
      this.savedTagetSchemeName = targetScheme.name;

      if (this.schemeList.some(d => d.id === targetScheme.id)) {
        var _schemeChanged = schemeChanged(targetScheme, this.targetScheme);

        // if filters changed, reset all tree state
        if (targetScheme.matchCase !== this.targetScheme.matchCase) {
          targetScheme.policies.forEach(d => {
            d.tree_state = null;
          });
        }

        if (Array.isArray(_schemeChanged)) {
          targetScheme.policies.forEach(d => {
            if (_schemeChanged.indexOf(d.id) > -1) {
              d.tree_state = null;
            }
          });
        }

        if (_schemeChanged) {
          return this.saveScheme({
            user_id: this.refId,
            scheme: targetScheme
          });
        }
      } else {
        return this.addSchemeOrCol({
          user_id: this.refId,
          scheme: targetScheme,
        })
      }
      
    }
  },
  watch: {
    matchCase(val) {
      if (this.selectedCollection && this.targetCollection) {
        this.getBudgetSum({
          collection: this.selectedCollection,
          match: val
        });
      }
    },
    targetScheme(val, oldVal) {
      if (!oldVal && val) {
        this.setTargetScheme();
      }
    },
    targetCollection(val, oldVal) {
      if (!oldVal && val) {
        this.setFilters();
      }
    },
    'criterias.0.criteria'(val, oldVal) {
      const policiesRef = this.$refs.policies;

      if (policiesRef) {
        policiesRef.onFirstCriteriaUpdate(val, oldVal)
      }

      this.setSections();
    }
  },
  created() {
    if (this.targetScheme && this.targetCollection && this.targetSchemeId) {
      this.setTargetScheme();
      this.setFilters();
    }
    console.log(this.refId);
  },
  components: {
    BlockContainer,
    filters,
    criterias,
    policies
  }
};
</script>

<style lang="scss">
  @import './population.vue.scss'; 
</style>
