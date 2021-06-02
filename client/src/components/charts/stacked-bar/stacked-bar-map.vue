<template>
  <div class="stacked-bar">
    <svg 
      style="font-family: sans-serif"
      class="stacked-bar-chart"
      :width="width" 
      :height="height"
    >
      <g class="chart" :transform="`translate(${margin.left},${margin.top})`"></g>
    </svg>
  </div>
</template>

<script>
import patternify from "@/utils/patternify";
import { select } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { mapState } from "vuex";
import { stack, stackOrderNone } from "d3-shape";
import { extent, sum } from "d3-array";
import tippy from "tippy.js";
import {formatKilo} from '@/utils/formatters';
import { isDark } from "@/utils/color-codes";

export default {
  props: {
    nodes: {
      type: Array,
      required: true
    },
    budget: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      width: 223,
      height: window.innerHeight - 100,
      margin: {
        top: 30,
        left: 35,
        right: 10,
        bottom: 30
      },
      nodeMap: {},
      chart: null,
      svg: null,
      stackGroup: null,
      stacks: []
    };
  },
  computed: {
    ...mapState({
      userTrans: state => state.lang.userTrans,
      lang: state => state.lang.lang
    }),
    allSum() {
      // find a total sum of node's accepted number * its monetary cost
      var totalSum = sum(this.nodes, d => d.cost);

      // take max between the totalSum and budget
      return Math.max(totalSum, this.budget) * 1.2;
    },
    xDomain() {
      return [this.userTrans.population];
    },
    chartWidth() {
      return this.width - this.margin.left - this.margin.right;
    },
    chartHeight() {
      return this.height - this.margin.top - this.margin.bottom;
    },
    xScale() {
      return scaleBand()
        .paddingInner(0.2)
        .domain(this.xDomain)
        .range([0, this.chartWidth]);
    },
    yScale() {
      return scaleLinear()
        .domain([0, this.allSum])
        .range([this.chartHeight, 0]);
    },
    xAxis() {
      return axisBottom(this.xScale);
    },
    yAxis() {
      return axisLeft(this.yScale).tickFormat(formatKilo);
    },
    stackGenerator() {
      const keys = this.nodes.map(d => d.id);

      return stack()
        .keys(keys)
        .order(stackOrderNone);
    },
    scale() {
      const minMax = extent(this.stacks, d => d[0][d.key]);
      const scale = scaleLinear()
        .range([0, 1])
        .domain(minMax);
      return scale;
    }
  },
  methods: {
    onResize() {
      this.draw();
    },
    draw() {
      this.chart.html("");
      this.addAxes();
      this.addBar();
      this.addBudget();
    },
    setStacks() {
      var obj = {};

      this.nodes.forEach(n => {
        obj[n.id] = n.cost;
      });
      
      this.stacks = this.stackGenerator([obj]);
    },
    addAxes() {
      patternify(this.chart, "g", "xAxis")
        .attr("transform", `translate(${0}, ${this.chartHeight})`)
        .call(this.xAxis)
        .call(g => g.selectAll('.tick').remove());

      patternify(this.chart, "g", "yAxis").call(this.yAxis);
    },
    getText(d) {
      const cost = Math.round(d[0].data[d.key]);
      return '$' + formatKilo(cost);
    },
    addBar() {
      const self = this;
      this.setStacks();
      const borderWidth = 0.15;

      const stackGroup = patternify(this.chart, "g", "strack-group").lower();

      const stacks = patternify(stackGroup, "g", "stack-bar", this.stacks)
        .attr("transform", d => {
          return `translate(${this.xScale(this.xDomain[0])}, ${this.yScale(d[0][1])})`
        })
        .classed("stack-map", true)
        .attr("id", d => `stack-map-${d.key}`)
        .attr("cursor", "pointer")
        .on("mouseover", function(d) {
          var node = self.nodeMap[d.key];
          node && node.highlight();
        })
        .on("mouseout", function(d) {
          var node = self.nodeMap[d.key];
          node && node.clearHighlight();
        });

      patternify(stacks, "rect", "bar", d => [d])
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("width", this.xScale.bandwidth())
        .attr("height", d => Math.max(0, this.yScale(d[0][0]) - this.yScale(d[0][1])))
        .attr("fill", d => this.nodeMap[d.key].color)
        .attr('stroke-width', borderWidth)
        .attr('stroke', d => {
          const color = this.nodeMap[d.key].color;
          const dark = isDark(color);
          return dark ? "#fff" : "#A2A2A2";
        });

      patternify(stacks, "text", "label", d => [d])
        .attr("text-anchor", "middle")
        .attr("pointer-events", "none")
        .attr("font-size", "12px")
        .attr("font-weight", "600")
        .attr("x", this.xScale.bandwidth() / 2)
        .attr("y", d => (this.yScale(d[0][0]) - this.yScale(d[0][1])) / 2 + 4)
        .attr("opacity", d => {
          if (this.yScale(d[0][0]) - this.yScale(d[0][1]) < 15) {
            return 0;
          }
          return 1;
        })
        .attr("fill", d => {
          const color = this.nodeMap[d.key].color;
          const textColor = isDark(color) ? "#fff" : "#000";
          return textColor;
        })
        .text(d => {
          return this.getText(d);
        });

      stacks.each(function(d) {
        if (this._tippy) {
          this._tippy.destroy(true);
        }

        const html = d.key + ': ' + self.getText(d);

        tippy(this, {
          theme: "light-border",
          arrow: true,
          content: html,
          placement: "left"
        });
      });
    },
    addBudget() {
      patternify(this.chart, "line", "budget-line")
        .attr("x1", 0)
        .attr("x2", this.chartWidth)
        .attr("y1", this.yScale(this.budget))
        .attr("y2", this.yScale(this.budget))
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "3 3");

      patternify(this.chart, "text", "budget-text")
        .attr("text-anchor", "middle")
        .attr("x", this.chartWidth / 2)
        .attr("dy", -5)
        .attr("y", this.yScale(this.budget))
        .text(this.userTrans.budget)
        .attr("font-size", "10px")
        .attr("font-weight", "600")
        .attr("fill", "red");
    },
    fillNodeMap() {
      this.nodeMap = {};

      if (this.nodes) {
        this.nodes.forEach(n => {
          this.nodeMap[n.id] = n;
        });
      }
    }
  },
  watch: {
    nodes() {
      this.fillNodeMap();
      this.addBar();
      this.addAxes();
      this.addBudget();
    },
    lang() {
      this.fillNodeMap();
      this.draw();
    }
  },
  mounted() {
    this.svg = select(this.$el).select(".stacked-bar-chart");
    this.chart = this.svg.select(".chart");
    this.fillNodeMap();
    this.onResize();
  }
};
</script>

<style lang="scss">
.stacked-bar {
  height: 100%;
}
</style>
