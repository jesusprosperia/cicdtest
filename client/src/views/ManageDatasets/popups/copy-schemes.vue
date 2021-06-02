<template>
  <b-modal size="lg" id="copy-modal" title="Copy scheme" v-model="show">
      <b-form-group label-cols-sm="5" label-cols-lg="5" label="Copy to:">
        <b-form-select
          v-model="userTo"
          :options="copyToOptions"
        ></b-form-select>
      </b-form-group>

      <b-form-group label-cols-sm="5" label-cols-lg="5" label="Scheme to copy:">
        <multiselect
          v-model="selectedSchemes"
          :options="schemeList"
          :multiple="true"
          label="name"
          track-by="id"
        />
      </b-form-group>

       <template v-slot:modal-footer>
        <div class="w-100">
          <b-button variant="success" size="sm" class="float-right" @click="onCopySchemes()">Copy</b-button>
          <b-button variant="light" size="sm" class="float-right mr-3" @click="onCancel">Cancel</b-button>
        </div>
      </template>
    </b-modal>

</template>

<script>
import Multiselect from "vue-multiselect";
import { mapState, mapActions, mapGetters } from "vuex";

export default {
  props: {
    show: {
      type: Boolean,
      required: true
    },
    org: {
      type: Object,
      required: false,
    }
  },
  components: {
    Multiselect
  },
  data() {
    return {
      userTo: null,
      selectedSchemes: [],
    }
  },
  computed: {
    ...mapGetters(['currentUser']),
    ...mapState({
      users: state => state.admin.users,
      schemeList: ({ scheme }) => scheme.schemeList,
    }),
    isOrgPage() {
      return this.$route.params.ref_id !== this.currentUser._id;
    },
    copyToOptions() {
      const users = this.users.map(d => {
        return {
          text: d.email,
          value: d._id,
        }
      });

      if (this.isOrgPage) {
        return users;
      }

      return users.concat([{
        value: this.currentUser.org_id,
        text: this.org ? this.org.name : 'current org',
      }]);
    }
  },
  methods: {
    ...mapActions([ "copyUserSchemes" ]),
    onCopySchemes() {
      // current ref_id, it will be either org_id, or user_id.
      const userFrom = this.$route.params.ref_id;
      const selectedSchemes = this.selectedSchemes;
      
      if (userFrom && this.userTo && selectedSchemes.length > 0) {
        const selectedSchemeIds = selectedSchemes.map(d => d.id);
        this.copyUserSchemes({
          userFromId: userFrom, 
          userToId: this.userTo, 
          selectedSchemeIds
        }).then(resp => {
          if (resp) {
            this.flash('Scheme(s) Copied', "success", { timeout: 3000 });
          } else {
            this.flash('Error', "error", { timeout: 3000 });
          }
          this.onCancel();
        }).catch(() => {
          this.flash('Error', "error", { timeout: 3000 });
        });
      }
    },
    onCancel() {
      this.userTo = null;
      this.selectedSchemes = [];
      this.$emit('on-cancel')
    }
  }
}
</script>

<style>

</style>