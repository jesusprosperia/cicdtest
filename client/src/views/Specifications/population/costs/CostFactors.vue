<template>
  <div class="select-factors">
    <div 
      v-for="(d, i) in factorConfig.filter(d => d.active)"
      :key="i"
      class="factor-row"
    >
      <div class="dropdown factor-select">
        <multiselect
          v-model="d.name"
          :options="factorOptions"
          :multiple="true"
          :max="1"
          :searchable="false"
          @select="onFactorSelect"
          @remove="onFactorDeselect"
        ></multiselect>
      </div>

      <div class="dropdown icon-select">
        <multiselect
          v-model="d.icon"
          :options="iconOptions"
          :multiple="false"
          :searchable="false"
          label="label"
          track-by="value"
          deselectLabel=""
          selectLabel=""
          :showLabels="false"
        ></multiselect>
      </div>

      <div class="pl-2 delete-icon" @click="removeFactor(d)">
        <img src="@/assets/delete.svg" />
      </div>
    </div>

    <div class="mt-2 mb-2 d-flex justify-content-end" v-if="counter < numOfFactors">
      <b-button
        class="button-add"
        variant="success"
        @click="addFactor()"
      >
        {{ userTrans.add_factor }}
      </b-button>
    </div>
  </div>
</template>

<script>
import {mapState} from 'vuex';
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
  data() {
    const numOfFactors = this.options.length;

    return {
      numOfFactors,
      factorOptions: this.options,
      counter: 0,
      iconOptions: [
        { label: '$', value: 'dollar' },
        { label: '%', value: 'percent' }
      ],
      factorConfig: new Array(numOfFactors).fill(0).map(() => ({
        active: false,
        name: null,
        icon: 'dollar'
      }))
    }
  },
  components: {
    Multiselect
  },
  methods: {
    addFactor() {
      if (this.factorConfig[this.counter]) {
        this.factorConfig[this.counter].active = true;
        this.factorConfig[this.counter].icon = { label: '$', value: 'dollar' };
        this.factorConfig = this.factorConfig.sort((a, b) => b.active - a.active);
        this.counter++;
      }
    },
    removeFactor(d) {
      if (d.name) {
        this.onFactorDeselect(d.name);
      }

      d.active = false;
      d.name = null;

      this.counter = Math.max(this.counter - 1, 0);
      this.factorConfig = this.factorConfig.sort((a, b) => b.active - a.active);
    },
    onFactorSelect(selectedOption) {
      this.factorOptions = this.factorOptions.filter(d => d !== selectedOption);
    },
    onFactorDeselect(removedOption) {
      if (this.factorOptions.indexOf(removedOption) === -1) {
        this.factorOptions.push(removedOption);
      }
    }
  },
  computed: {
    ...mapState({
      userTrans: state => state.lang.userTrans,
    })
  },
  watch: {
    factorConfig: {
      handler(value) {
        const factors = value.filter(d => {
          return  d.active && d.name !== null && d.icon
        }).map(d => {
          const name = Array.isArray(d.name) && d.name.length > 0 ? d.name[0] : d.name;
          return {
            name,
            icon: d.icon
          }
        });
        
        this.$emit('input', factors);
      },
      deep: true
    }
  },
  created() {
    if (this.value && this.value.length) {
      this.value.forEach((factor, i) => {
        if (typeof factor === 'string') factor = { 
          name: factor, 
          icon: { label: '$', value: 'dollar' }
        };

        if (this.factorConfig[i]) {
          this.factorConfig[i].active = true;
          this.factorConfig[i].name = factor.name;
          this.factorConfig[i].icon = factor.icon;
        }

        this.counter++;
      });

      this.factorOptions = this.factorOptions.filter(d => {
        return !this.factorConfig.some(x => x.name === d);
      })
    }
  }
}
</script>

<style lang="scss">
  .select-factors {
    .factor-row {
      width: 100%;
      display: flex;
      padding: 10px 0px;
      align-items: center;

      &:not(:last-child) {
        border-bottom: 1.5px solid #dddddd;
      }

      .factor-select {
        width: 80%;
        padding-right: 10px;
      }

      .icon-select {
        width: 20%;
      }
    }
  }
</style>