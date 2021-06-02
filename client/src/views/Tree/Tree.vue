<template>
  <div v-if="targetScheme && targetCollection" class="tree">
    <div class="sidebar">
      <Sidebar 
        :tabs="tabs"
        :activeTab="activeTab"
        :scheme_id="scheme_id"
        :treePageRefs="treePageRefs"
        :aggrTreeUpdateEnabled="aggrTreeUpdateEnabled"
        @on-policies-select="onPoliciesSelect"
        @chart-type-select="onChartTypeSelect"
      />
    </div>

    <div class="chart-area" >
      <Cockpit
        :tabs="tabs"
        :activeTab="activeTab"
        @on-change-tab="onChangeTab"
      />

      <div id="tree_content">
        <TreePage
          ref="treePage"
          v-for="(tab, i) in tabs"
          :key="tab.id"
          v-show="i === activeTab"
          :scheme_id="+scheme_id"
          :tree_config="tab.config"
          :chartView="tab.config.chart_view"
          @on-tree-update="(leaves) => onTreeUpdate(tab.policy_name, leaves)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Sidebar from './Sidebar/Sidebar.vue';
import Cockpit from './Cockpit/Cockpit.vue';
import TreePage from "./TreePage/TreePage.vue";
import { mapState, mapActions } from "vuex";
import * as schemeTypes from "@/store/modules/scheme/mutation-types";
import * as treeTypes from "@/store/modules/tree/mutation-types";

