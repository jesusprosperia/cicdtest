<template>
  <div class="h-100 tree-page" :id="'tree-page-' + tree_config.id">

    <template v-if="tree_config.tree_state || initialData.length">

      <div class="p-0 h-100 tree-view-container">
        <!-- Tree -->
        <div v-show="!isAggrTree || chartView.type === 'tree'">
          <tree 
            ref="treeChart" 
            :config="tree_config"
            :initialData="initialData"
            @on-nodes-update="onNodesUpdate"
          />
        </div>

        <!-- Map -->
        <div v-if="isAggrTree && chartView.mapConfig" v-show="chartView.type === 'map'">
          <mapviz
            ref="mapViz"
            :mapConfig="chartView.mapConfig"
            :config="tree_config"
            @on-nodes-update="onMapNodesUpdate"
          />
        </div>
      </div>

      <div class="budget-view-container">
        <stacked-bar 
          v-show="!isAggrTree || chartView.type === 'tree'"
          :nodes="nodes"
          :budget="tree_config.budget"
          :treeType="tree_config.type"
        />

        <stacked-bar-map 
          v-if="isAggrTree && chartView.mapConfig" v-show="chartView.type === 'map'"
          :nodes="mapNodes"
          :budget="tree_config.budget"
        />
      </div>

    </template>

  </div>
</template>

<script>
import mapviz from '@/components/charts/map/map.vue';
import tree from '@/components/charts/tree/tree.vue';
import stackedBar from '@/components/charts/stacked-bar/stacked-bar';
import { getValue, getValue2d } from '@/utils/percentile';
import * as mainTypes from '@/store/mutation-types';
import {getMatch} from '@/utils/chart';
import {extent} from 'd3-array';
import {loadTotalPopulationBins} from '@/components/charts/shared/data';
import StackedBarMap from '@/components/charts/stacked-bar/stacked-bar-map.vue';

export default {
  props: {
    scheme_id: {
      type: Number,
      required: true
    },
    tree_config: {
      type: Object,
      required: true
    },
    chartView: {
      type: Object,
      required: true
    }
  },
  components: {
    tree,
    stackedBar,
    mapviz,
    StackedBarMap
  },
  data() {
    return {
      nodes: [],
      mapNodes: [],
      initialData: []
    }
  },
  computed: {
    isAggrTree() {
      return this.tree_config.type === 'aggregation';
    }
  },
  methods: {
    getState() {
      let mapConfig = null;

      if (this.isAggrTree && this.chartView.mapConfig && this.$refs.mapViz) {
        mapConfig = this.$refs.mapViz.getConfig();
      }

      return {
        root: this.$refs.treeChart.getRoot(),
        mapConfig: mapConfig,
        chartView: this.chartView.type,
      }
    },
    getTreeChartRef() {
      return this.$refs.treeChart;
    },
    onMapNodesUpdate(nodes) {
      this.mapNodes = nodes;
    },
    onNodesUpdate(nodes) {
      this.nodes = nodes;

      if (!this.isAggrTree) {
        this.$emit('on-tree-update', this.nodes.map((node) => {
          const data = node.data;
          const match = getMatch(node) || [];

          return {
            set: match.map(d => {
              return { [d.name]: d.value }
            }),
            amount: data.mon_cost ? data.mon_cost.value : 0,
            threshold: data.value,
            impact_factor: data.impact_factor,
            cost_factor: data.cost_factor ? data.cost_factor.name : null
          }
        }));
      }
    },
    loadInitialBins() {
      this.$store.commit(mainTypes.SET_DATA_LOADING, true);

      return loadTotalPopulationBins(this.tree_config).then(resp => {
        this.$store.commit(mainTypes.SET_DATA_LOADING, false);
        return resp;
      }).catch(() => {
        this.$store.commit(mainTypes.SET_DATA_LOADING, false);
      });
    },
    async initTree() {
      if (!this.tree_config.tree_state) {
        this.initialData = await this.loadInitialBins();
 
        // for aggregation tree, I am using the section set from population page as threshold
        if (
          this.isAggrTree &&
          this.tree_config.selected_section
        ) {
          const _ext = extent(this.initialData, d => d.criteria);
          const value = this.tree_config.criteriaPriority === 'low' ? _ext[1] : _ext[0];
          return this.tree_config.defaultThresholdValue = value;
        }

        const p = this.tree_config.budgetPercent / 100;
      
        if (this.tree_config.selectionType == '1d') {
          this.tree_config.defaultThresholdValue = getValue(this.initialData, p, this.tree_config.criteriaPriority);
        } else {
          this.tree_config.defaultThresholdValue = getValue2d(this.initialData, p, this.tree_config.criteriaPriority);
        }
      }
    },
    updateAggrTree() {
      if (this.$refs.treeChart) {
        this.$refs.treeChart.updateAllChildNodes();

        if (this.$refs.mapViz) {
          this.$refs.mapViz.loadBins();
        }
      }
    }
  },
  async created() {
    await this.initTree();
  }
}
</script>

<style lang="scss" scoped>
  $budgetViewWidth: 223px;

  .tree-page {
    display: flex;

    .tree-view-container {
      width: calc(100% - #{$budgetViewWidth});
      position: relative;
    }

    .budget-view-container {
      width: $budgetViewWidth;
    }
  }
</style>