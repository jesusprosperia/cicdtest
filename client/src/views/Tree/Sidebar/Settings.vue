<template>
  <div class="settings">
    <!-- Policies to aggregate -->
    <div class="settings-row">
      <div class="title">{{ userTrans.policies_to_aggregate }}</div>
      <div
        v-for="(policy, i) in policies"
        :key="i"
        class="field-row"
      >
        <label class="label">{{policy.name}}</label>
        <b-form-checkbox 
          v-model="policy.selected" 
          switch 
        />
      </div>
    </div>

   <div class="settings-row" v-if="config && config.maps && config.maps.length > 0">
      <div class="title">{{ userTrans.chart_type }}</div>

      <div class="chart-type-buttons">
        <button 
          :class="`chart-type-btn ${chartType === 'tree' ? 'selected' : ''}`"
          @click="selectChartType('tree')"
        >
          <img src="@/assets/tree.png" />
        </button>

        <button 
          :class="`chart-type-btn ${chartType === 'map' ? 'selected' : ''}`"
          @click="selectChartType('map')"
        >
          <img src="@/assets/map.png" />
        </button>
      </div>

      <div class="select-fields" v-if="chartType === 'map'">
        <!-- Map field switches -->
        <div class="wrapper">
          <div class="subtitle">{{userTrans.select_map_field}}</div>

          <div>
            <b-form-select 
              v-model="mapField" 
              :options="config.maps.map(d => d.field)" 
              size="sm"
              @change="emitChartType()"
            />
          </div>
        </div>
      </div>
   </div>
  </div>
</template>

<script>
import transMixin from '@/mixins/translation';
import {mapState} from 'vuex';

export default {
  mixins: [transMixin],
  props: {
    scheme_id: {
      type: String,
      required: true
    },
    config: {
      type: Object,
      required: true
    }
  },
  data() {
    const map_state = this.config.map_state || {};
    let { mapField } = map_state;

    // if map settings was not saved yet, just use first one from maps
    if (!mapField && this.config.maps && this.config.maps[0]) {
      mapField = this.config.maps[0].field;
    }

    const {type: chartType} = this.config.chart_view || { type: "tree" };

    return {
      policies: [],
      chartType: chartType,
      mapField: mapField
    }
  },
  computed: {
    ...mapState({
      targetScheme: ({ scheme }) => scheme.targetScheme,
    }),
    statOptions() {
      const impact = {
        value: 'impact', 
        text: this.config.pie_label
      }

      const stats = this.config.statistics.map(d => ({ 
        ...d, 
        value: d.column, 
        text: d.name 
      }));

      return [
        impact, 
        ...stats
      ]
    }
  },
  watch: {
    policies: {
      handler(val, oldVal) {
        const selected = this.policies.filter(d => d.selected);
        if (oldVal.length > 0) {
          this.$emit('on-policies-select', selected.map(d => d.id));
        }
      },
      deep: true
    },
    config() {
      this.mapField = this.config.maps[0] ? this.config.maps[0].field : null;
    }
  },
  methods: {
    emitChartType() {
      const mapConfig = this.config.maps.find(d => d.field === this.mapField);
      
      if (mapConfig) {
        this.$emit('chart-type-select', {
          type: this.chartType,
          mapConfig: {
            ...mapConfig,
          }
        });
      }
    },
    selectChartType(type) {
      this.chartType = type;
      this.emitChartType();
    }
  },
  created() {
    const tarScheme = this.targetScheme;

    if (tarScheme) {
      this.policies = tarScheme.policies
        .filter((d) => d.type === "normal")  
        .map(d => {
          return {
            id: d.id,
            name: d.name,
            selected: true
          }
        })
    }

    this.emitChartType();
  }
}
</script>

<style lang="scss" scoped>
.settings {
  padding: 15px;

  .settings-row {
    margin-top: 20px;

    .select-fields {
      margin-top: 15px;
    }

    .wrapper {
      margin-bottom: 15px;
    }

    .title {
      color: #cccccc;
      text-transform: uppercase;
      font-size: 13px;
      margin-bottom: 12px;
      font-weight: 500;
    }

    .subtitle {
      color: #aaa;
      text-transform: uppercase;
      font-size: 11px;
      margin-bottom: 6px;
      font-weight: 500;
    }

    .field-row {
      display: flex;
      align-items: center;
      border-bottom: 1px solid #ddd;

      .label {
        flex-grow: 1;
        max-width: 80%;
        font-size: 14px;
        margin-bottom: 0px;
      }
    }

    .chart-type-buttons {
      .chart-type-btn:first-child {
        margin-right: 5px;
      }

      .chart-type-btn:last-child {
        margin-left: 5px;
      }

      .chart-type-btn.selected {
        border: 1px solid #28A745;
      }

      .chart-type-btn.selected:before {
        background-image: url('~@/assets/tick.svg');
        position: absolute;
        top: -6.5px;
        right: -6.5px;
        content: ' ';
        width: 15px;
        height: 15px;
      }

      .chart-type-btn {
        background: #FFFFFF;
        border: 1px solid #ddd;
        box-sizing: border-box;
        border-radius: 5px;
        padding: 12px 14px;
        transition: all .3s ease-in-out;
        position: relative;

        img {
          width: 42px;
          height: 42px;
        }
      }
    }
  }
}
</style>