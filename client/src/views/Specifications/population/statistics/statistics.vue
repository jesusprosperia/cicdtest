<template>
  <block 
    :title="userTrans.add_additional_stats"
  >

    <div 
      v-for="(d, i) in statsConfig.filter(d => d.active)"
      :key="i"
      class="stat-section"
    >
      <div class="w-100">
        <!-- Select stats column -->
        <b-form-group
          :label="userTrans.select_stats_column" 
          label-cols="5"
        >
          <multiselect
            v-model="d.column"
            :options="columns"
            :multiple="false"
            :searchable="false"
          ></multiselect>
        </b-form-group>

        <!-- Select section -->
        <b-form-group
          :label="userTrans.select_stats_section" 
          label-cols="5"
        >
          <multiselect
            v-model="d.section"
            :options="allSections"
            :multiple="false"
            :searchable="false"
            track-by="value"
            label="name"
            @remove="d.section = null"
          ></multiselect>
        </b-form-group>

        <!-- Select stat type -->
        <b-form-group
          :label="userTrans.select_stat_type" 
          label-cols="5"
        >
          <multiselect
            v-model="d.type"
            :options="statTypes"
            :multiple="false"
            :searchable="false"
            @remove="d.type = null"
          ></multiselect>
        </b-form-group>

        <b-form-group
          :label="userTrans.stat_name" 
          label-cols="5"
        >
          <b-form-input
            type="text"
            v-model="d.name"
            max="30"
            :formatter="e => String(e).substring(0, 30)"
          ></b-form-input>
        </b-form-group>
      </div>

      <div class="pl-2 pt-2 delete-icon" @click="removeStatistic(d)">
        <img src="@/assets/delete.svg" />
      </div>
    </div>

    <div class="mt-2 mb-2" v-if="statsCounter < numOfStats">
      <b-button
        class="button-add"
        variant="success"
        @click="addStatistic()"
      >
        {{ userTrans.add_statistic }}
      </b-button>
    </div>

  </block>
</template>

<script>
import {mapState} from 'vuex';
import Block from "../block/block.vue";
import Multiselect from "vue-multiselect";

export default {
  props: {
    value: {
      type: Array,
      required: true
    },
    columns: {
      type: Array,
      required: true
    },
    sections: {
      type: Array,
      required: true
    }
  },
  data() {
    const numOfStats = 4;

    return {
      numOfStats,
      statsCounter: 0,
      statTypes: ['mean', 'sum', 'count', 'percentage_sum', 'percentage_count', 'poverty_gap', 'gini', 'FGT1'],
      statsConfig: new Array(numOfStats).fill(0).map(() => ({
        active: false,
        column: null,
        section: null,
        type: null,
        name: null
      }))
    }
  },
  components: {
    Block,
    Multiselect
  },
  computed: {
    ...mapState({
      userTrans: state => state.lang.userTrans,
    }),
    allSections() {
      return this.sections.concat([
        { value: 0, name: this.userTrans.current_selection, isCustom: true },
        { value: 0, name: this.userTrans.full_population, isFull: true }
      ])
    }
  },
  methods: {
    addStatistic() {
      if (this.statsConfig[this.statsCounter]) {
        this.statsConfig[this.statsCounter].active = true;
        this.statsConfig = this.statsConfig.sort((a, b) => b.active - a.active);
        this.statsCounter++;
      }
    },
    removeStatistic(d) {
      d.active = false; 
      d.column = null;
      d.section = null;
      d.type = null;
      d.name = null;

      this.statsCounter = Math.max(this.statsCounter - 1, 0);
      this.statsConfig = this.statsConfig.sort((a, b) => b.active - a.active);
    }
  },
  watch: {
    statsConfig: {
      handler(value) {
        const statistics = value.filter(d => {
          const keys = Object.keys(d).filter(x => x !== 'active');
          return  d.active && !keys.some(key => d[key] === null);
        });
        
        this.$emit('input', statistics);
      },
      deep: true
    }
  },
  created() {
    if (this.value && this.value.length) {
      this.value.forEach((stat, i) => {
        if (this.statsConfig[i]) {
          this.statsConfig[i].active = true;

          Object.keys(stat).forEach(key => {
            if (key !== 'active') {
              this.statsConfig[i][key] = stat[key];
            }
          });
        }
        this.statsCounter++;
      })
    }
  }
}
</script>

<style>
  .stat-section {
    display: flex;
  }

  .stat-section:not(:first-child) {
    padding-top: 1rem;
    border-top: 1px solid #dddddd;
  }
</style>