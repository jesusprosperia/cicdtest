import { mapState } from 'vuex';

export default {
  computed: {
    ...mapState({
      userTrans: (state) => state.lang.userTrans
    })
  }
}