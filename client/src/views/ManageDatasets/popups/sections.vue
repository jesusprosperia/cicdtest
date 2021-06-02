<template>
  <div class="sections">
    <div class="add-new-sections">
      <div class="sections-list">
        <div class="list">
          <div
            class="list-item"
            v-for="(d, i) in sections"
            :key="`section-${i}`"
          >
            <div class="dataset-name d-flex align-items-center">
              <input
                type="text"
                v-model="d.name"
                placeholder="Please name the section"
                class="form-control flex-grow-1 section-input"
                maxlength="5"
                @input="onSectionUpdate(d)"
              />
              <span class="ml-2 mr-2">Below:</span>
              <input
                v-model="d.value"
                :min="xExtent[0]"
                :max="xExtent[1]"
                type="number"
                class="form-control value-input section-input"
                @input="onSectionUpdate(d)"
              />
            </div>
            <div class="delete-icon" @click="deleteSection(d)">
              <img src="@/assets/delete.svg" />
            </div>
          </div>
        </div>
      </div>
      <div>
        <b-button
          class="button-add"
          variant="success"
          @click="addNewSection()"
          >Add New Section</b-button
        >
      </div>
    </div>

    <template v-if="data">
      <div class="chart-row">
        <div class="y-axis-extent">
          <VueSlider
            tooltip="always"
            direction="btt"
            v-model="dataYMax"
            :step="1"
            :min="0"
            :max="dataYMaxRaw"
            :height="216"
            :tooltip-formatter="formatNum"
          />
        </div>
        <div class="chart-area" ref="chart"></div>
      </div>
      <div class="x-axis-extent">
        <VueSlider
          tooltip="always"
          :enable-cross="false"
          :tooltip-merge="false"
          :step="1"
          :min="dataMinRaw"
          :max="dataMaxRaw"
          v-model="xExtent"
        />
      </div>
    </template>
  </div>
</template>

<script>
import {alphabet} from '@/utils/constants';
import { extent } from "d3-array";
import axios from "@/plugins/axios";
import SimpleHistogram from "@/js-charts/simple-histogram.js";
import VueSlider from "vue-slider-component";
import {thousandFormat} from '@/utils/formatters';

export default {
  props: {
    propName: {
      type: String,
      required: true
    },
    collectionName: {
      type: String,
      required: true
    },
    currentSections: {
      type: Array,
      required: true
    }
  },
  components: {
    VueSlider
  },
  data() {
    return {
      chart: null,
      sectionCounter: 0,
      sections: this.currentSections,
      dataYMax: 0,
      dataYMaxRaw: 0,
      dataMinRaw: 1,
      dataMaxRaw: 50,
      data: null,
      dataFetchedFor: null,
      xExtent: [1, 50],
    }
  },
  computed: {
    minMax() {
      if (this.data) {
        return extent(this.data, (d) => d.criteria);
      }

      return [0, 0];
    },
  },
  methods: {
    formatNum(val) {
      return thousandFormat(val);
    },
    addNewSection() {
      this.sections.push({
        name: alphabet[this.sectionCounter % alphabet.length],
        value: Math.ceil((this.minMax[1] - this.minMax[0]) / 2),
      });

      this.sectionCounter++;

      this.chart.updateSections(this.sections);
    },
    deleteSection(section) {
      var index = this.sections.indexOf(section);

      this.sections.splice(index, 1);

      this.chart.updateSections(this.sections);
    },
    onSectionUpdate() {
      this.adjustSections();
    },
    adjustSections() {
      const [min, max] = this.xExtent;

      this.sections = this.sections.map(d => {
        return {
          ...d,
          value: Math.max(min, Math.min(max, d.value)),
        }
      })
    },
    async fetchData() {
        if (this.$refs.chart) {
          this.$refs.chart.innerHTML = "";
        }

        this.data = await axios
          .post("/api/compute/bins", {
            criteria: this.propName,
            collection: this.collectionName,
          })
          .then((d) => {
            var minMax = extent(d.data, x => +x.criteria);
            var yMinMax = extent(d.data, d => +d.sum);
            var dataMap = new Map(d.data.map(x => [+x.criteria, x]));
            var arr = [];

            for (let i = minMax[0]; i <= minMax[1]; i++) {
              const d = dataMap.get(i);

              arr.push({
                criteria: i,
                sum: d ? d.sum : 0,
              });
            }

            this.xExtent = minMax;
            this.dataMinRaw = minMax[0];
            this.dataMaxRaw = minMax[1];

            this.dataYMax = Math.round(yMinMax[1] * 1.5);
            this.dataYMaxRaw = Math.round(yMinMax[1] * 1.5);

            return arr;
          });

        this.dataFetchedFor = this.propName;

        setTimeout(() => {
          this.$refs.chart.innerHTML = "";

          this.chart = SimpleHistogram({
            container: this.$refs.chart,
            width: this.$refs.chart.offsetWidth,
            height: 300,
            data: this.data,
            visible: true,
            fieldName: this.propName,
            sections: this.sections,
            yDomain: [0, this.dataYMaxRaw],
            xExtent: this.xExtent,
            yExtent: [0, this.dataYMax],
          });
        }, 0);
    },
    emitUpdate() {
      this.$emit('sections-updated', {
        sections: this.sections,
        xExtent: this.xExtent,
        yExtent: [0, this.dataYMax],
      });
    }
  },
  watch: {
    propName() {
      this.fetchData();
    },
    sections: {
      deep: true,
      handler() {
        if (this.chart) {
          this.chart.updateSections(this.sections);
        }

        this.emitUpdate();
      }
    },
    xExtent(val) {
      this.adjustSections();
      
      if (this.chart) {
        this.chart.updateXAxisExtent(val[0], val[1]);
      }

      this.emitUpdate();
    },
    dataYMax(val) {
      if (this.chart && val) {
        this.chart.updateYAxisExtent(0, val);
      }

      this.emitUpdate();
    }
  },
  mounted() {
    this.fetchData();
  }
}
</script>

<style lang="scss">
.sections {
  .list {
    margin-bottom: 10px;

    .list-item {
      display: flex;
      align-content: center;
      align-items: center;
      padding-top: 5px;
      padding-bottom: 5px;

      .dataset-name {
        display: flex;
        margin-right: 10px;
        flex-grow: 1;
        font-size: 16px;
        border-bottom: 1px solid #ddd;

        .loader-container {
          position: relative;
          flex-grow: 1;
          height: 24px;
        }
      }

      .delete-icon img {
        width: 20px;
        cursor: pointer;
      }
    }
  }

  .value-input {
    max-width: 80px;
  }

  .section-input {
    border: none;
  }

  .sections-list {
    width: 60%;
  }

  .chart-row {
    display: flex;
    height: 100%;
    
    .y-axis-extent {
      padding-top: 45px;
    }

    .chart-area {
      padding-top: 15px;
      flex-grow: 1;
      width: 100%;
    }
  }

  .x-axis-extent {
    width: 100%;
    padding-top: 25px;
    padding-left: 85px;
    padding-right: 12px;
  }

  .vue-slider-dot-tooltip-inner, .vue-slider-process {
    background-color: var(--secondary-color) !important;
    border-color: var(--secondary-color) !important;
  }
}
</style>