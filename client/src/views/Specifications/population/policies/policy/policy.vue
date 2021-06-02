<template>
  <b-card no-body class="mb-3" ref="card">
    <b-card-header header-tag="header" class="p-1" role="tab">
      <b-button 
        block 
        variant="light"
        @click="policyVisible = !policyVisible"
      >
        {{localPolicy.name}}
      </b-button>
      <div class="pl-2 delete-icon" @click="$emit('on-remove')">
        <img src="@/assets/delete.svg" />
      </div>
    </b-card-header>

    <b-collapse v-model="policyVisible" role="tabpanel">
      <b-card-body>
        <b-card-text>
          <!-- Policy Name -->
          <block :title="'Specify Policy Name'">
            <b-form-group 
              :label="'Name:'"
            >
              <b-form-input
                type="text"
                v-model="localPolicy.name"
                :formatter="e => String(e).substring(0, 30)"
              />
            </b-form-group>

            <b-form-group 
              :label="'Short Name:'"
            >
              <b-form-input
                type="text"
                v-model="localPolicy.short_name"
                :formatter="e => String(e).substring(0, 4)"
              />
            </b-form-group>
          </block>

          <!-- Split By -->
          <block :title="userTrans.segmentation_criteria">
            <b-form-group :label="userTrans.split_columns">
              <multiselect
                v-model="localPolicy.split_columns"
                :options="categoricalFields"
                :multiple="true"
              ></multiselect>
            </b-form-group>

            <b-form-group :label="userTrans.max_tree_level">
              <b-form-input 
                type="number"
                :min="1"
                :max="10"
                v-model.number="localPolicy.maxLevels"
                @change="(e) => localPolicy.maxLevels = Math.max(1, Math.min(10, e))"
              />
            </b-form-group>
          </block>

          <!-- Impact and Cost factors -->
          <costs v-if="localPolicy.type === 'normal'"
            v-model="localPolicy.costsFormModel"
            :sections="sections"
            :costFactorFields="[...factorFields]"
            :impactFactorFields="[...factorFields]"
            :policyName="localPolicy.short_name"
          />
          
          <aggr-section v-if="localPolicy.type === 'aggregation'"
            v-model="localPolicy.costsFormModel"
            :sections="sections"
          />

          <statistics 
            v-model="localPolicy.statistics"
            :sections="sections"
            :columns="statColumns"
          />

          <mapviz v-if="localPolicy.type === 'aggregation'"
            v-model="localPolicy.shapeFiles"
            :shapeFiles="shapeFiles"
          />

          <budget 
            v-model="localPolicy.budget"
            :budgetSum="budgetSum"
            :budgetPercent="budgetPercent"
          />

          <description 
            v-model="localPolicy.description" 
            @on-json-update="(json) => localPolicy.description_json = json"
          />
        </b-card-text>
      </b-card-body>
    </b-collapse>
  </b-card>
</template>

<script>
import { mapState } from "vuex";

import Multiselect from "vue-multiselect";
import Block from "../../block/block.vue";

import costs from '../../costs/costs.vue';
import description from '../../description/description.vue';
import budget from '../../budget/budget.vue';
import statistics from '../../statistics/statistics.vue';
import aggrSection from '../../aggrSection/aggrSection.vue'
import mapviz from '../../mapviz/mapviz.vue';

export default {
  props: {
    policy: {
      type: Object,
      required: true
    },
    visible: {
      type: Boolean,
      default: false
    },
    categoricalFields: {
      type: Array,
      required: true
    },
    numericalFields: {
      type: Array,
      required: true
    },
    factorFields: {
      type: Array,
      required: true
    },
    statColumns: {
      type: Array,
      required: true
    },
    sections: {
      type: Array,
      required: true
    },
    shapeFiles: {
      type: Array,
      default: () => []
    }
  },
  components: {
    costs,
    description,
    budget,
    statistics,
    Multiselect,
    Block,
    aggrSection,
    mapviz
  },
  data() {
    return {
      policyVisible: this.visible,
      localPolicy: Object.assign({
        type: 'normal',

        name: 'Policy',
        short_name: 'Pol',

        split_columns: [],
        budget: 0,
        tree_state: null,

        shapeFiles: [],

        // COSTS
        costsFormModel: {},

        // STATISTICS
        statistics: [],

        // DESCRIPTION
        description: '',
        description_json: {},
        maxLevels: 3
      }, this.policy)
    }
  },
  computed: {
    ...mapState({
      userTrans: state => state.lang.userTrans,
      budgetSumStore: state => state.scheme.budgetSum,
    }),
    budgetSum() {
      var s = this.budgetSumStore || 0;
      const costsFormModel = this.localPolicy.costsFormModel;

      if (costsFormModel.cost_type === 'adjustable' && costsFormModel.mon_cost.value) {
        s *= costsFormModel.mon_cost.value;
      }
      
      return s;
    },
    budgetPercent() {
      var { budget } = this.localPolicy;
      var { budgetSum } = this;

      if (budgetSum) {
        return (budget == budgetSum) ? 100 : (budget / budgetSum) * 100;
      }

      return 0;
    }
  },
  methods: {
    collapsePanel() {
      this.policyVisible = false;
    }
  },
  watch: {
    localPolicy: {
      handler(value) {
        this.$emit('on-update', {
          ...value, 
          budgetPercent: this.budgetPercent 
        });
      },
      deep: true
    },
    statColumns() {
      this.localPolicy.costsFormModel.selectedSection = null;
    },
    'localPolicy.costsFormModel.cost_type'(newVal, oldVal) {
      // ommit initial change
      if (oldVal) {
        this.localPolicy.budget = 0;
      }
    },
    'localPolicy.costsFormModel.mon_cost.value'(newVal, oldVal) {
      // ommit initial change
      if (oldVal) {
        this.localPolicy.budget = 0;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .card-header {
    position: relative;

    .delete-icon {
      position: absolute;
      right: 15px;
      top: 8px;
      z-index: 1;
    }
  }
</style>