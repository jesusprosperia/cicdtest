<template>
  <block-container :title="userTrans.define_priority">

    <b-form-group v-for="(d, i) in criteriaConfig.filter(d => d.active)" :key="i">
      <div class="d-flex align-items-center">
        <multiselect
          v-model="d.model"
          :options="options"
          :multiple="false"
          :searchable="false"
        ></multiselect>
        <div class="pl-2 delete-icon" @click="removeCriteria(d)">
          <img src="@/assets/delete.svg" />
        </div>
      </div>
      <div class="p-2">
        <b-form-radio-group
          v-model="d.priority"
          :options="priorityOptions"
          :name="`priority-options-${i}`"
        />
      </div>
    </b-form-group>

    <div class="mt-2 mb-2" v-if="criteriaCounter < numOfCriterias">
      <b-button
        class="button-add"
        variant="success"
        @click="addCriteria()"
      >
        {{userTrans.add_second_criteria}}
      </b-button>
    </div>
    
  </block-container>
</template>

<script>
import {mapState} from 'vuex';
import BlockContainer from "@/components/ui/block-container.vue";
import Multiselect from "vue-multiselect";

export default {
  props: {
    options: {
      type: Array,
      required: true
    },
    value: {
      type: Array,
      required: true
    }
  },
  components: {
    BlockContainer,
    Multiselect
  },
  data() {
    return {
      criteriaCounter: 0,
      numOfCriterias: 1, // switch to 2 to enable 2d selection (/bins2d)
      criteriaConfig: [
        {
          active: false,
          model: null,
          priority: 'low'
        },
        {
          active: false,
          model: null,
          priority: 'low'
        }
      ],  
    }
  },
  computed: {
    ...mapState({
      userTrans: state => state.lang.userTrans,
    }),
    priorityOptions() {
      return [
        {text: this.userTrans.priority_high, value: 'high'},
        {text: this.userTrans.priority_low, value: 'low'}
      ]
    }
  },
  methods: {
    removeCriteria(d) {
      d.active = false; 
      d.model = null;

      this.criteriaCounter = Math.max(this.criteriaCounter - 1, 0);
      this.criteriaConfig = this.criteriaConfig.sort((a, b) => b.active - a.active);
    },
    addCriteria() {
      if (this.criteriaConfig[this.criteriaCounter]) {
        this.criteriaConfig[this.criteriaCounter].active = true;
        this.criteriaConfig = this.criteriaConfig.sort((a, b) => b.active - a.active);
        this.criteriaCounter++;
      }
    },
  },
  watch: {
    criteriaConfig: {
      handler(config) {
        const criterias = config
          .filter(d => d.active)
          .map(d => {
            return {
              criteria: d.model,
              priority: d.priority
            }
          })
        this.$emit('input', criterias);
      },
      deep: true
    }
  },
  created() {
    if (this.value) {
      this.value.forEach((d, i) => {
        if (this.criteriaConfig[i]) {
          this.criteriaConfig[i].active = true;
          this.criteriaConfig[i].model = d.criteria;
          this.criteriaConfig[i].priority = d.priority;
        }
      });
      this.criteriaCounter = this.value.length;
    }
  }
}
</script>

<style>

</style>