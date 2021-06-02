<template>
  <div class="sidebar-content">
    <!-- REFRESH -->
    <div 
      class="list-item"
      v-show="tabs[activeTab].type === 'aggregation'"
    >
      <button 
        :disabled="aggrTreeUpdateEnabled ? null : `disabled`"
        class="btn btn-light btn-sm btn-aggr-refresh"
        :data-tippy-content="userTrans.update_aggr_tree"
        @click="$parent.updateAggrTree"
      >
        <img 
          :class="`icon ${aggrTreeUpdateEnabled ? 'grow' : ''}`" 
          src="@/assets/refresh.png" 
        />
      </button>
    </div>

    <!-- SHOW SETTINGS -->
    <div 
      class="list-item"
      v-show="tabs[activeTab].type === 'aggregation'"
    >
      <button 
        :style="`border-left: 4px solid ${settings_shown ? 'var(--secondary-color)' : 'transparent' }`"
        class="btn btn-light btn-sm"
        @click="settings_shown = !settings_shown"
      >
        <img class="icon" src="@/assets/settings.svg" />
      </button>
    </div>

    <!-- EXPORT -->
    <div class="list-item">
      <button
        class="btn btn-light btn-sm"
        :data-tippy-content="userTrans.ppt_icon_tooltip"
        @click="exportPPT"
      >
        <img class="icon" src="@/assets/PPT-icon.png" />
      </button>
    </div>

    <!-- SAVE TREES -->
    <div class="list-item">
      <button
        class="btn btn-light btn-sm"
        :data-tippy-content="userTrans.save_icon_tooltip"
        @click="saveTrees"
      >
        <img class="icon" src="@/assets/save-icon.png" />
      </button>
    </div>

    <!-- SHOW INFO -->
    <div class="list-item">
      <button
        v-if="descriptions"
        class="btn btn-light btn-sm"
        ref="infoBtn"
        :data-tippy-content="userTrans.info_icon_tooltip"
        @click="showInfo"
      >
        <img class="icon" src="@/assets/info-icon.png" />
      </button>
    </div>

    <div class="abs-side" v-show="settings_shown && tabs[activeTab].type === 'aggregation'">
      <button
        :class="`btn btn-sm btn-pin ${settings_pinned ? '' : 'btn-grey'}`"
        @click="settings_pinned = !settings_pinned"
      >
        <img class="icon" src="@/assets/pin.svg" />
      </button>

      <Settings v-if="tabs[activeTab].config"
        :scheme_id="scheme_id"
        :config="tabs[activeTab].config"
        @on-policies-select="(pols) => $emit('on-policies-select', pols)"
        @chart-type-select="(obj) => $emit('chart-type-select', obj)"
      />
    </div>
  </div>
</template>

<script>
import transMixin from '@/mixins/translation';
import { mapState, mapActions, mapGetters } from 'vuex';
import {getImageUrl, getImageUrlFromImage} from '@/utils/image';
import {generateAndDowloadPPT} from '@/utils/ppt-export.js';
import {select} from 'd3-selection';
import Settings from './Settings.vue';

