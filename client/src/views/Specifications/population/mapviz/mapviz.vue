<template>
  <block
    :title="userTrans.add_map_viz"
  >
    <div class="map-viz"
      v-for="(d, i) in config.filter(d => d.active)" 
      :key="i" 
    >
      <div class="d-flex align-items-center">

        <multiselect
          v-model="d.selectedShapefile"
          :options="shapeFiles"
          :multiple="false"
          :searchable="false"
        />

        <div 
          class="pl-2 delete-icon" 
          @click="remove(d)"
        >
          <img src="@/assets/delete.svg" />
        </div>

      </div>
    </div>
    <div class="mt-2" v-if="counter < numOfShapeFiles">
      <b-button
        class="button-add"
        variant="success"
        @click="add()"
      >{{userTrans.add_shapefile}}</b-button>
    </div>
  </block>
</template>

<script>
import Block from "../block/block.vue";
import Multiselect from "vue-multiselect";
import transMixin from "@/mixins/translation";

export default {
  mixins: [transMixin],
  props: {
    value: {
      type: Array,
      required: true
    },
    shapeFiles: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      numOfShapeFiles: 1,
      counter: 0,
      config: []
    }
  },
  components: {
    Multiselect,
    Block
  },
  methods: {
    add() {
      const obj = this.config[this.counter];

      if (obj) {
        obj.active = true;

        this.config = this.config.sort((a, b) => b.active - a.active);
        this.counter++;
      }
    },
    remove(d) {
      d.active = false;
      d.selectedShapefile = null;

      this.counter = Math.max(this.counter - 1, 0);
      this.config = this.config.sort((a, b) => b.active - a.active);
    },
    setConfig() {
      this.numOfShapeFiles = this.shapeFiles.length;

      this.config = this.shapeFiles.map(() => ({
        active: false,
        selectedShapefile: null
      }));
      
      if (this.value && this.value.length) {
        this.value.forEach((d, i) => {
          if (this.config[i]) {
            this.config[i].active = true;
            this.config[i].selectedShapefile = d;
          }
        });
        this.counter = this.value.length;
      }

    }
  },
  watch: {
    shapeFiles() {
      this.setConfig();
    },
    config: {
      handler(value) {
        const arr = value
          .filter(d => d.active && d.selectedShapefile)
          .map(d => d.selectedShapefile);

        this.$emit('input', arr);
      },
      deep: true
    }
  },
  created() {
    this.setConfig();
  }
}
</script>

<style lang="scss">
  .map-viz {
    margin-bottom: 10px;
  }
</style>