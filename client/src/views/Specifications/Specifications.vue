<template>
  <b-container>
    <population />
  </b-container>
</template>

<script>
import population from "./population/population.vue";
import { mapState, mapActions } from 'vuex';

export default {
  props: [ 'scheme_id', 'ref_id' ],
  components: {
    population
  },
  computed: {    
    ...mapState({
      targetScheme: ({ scheme }) => scheme.targetScheme,
      schemeList: ({ scheme }) => scheme.schemeList || [],
    })
  },
  methods: {
    ...mapActions(['getScheme', 'listSchemes']),
    loadScheme() {
      if (this.scheme_id && this.ref_id) {
        if (this.targetScheme && this.targetScheme.id === this.scheme_id) {
          return;
        }

        if (this.schemeList.length > 0 && this.schemeList.some(d => d.id === this.scheme_id)) {
          this.getScheme({ 
            scheme_id: this.scheme_id,
            user_id: this.ref_id,
          });
        }
      }
    }
  },
  watch: {
    schemeList(val) {
      if (val) {
        this.loadScheme();
      }
    }
  },
  created() {
    if (this.schemeList.length === 0) {
      this.listSchemes(this.ref_id);
    } else {
      this.loadScheme()
    }
  }
}
</script>