export default {
  components: { Settings },
  props: {
    scheme_id: {
      type: String,
      required: true
    },
    tabs: {
      type: Array,
      required: true
    },
    treePageRefs: {
      type: Array,
      default: () => []
    },
    activeTab: {
      type: Number,
      required: true
    },
    aggrTreeUpdateEnabled: {
      type: Boolean,
      required: true
    }
  },
  mixins: [transMixin],
  data() {
    return {
      settings_shown: false,
      settings_pinned: false
    }
  },
  computed: {
    ...mapGetters(['userSettings']),
    ...mapState({
      userFromAdmin: state => state.admin.userFromAdmin,
      schemeName: state => state.scheme.currentSchemeName,
    }),
    descriptions() {
      const descrs = this.tabs
        .filter((d) => d.config.description)
        .map((d) => d.config.description);
      return descrs.join("<br>");
    },
  },
  methods: {
    ...mapActions(["saveAllTree"]),
    async getJsonOutput(treeChart, config) {
      const jsonOutput = {};

      // TREE
      const tree = await this.exportTree(treeChart);
      jsonOutput.tree = tree;

      // COST BAR
      const stackChartSvg = select(
        `#tree-page-${config.id} .stacked-bar-chart`
      );

      if (!stackChartSvg.empty()) {
        const bound = stackChartSvg.node().getBoundingClientRect();
        const stackUri = await getImageUrl(stackChartSvg);

        jsonOutput.costBar = {
          uri: stackUri,
          dimensions: {
            width: bound.width,
            height: bound.height,
            ratio: bound.width / bound.height,
          },
        };
      }

      // LEAVES
      const childNodes = treeChart.getChildNodes();
      if (childNodes.length > 0) {
        const leaves = await this.exportChildNodes(childNodes, treeChart);
        jsonOutput.leaves = leaves;
      }

      // description json
      if (config.description_json) {
        jsonOutput.descriptionJson = config.description_json;
      }

      return jsonOutput;
    },
    async exportPPT() {
      if (!this.$parent) return;

      const prosperiaLogo = {
        dimensions: { width: 1600, height: 1067, ratio: 1.499531396 },
        uri: "https://raw.githubusercontent.com/RodrigoLaraMolina/pptGen-pia/master/images/prosperiaLogo.png",
      };

      const scenarioName = await this.$dialog.prompt({
          text: "",
          title: this.userTrans.name_policy_scenario,
        });

      if (!scenarioName) return;

      let institutionLogo = prosperiaLogo;

      if (this.userSettings.user_image_url) {
          try {
            institutionLogo = await this.getUserImage(
              this.userSettings.user_image_url
            );
          } catch {
            ///
          }
        }

      let jsons = [];
      let tabCounter = 0;
      
      // start iterating over the trees and get json from each and save into jsons array
      for await (const ref of this.treePageRefs) {
        // change tab and wait for aggr tree to finish updating
        await this.$parent.onChangeTab(tabCounter);
        
        // get json output
        const treeChart = ref.getTreeChartRef();

        const json = await this.getJsonOutput(treeChart, this.tabs[tabCounter].config);

        const variablePptElements = Object.assign({}, json, {
          prosperiaLogo,
          institutionLogo,
          scenarioName,
          lang: {
            monthNames: [
              "Jan.",
              "Feb.",
              "Mar.",
              "Apr.",
              "May",
              "Jun.",
              "Jul.",
              "Aug.",
              "Sept.",
              "Oct.",
              "Nov.",
              "Dec.",
            ],
          },
          schemeName: this.schemeName,
        });

        jsons.push(variablePptElements);

        tabCounter++;
      }
      
      // should be changed this to a single function call
      jsons.forEach(generateAndDowloadPPT);
    },
    getUserImage(url) {
      return new Promise((resolve, reject) => {
        var img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function() {
          const uri = getImageUrlFromImage(img);
          resolve({
            uri: uri,
            dimensions: {
              width: this.width,
              height: this.height,
              ratio: this.width / this.height,
            },
          });
        };
        img.onerror = reject;
        const _url = "http://" + url.split("://")[1];
        img.src = _url;
      });
    },
    exportChildNodes(childNodes, treeChart) {
      const leaves = [];

      let counter = 0;

      const fn = () => {
        const node = childNodes[counter];

        if (node) {
          const leafNode = node.data.leafNode;

          leafNode.showEditView(0);

          setTimeout(async () => {
            const nodeSize = leafNode.getSize();

            const clonedSvg = select(treeChart.svg.node().cloneNode(true));
            clonedSvg
              .attr("width", nodeSize.width)
              .attr("height", nodeSize.height);

            // reset zoom
            clonedSvg.select(".chart").attr("transform", `translate(0, 0)`);
            clonedSvg
              .select(".center-group")
              .attr("transform", "translate(0, 0)");

            // reset node
            const container = clonedSvg.select("#" + node.data.id);
            container.attr("transform", `translate(${nodeSize.width / 2}, 0)`);

            const quality = 2;
            const uri = await getImageUrl(clonedSvg, nodeSize, quality);

            leaves.push({
              uri,
              dimensions: {
                width: nodeSize.width * quality,
                height: nodeSize.height * quality,
                ratio: nodeSize.width / nodeSize.height,
              },
            });

            setTimeout(() => {
              leafNode.hideEditView();
            }, 100);
          }, 850);
        }

        counter++;
      };

      return new Promise((resolve) => {
        fn();
        const interval = setInterval(() => {
          if (counter > childNodes.length - 1) {
            clearInterval(interval);

            return resolve(leaves);
          }

          fn();
        }, 2000);
      });
    },
    exportTree(treeChart) {
      const bound = treeChart.getBound();
      const ratio = bound.width / bound.height;
      const clonedSvg = select(treeChart.svg.node().cloneNode(true));

      // reset svg
      clonedSvg.select(".chart").attr("transform", `translate(0, 0) scale(1)`);
      clonedSvg
        .select(".center-group")
        .attr("transform", `translate(${-bound.x}, ${-bound.y})`);
      clonedSvg.attr("width", bound.width).attr("height", bound.height);

      return getImageUrl(clonedSvg, {
        width: bound.width,
        height: bound.height,
      }).then((uri) => {
        return {
          uri,
          dimensions: {
            width: bound.width,
            height: bound.height,
            ratio: ratio,
          },
        };
      });
    },
    saveTrees() {
      const states = {};
      
      this.treePageRefs.forEach((d, i) => {
        const state = d.getState();
        const id = this.tabs[i].config.id;
        states[id] = state
      });

      this.saveAllTree({
        user_id: this.userFromAdmin ? this.userFromAdmin._id : null,
        scheme_id: this.scheme_id,
        states,
        active_tab: this.activeTab
      });
    },
    showInfo() {
      const infoBtn = this.$refs.infoBtn;

      if (infoBtn._tippy) {
        infoBtn._tippy.hide();
      }

      const btn = infoBtn.querySelector("img");

      if (btn && this.descriptions) {
        if (btn._tippy) {
          btn._tippy.show();
        } else {
          this.$tippy(btn, {
            allowHTML: true,
            content: `<div class="description-tooltip">${this.descriptions}</div> `,
            placement: "right-start",
            delay: 0,
            distance: 10,
            theme: "light-border",
            trigger: "manual",
            maxWidth: 550,
            interactive: true,
          }).show();
        }
      }
    }
  },
  mounted() {
    this.$tippy("[data-tippy-content]");

    const el = document.querySelector('#tree_content');

    el && el.addEventListener('click', (e) => { 
      if (!e.target.classList.contains('abs-side')) {
        if (this.settings_shown && !this.settings_pinned) {
          this.settings_shown = false;
        }
      }
    });
  },
}
</script>

<style lang="scss" scoped>
.sidebar-content {
  height: 100%;
  border-right: 1px solid #dddddd;

  .list-item {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 8px;
  }

  .btn {
    padding: 0.25rem !important;
    width: 100%;
    border-radius: 0;
  }

  .icon {
    width: 24px;
    height: 24px;
  }

  .btn-aggr-refresh.disabled .icon, .btn-aggr-refresh:disabled .icon {
    opacity: 0.3;
  }

  .btn-pin {
    width: 20px;
    height: 20px;
    padding: 0 !important;
    position: absolute;
    top: 5px;
    right: 5px;

    img {
      width: 100%;
      height: 100%;
    }
  }

  .btn-grey {
    img {
      filter: opacity(0.4);
    }
  }

  .abs-side {
    position: absolute;
    left: 48px;
    top: 101px;
    width: 220px;
    height: calc(100vh - 101px);
    border-right: 1px solid #dddddd;
    background-color: #fff;
    box-shadow: 5px 0 10px -5px #dddddd;
    z-index: 100;
  }

  .grow {
    animation: grow 2s linear infinite; 
  }
}
</style>