export default {
  props: ["scheme_id"],
  components: {
    TreePage,
    Cockpit,
    Sidebar
  },
  data() {
    return {
      policiesToAggregate: [],
      requestPolicies: [],
      tabs: [],
      activeTab: 0,
      treePageRefs: [],
      aggrTreeUpdateEnabled: false
    };
  },
  computed: {
    ...mapState({
      // actual target_scheme object
      targetScheme: ({ scheme }) => scheme.targetScheme,

      // actual collection object
      targetCollection: ({ scheme }) => scheme.targetCollection,
    }),
    refId() {
      return this.$route.params.ref_id;
    }
  },
  methods: {
    ...mapActions(['getScheme']),
    updateAggrTree() {
      const currentTab = this.tabs[this.activeTab];

      if (currentTab.type === "aggregation" && this.aggrTreeUpdateEnabled) {
        this.aggrTreeUpdateEnabled = false;
        const aggrTree = this.$refs["treePage"][this.activeTab];

        if (aggrTree && this.requestPolicies) {
          return aggrTree.updateAggrTree();
        }
      }
    },
    onChangeTab(i) {
      this.activeTab = i;      
      const currentTab = this.tabs[i];
      // if switching from policy tab to aggr tab, it automatically update the aggr tree
      if (currentTab.type === "aggregation") {
        this.updateAggrTree();
      }
    },
    onPoliciesSelect(pols) {
      this.policiesToAggregate = pols;
      this.aggrTreeUpdateEnabled = true;

      this.$store.commit(
        treeTypes.SET_REQUEST_POLICIES, 
        this.requestPolicies.filter(d => this.policiesToAggregate.indexOf(d.id) > -1)
      );
    },
    onChartTypeSelect(chartView) {
      const tabIndex = this.tabs.findIndex(d => d.type === "aggregation");

      if (tabIndex > -1) {
        this.tabs[tabIndex].config.chart_view = chartView;
      }
    },
    onTreeUpdate(name, leaves) {
      const policyIndex = this.requestPolicies.findIndex((d) => d.name === name);

      if (policyIndex > -1) {
        this.requestPolicies[policyIndex].leaves = leaves;

        const currentTab = this.tabs[this.activeTab];

        // important check to avoid update button animation on first load
        if (currentTab && currentTab.type !== "aggregation") {
          this.aggrTreeUpdateEnabled = true;
        }

        this.$store.commit(
          treeTypes.SET_REQUEST_POLICIES, 
          this.requestPolicies.filter(d => this.policiesToAggregate.indexOf(d.id) > -1)
        );
      }
    },
    getSingleConfig(
      policy,
      {
        filters,
        criterias,
        collection,
        matchCase,
        categoricalFilters,
        numericalFilters,
        schemeSections,
        hasPostPolicy,
        shapeFiles,
        extents,
      }
    ) {
      const criteria = criterias.map((d) => d.criteria);
      const selectionType = criterias.length > 1 ? "2d" : "1d";
      const criteriaPriority = selectionType == "1d" ? criterias[0].priority : criterias.map((d) => d.priority);
      const firstCriteria = criteria[0];
      const sections = schemeSections.filter((d) => d.variable == firstCriteria)[0];
      const extent = extents.find(d => d.variable === firstCriteria);
      const binsEndpoint = (selectionType == "1d") ? "/api/compute/bins" : "/api/compute/bins2d";
      const current_cost_factor = policy.costsFormModel.costFactors ? policy.costsFormModel.costFactors[0] : null;
      const _matchCase = (matchCase && Object.keys(matchCase).length > 0) ? matchCase : null;
      const _impactFactor = policy.costsFormModel.impactFactors ? policy.costsFormModel.impactFactors[0] : null;
      const _costFactor = policy.type === "normal" ? current_cost_factor : { name: "cost" };

      const maps = (policy.shapeFiles || []).map(d => {
        return {
          collection: shapeFiles[d],
          field: d
        }
      });

      let mapConfig = null;

      if (policy.type === "aggregation" && maps.length > 0) {
        const map_state = policy.map_state || {};
        let { mapField: field, collection } = map_state;

        // if map settings was not saved yet, just use first one from maps
        if ((!field || !collection)) {
          field = maps[0].field;
          collection = maps[0].collection;
        }
        
        mapConfig = {
          field: field,
          collection: collection
        };
      }

      return {
        id: policy.id,
        type: policy.type, // policy type
        hasPostPolicy,
        binsEndpoint,
        selectionType, // 1d or 2d
        criteria,
        sections: sections ? sections.sections : [],
        criteriaPriority, // low or high
        splitBy: policy.split_columns, // segmentation variables
        budgetPercent: policy.budgetPercent,
        budget: policy.budget,
        collection: collection, // collection name
        matchCase: _matchCase, // all filters
        categoricalFilters: categoricalFilters,
        numericalFilters: numericalFilters,
        cost_type: policy.costsFormModel.cost_type, // monetary or simple
        mon_cost: policy.costsFormModel.mon_cost,
        impact_factors: policy.costsFormModel.impactFactors,
        current_impact_factor: _impactFactor,
        cost_factors: policy.costsFormModel.costFactors,
        current_cost_factor: _costFactor,
        pie_label: policy.costsFormModel.pie_label,
        selected_section: policy.costsFormModel.selectedSection,
        statistics: policy.statistics,
        tree_state: policy.tree_state, // saved tree state
        description: policy.description,
        description_json: policy.description_json,
        maxLevels: policy.maxLevels, // tree max level
        map_state: policy.map_state, // saved map state
        chart_view: { 
          type: policy.chart_view || "tree", 
          mapConfig: mapConfig
        },
        maps, // map variables and collections
        filters,
        xExtent: extent ? extent.xExtent : null,
        yExtent: extent ? extent.yExtent : null,
      };
    },
    initChartConfig() {
      const scheme = this.targetScheme;
      const collection = this.targetCollection;

      if (scheme && collection) {
        var criterias = scheme.criterias;
        var matchCase = JSON.parse(scheme.matchCase || "{}");
        var categoricalFilters = {};
        var numericalFilters = {};

        if (collection && collection.filters) {
          collection.filters.forEach((d) => {
            if (d.type === "categorical") {
              categoricalFilters[d.value] = d.values;
            } else if (d.type === "numerical") {
              numericalFilters[d.value] = { min: d.min, max: d.max };
            }
          });
        }

        var shapeFiles = {};

        if (collection && collection.shapeFiles) {
          collection.shapeFiles.forEach(d => {
            shapeFiles[d.variable] = d.collection;
          });
        }

        this.$store.commit(schemeTypes.SET_CURRENT_SCHEME_NAME, scheme.name);

        const hasPostPolicy = scheme.policies.some(d => {
          return d.costsFormModel && d.costsFormModel.impactFactors && d.costsFormModel.impactFactors.length > 0;
        });

        this.activeTab = scheme.active_tab || 0;
        this.tabs = scheme.policies.map((d, i) => {
          return {
            id: "tab-" + i,
            policy_id: d.id,
            policy_name: "pol_" + i,
            name: d.name,
            short_name: d.short_name,
            type: d.type,
            config: this.getSingleConfig(d, {
              filters: scheme.filters,
              criterias,
              matchCase,
              collection: scheme.collection,
              categoricalFilters,
              numericalFilters,
              schemeSections: collection.sections || [],
              hasPostPolicy,
              shapeFiles,
              extents: collection.extents || []
            }),
          };
        });

        this.requestPolicies = this.tabs
          .filter((d) => d.type === "normal")
          .map((d) => {
            return {
              id: d.policy_id,
              name: d.policy_name,
              leaves: null,
            };
          });

        this.policiesToAggregate = this.requestPolicies.map(d => d.id);

        setTimeout(() => {
          this.treePageRefs = this.$refs.treePage || [];
        }, 10);
      }
    }
  },
  watch: {
    targetScheme(newVal, oldVal) {
      if (!oldVal && newVal) {
        this.initChartConfig();
      }
    },
  },
  created() {
    if (this.scheme_id) {
      if (this.targetScheme && this.targetScheme.id === this.scheme_id) {
        this.initChartConfig();
      } else {
        this.getScheme({ 
          scheme_id: this.scheme_id,
          user_id: this.refId,
        });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
  .tree {
    display: flex;
    width: 100%;
    height: 100%;

    .sidebar {
      padding-top: 44px;
      width: 48px;
      height: calc(100vh - 57px);
    }

    .chart-area {
      height: 100%;
      width: calc(100% - 48px);
    }
  }
</style>
