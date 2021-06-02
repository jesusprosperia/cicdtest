<template>
  <div class="map">
    <div id="popup_template" style="display: none;" class="pop-up">
      
      <!-- Select statistic -->
      <div class="wrapper">
        <div class="subtitle">
          {{userTrans.select_map_statistic}}
        </div>
        <div>
          <b-form-select 
            size="sm"
            v-model="chartStat" 
            :options="statOptions"
          ></b-form-select>
        </div>
      </div>

      <!-- Pre or Post policies select -->
      <div class="wrapper">
        <div class="subtitle">
          {{userTrans.select_post_pre}}
        </div>
        <div>
          <b-form-radio-group
            v-model="preOrPost"
            :options="prePostOptions"
            name="post_pre"
          />
        </div>
      </div>

      <!-- Gradient min and max -->
      <div class="wrapper">
        <div class="subtitle">
          {{userTrans.select_min_max}}
        </div>

        <div class="text-left">
            <div class="min-max-picker">
                <div class="min">
                    <NumberInput 
                      v-model="gradient_min"
                      :placeholder="userTrans.min_label"
                    />
                </div>
                <div class="max">
                    <NumberInput
                      v-model="gradient_max"
                      :placeholder="userTrans.max_label"
                    />
                </div>
            </div>
        </div>
      </div>

      <!-- Color Picker -->
      <div class="wrapper mb-0">
        <div class="color-pick-button">
          <b-button 
            @click="colorPickerOn = !colorPickerOn;" 
            size="sm" 
            variant="light"
          >
            {{ userTrans.pick_colors }}
          </b-button> 
        </div>

        <div v-if="colorPickerOn" class="color-picker">
          <ColorPicker
            :gradient="gradient"
            :isGradient="true"
            :onEndChange="onColorPick"
          />
          <div class="reset-grad">
            <b-button
              size="sm" 
              variant="light"
              @click="resetGradient"
            >
              {{ userTrans.reset_gradient }}
            </b-button>
          </div>
        </div>
      </div>

      <button 
        class="mt-2 w-100 btn btn-sm btn-outline-success"
        @click="onSelect"
      >{{userTrans.ok_btn}}</button>
    </div>
    <div ref="map"></div>
  </div>
</template>

<script>
import MapModule from './map-module';
import axios from '@/plugins/axios';
import {loadChildren} from '@/components/charts/shared/data';
import {getStatsData} from '@/components/charts/shared/stats-calc';
import { mapState } from 'vuex';
import {sum, extent} from 'd3-array';
import * as mainTypes from '@/store/mutation-types';
import NumberInput from '@/components/number-input/index';
import {hexToRgb, parseRgb} from '@/utils/color-codes';
import { ColorPicker } from 'vue-color-gradient-picker';

const defaultColors = ["#ffffd9", "#c3e7b5", "#46b4c2", "#2261aa", "#081d58"];

export default {
  props: {
    config: {
      type: Object,
      required: true
    },
    mapConfig: {
      type: Object,
      required: true
    }
  },
  components: {
    NumberInput,
    ColorPicker
  },
  data() {
    const map_state = this.config.map_state || {};
    const {
      preOrPost,
      chartStat,
      gradientMin = null,
      gradientMax = null,
      gradientColors = defaultColors
    } = map_state;

    return {
      map: null,
      collection: null,
      data: [],
      nodes: [],
      preOrPost: preOrPost || 'pre',
      chartStat: chartStat || 'impact',
      gradient_min: gradientMin,
      gradient_max: gradientMax,
      updateMapData: false,
      colors: gradientColors,
      colorPickerOn: false
    }
  },
  computed: {
    ...mapState({
      requestPolicies: state => state.tree.requestPolicies,
      userTrans: state => state.lang.userTrans
    }),
    statOptions() {
      const impact = {
        value: 'impact', 
        text: this.config.pie_label,
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
    },
    prePostOptions() {
      return [
        { text: this.userTrans.pre_policy, value: "pre" },
        { text: this.userTrans.post_policy, value: "post" },
        { text: this.userTrans.pie_chart_difference, value: "diff" }
      ]
    },
    gradient() {
      return {
        type: 'linear',
        degree: 0,
        points: this.colors.map((d, i) => {
          const { r, g, b } = d.slice(0, 3) === "rgb" ? parseRgb(d) : hexToRgb(d);
          return {
            left: i * (100 / (this.colors.length - 1)),
            red: r,
            green: g,
            blue: b,
            alpha: 1
          };
        })
      }
    }
  },
  methods: {
    onColorPick(attrs) {
      const colors = attrs.points.map(d => {
        return `rgb(${d.red},${d.green},${d.blue})`;
      });
      this.colors = colors;
    },
    getFilterFn(threshold) {
      return (d) => {
        return this.config.criteriaPriority == 'high' ? 
          d.criteria >= threshold : 
          d.criteria <= threshold;
      }
    },
    getPercent(data, threshold, prop = 'sum') {
      const f = this.getFilterFn(threshold);

      const accepted = sum(data.filter(f), d => d[prop]);
      const total = sum(data, d => d[prop]);

      return (accepted / total) * 100;
    },
    getCost(data) {
      let prop = 'sum';
      let cost_factor = this.config.current_cost_factor;

      let threshold = null;

      // pulling threshold from tree state, if tree was saved.
      if (this.config.tree_state) {
        const { defaultThresholdValue, value } = this.config.tree_state;

        if (defaultThresholdValue) {
          threshold = defaultThresholdValue;
        } else {
          threshold = value;
        }
      } else {
        threshold = this.config.defaultThresholdValue;
      }

      const f = this.getFilterFn(threshold);

      if (cost_factor && data.some(d => d.hasOwnProperty(cost_factor.name))) {
        prop = cost_factor.name;
      }

      return sum(data.filter(f), d => d[prop]);
    },
    initMap() {
      this.$store.commit(mainTypes.SET_DATA_LOADING, true);

      this.loadGeojson().then(({ data }) => {
        const features = data.data;
        const geojson = {
          type: "FeatureCollection",
          features: features.map(d => {
            return {
              type: "Feature",
              geometry: d.g,
              properties: d.p
            }
          })
        }

        this.map = MapModule({
          colors: this.colors,
          translations: this.userTrans,
          texts: this.getMapTexts(),
          container: this.$refs.map,
          height: window.innerHeight - 110,
          width: window.innerWidth - 223,
          geojson: geojson,
        }).render();

        this.loadBins();
      }).catch((e) => {
        console.error(e);
        this.$store.commit(mainTypes.SET_DATA_LOADING, false);
      })
    },
    destroyMap() {
      this.map = null;
      this.collection = null;
      this.$el.innerHTML = "";
    },
    loadGeojson() {
      const col = this.mapConfig.collection;
      this.collection = col;
      return axios.post('/api/collection/get-geojson', { collection: col })
    },
    calc(resp) {
      const threshold = this.config.selected_section.value;

      const data = resp.map(d => {
        const post_impact = this.getPercent(d.bins, threshold, "current");
        const pre_impact = this.getPercent(d.bins, threshold, "sum");
        const cost = this.getCost(d.bins);

        const statistics = getStatsData({
          statistics: this.config.statistics,
          currentValue: threshold,
          criteriaPriority: this.config.criteriaPriority,
          minMax: extent(d.bins, x => x.criteria),
          data: d.bins,
          postPolicy: this.config.hasPostPolicy,
          color: '#21918c'
        });

        return {
          pie_label: this.config.pie_label,
          hasPostPolicy: this.config.hasPostPolicy,
          key: d.key,
          bins: d.bins,
          post_impact,
          pre_impact,
          cost,
          statistics: statistics.map(d => {
            return {
              stat: d,
              name: d[0].stat_name
            }
          })
        }
      });
      return data;
    },
    loadBins() {
      if (!this.map) return;

      const { field: group_id } = this.mapConfig;
      const threshold = this.config.selected_section.value;

      // get the categorical filters
      var groupCategories;

      if (this.config.matchCase && this.config.matchCase[group_id] && this.config.matchCase[group_id].$in) {
          groupCategories = this.config.matchCase[group_id].$in;
      } else {
          groupCategories = this.config.categoricalFilters[group_id];
      }

      this.$store.commit(mainTypes.SET_DATA_LOADING, true);

      loadChildren(
        group_id, 
        { data: {} }, 
        threshold, 
        this.config,
        this.requestPolicies,
        groupCategories
      ).then(resp => {
        this.data = this.calc(resp);
        this.map.setAllData(this.data);
        this.setNodes();
        this.colorizeMap();
        this.$store.commit(mainTypes.SET_DATA_LOADING, false);
      }).catch(e => {
        console.error(e.message);
        this.$store.commit(mainTypes.SET_DATA_LOADING, false);
      });
    },
    setNodes() {
      let nodes = [];

      this.data.forEach(d => {
        const value = this.getValue(d);

        nodes.push({
          id: d.key,
          value: value,
          cost: d.cost,
          name: d.key,
          highlight: () => this.map.highlight(d.key),
          clearHighlight: () => this.map.clearHighlight()
        });
      });

      const hasMinMax = this.gradient_min !== null && this.gradient_max !== null;

      if (!hasMinMax || this.updateMapData) {
        const [min, max] = extent(nodes, d => d.value);
        this.gradient_min = Math.round(min);
        this.gradient_max = Math.round(max);
      }

      this.nodes = nodes;
    },
    colorizeMap() {
      this.map
        .setColors(this.colors)
        .setTexts(this.getMapTexts())
        .setData(this.nodes, [+this.gradient_min, +this.gradient_max]);

      this.emitNodes();
      this.updateMapData = false;
      this.colorPickerOn = false;
    },
    getMapTexts() {
      const statistic = this.statOptions.find(d => d.value === this.chartStat);
      const prePost = this.prePostOptions.find(d => d.value === this.preOrPost);

      return {
        statText: statistic.text,
        prePostText: prePost.text,
        isImpact: this.chartStat === "impact"
      }
    },
    getValue(d) { 
      const isStat = this.chartStat !== "impact";
      const { name } = this.statOptions.find(d => d.value === this.chartStat) || {};
      const { stat } = d.statistics.find(x => x.name === name) || {};

      let pre_stat = { value: 0 }, post_stat = { value: 0 };
      let value = 0;

      if (this.config.hasPostPolicy && stat && stat.length > 0) {
        if (stat.length > 1) {
          pre_stat = stat[1];
          post_stat = stat[0];
        } else {
          pre_stat = stat[0];
          post_stat = stat[0];
        }
      }

      if (this.preOrPost === 'diff' && this.config.hasPostPolicy) {
        if (isStat) {
          value = pre_stat.value - post_stat.value;
        } else {
          value = d.pre_impact - d.post_impact;
        }
      } else if (this.preOrPost === 'post' && this.config.hasPostPolicy) {
        value = isStat ? post_stat.value : d.post_impact;
      } else {
        value = isStat ? pre_stat.value : d.pre_impact;
      }

      return value;
    },
    emitNodes() {
      this.$emit('on-nodes-update', this.nodes.map(d => {
        const color = this.map.colorScale();
        return {
          ...d,
          color: color(d.value),
          textColor: d.value > color.domain()[2] ? '#fff' : '#000'
        }
      }).sort((a, b) => b.cost - a.cost));
    },
    onSelect() {
      this.setNodes();
      this.colorizeMap();
    },
    getConfig() {
      return {
        preOrPost: this.preOrPost,
        chartStat: this.chartStat,
        gradientMin: this.gradient_min,
        gradientMax: this.gradient_max,
        collection: this.mapConfig.collection,
        mapField: this.mapConfig.field,
        gradientColors: this.colors,
      }
    },
    resetGradient() {
      this.colors = defaultColors;
      this.colorPickerOn = false;
      setTimeout(() => this.colorPickerOn = true, 10);
    }
  },
  watch: {
    mapConfig(val) {
      if (val.collection !== this.collection) {
        this.initMap();
      }
    },
    preOrPost() {
      this.updateMapData = true;
      this.setNodes();
    },
    chartStat() {
      this.updateMapData = true;
      this.setNodes();
    }
  },
  mounted() {
    this.initMap();
  }
}
</script>

<style src="vue-color-gradient-picker/dist/index.css" lang="css"></style>
<style lang="scss">
  .pop-up {
    text-align: left;

    .color-pick-button {
      margin-bottom: 12px;
    }

    .color-picker {
      position: relative;

      .reset-grad {
        position: absolute;
        bottom: 25px;
        left: 100px;
      }
    }
  }

  .map {
    position: relative;

    .stat-labels {
      text-align: center;
      transform: translateX(28px);
      max-width: 150px;

      .stat-name {
        font-size: 1rem;
        font-weight: bold;
      }

      .pre-post-name {
        font-size: 1rem;
      }
    }

    .legend-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;

      .legend {
        display: flex;

        .labels {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-right: 5px;

          .legend-label {
            width: 48px;
            text-align: right;
            font-size: 13px;
            line-height: 15px;
            letter-spacing: 1.21333px;
            text-transform: uppercase;
            color: #8798AD;
          }
        }
      }
    }
  }

  .wrapper {
    margin-bottom: 15px;

    .custom-radio {
      width: 90%;
    }

    .subtitle {
      color: #aaa;
      text-transform: uppercase;
      font-size: 11px;
      margin-bottom: 6px;
      font-weight: 500;
      text-align: left;
    }
  }

  .ui-color-picker {
    margin: 0;
    width: 240px;

    .gradient-controls {
      display: none;
    }

    .input-field.rgb {
      display: none;
    }

    .color-hue-alpha .alpha {
      display: none;
    }
  }
</style>
