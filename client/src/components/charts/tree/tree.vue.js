import patternify from '@/utils/patternify';
import { select, event } from 'd3-selection';
import LeafNode from './leaf-node';
import LeafNode2d from './leaf-node-2d';
import { tree, hierarchy } from 'd3-hierarchy';
import { zoom, zoomTransform } from 'd3-zoom';
import { mapState } from 'vuex';
import { colors, colorScale } from '@/colors';
import {ascending, min, max} from 'd3-array';
import getColorCodes from "@/utils/color-codes";
import * as mainTypes from '@/store/mutation-types';
import {mergeBins, sumBins} from '@/utils/array';
import { diagonal } from '@/utils/chart';
import { getRandomId } from '@/utils/formatters';
import 'd3-transition';
import {loadChildren, loadPostPolicyData, updateAggrTree} from '../shared/data.js';

export default {
    props: {
        initialData: {
            type: Array,
            required: true
        },
        config: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            width: 500,
            height: window.innerHeight - 60,
            duration: 750,
            maxLevels: (this.config.maxLevels || 4),
            chartMargin: {
                top: 50,
                left: 0,
                right: 0,
                bottom: 0
            },
            dimensions: {
                pieInnerRadius: 25,
                pieOuterRadius: 70,
                pieHistPadding: 30,
                histogramWidth: 400,
                histogramHeight: 200,
                nodePadding: 25
            },
            colors: {
                linkColor: colors.linkColor
            },
            root: null,
            container: null,
            chart: null,
            svg: null,
            centerGroup: null,
            nodes: [],
            treeData: null,
            zoomTransform: {
                x: 0,
                y: 0,
                k: 1
            }
        }
    },
    computed: {
        ...mapState({
            userTrans: state => state.lang.userTrans,
            lang: state => state.lang.lang,
            requestPolicies: state => state.tree.requestPolicies
        }),
        criteriaRange() {
            return this.config.numericalFilters[this.config.criteria[0]];
        },
        populationRange() {
            const criteria = this.config.criteria[0];
            const filter = this.config.filters.find(d => d.value === criteria);
            return filter ? filter.filterValue : null;
        },
        levelPadding() {
            return this.config.type === 'normal' ? 125 : 97;
        },
        mon_cost() {
            return this.config.mon_cost;
        },
        chartWidth() {
            return this.width - this.chartMargin.left - this.chartMargin.right;
        },
        chartHeight() {
            return this.height - this.chartMargin.top - this.chartMargin.bottom;
        },
        nodeWidth() {
            var { dimensions } = this;
            
            return dimensions.pieOuterRadius * 2 + 50;
        },
        nodeHeight() {
            var { dimensions } = this;

            return dimensions.pieOuterRadius * 2 + 20;
        },
        treemap() {
            return tree()
                .nodeSize([this.nodeWidth, this.nodeHeight])
                .separation((a, b) => {
                    return a.parent == b.parent ? 1 : 1.1;
                });
        },
        zoom() {
            return zoom()
                .scaleExtent([0.5, 2])
                .on('zoom', d => this.zoomed(d))
        },
        dy() {
            return (this.dimensions.nodePadding + this.dimensions.pieOuterRadius) * 2 +
                (this.config.type === 'normal' ? 35 : 7) + 
                (this.config.selectionType == '2d' ? 35 : 0) + 
                (this.mon_cost ? 35 : 0)
        },
        whitespace() {
            var space = this.config.selectionType == '2d' ? 58 : 34;
            return space + (this.mon_cost ? 35 : 0);
        },
        colorCodes() {
            var leafNodes = [];

            var nodes = this.nodes.filter(x => x.data.children.length == 0);
      
            if (nodes.length == 1) {
              leafNodes.push([nodes[0].data.id]);
            } else if (nodes.length > 1) {
              var family = [nodes[0].data.id];
      
              for (let i = 1; i < nodes.length; i++) {
                var prev = nodes[i - 1];
                var curr = nodes[i];
      
                if (prev.parent != curr.parent) {
                  leafNodes.push(family);
                  family = [];
                }
      
                family.push(curr.data.id);
              }
      
              leafNodes.push(family);
            }
      
            return getColorCodes(leafNodes);
        }
    },
    methods: {
        // saves nodes to parent.
        // these nodes are used for cost bar.
        setNodes(nodes) {
            this.$emit('on-nodes-update', nodes.slice().sort((a, b) => {
                if (a.depth < b.depth) {
                  if (b.parent) return a.x - b.parent.x;
                } else if (a.depth > b.depth) {
                  if (a.parent) return a.parent.x - b.x;
                }
                return a.x - b.x;
            }))
        },

        setWidth() {
            // 223 is cost bar width
            // 48 is sidebar width
            this.width = window.innerWidth - 223 - 48; 
        },
        setHeight() {
            this.height = window.innerHeight - 110;
        },
        getHierarchy() {
            return hierarchy(this.treeData, d => d.children);
        },
        zoomed() {
            const chart = this.chart;

            // Get d3 event's transform object
            this.zoomTransform = event.transform;

            // Reposition and rescale chart accordingly
            chart.attr('transform', this.zoomTransform);

            if (window.tooltips) {
                window.tooltips.forEach(t => t.hide())
            }
        },
        drawSvg() {
            var svg = patternify(this.container, 'svg', 'svg-chart')
                .attr('width', this.width)
                .attr('height', this.height)
                .style('cursor', 'grab')
                .style('font-family', "sans-serif")
                .call(this.zoom)
                .on('dblclick.zoom', null)

            // var defs = patternify(svg, 'defs', 'defs');

            // patternify(defs, 'style', 'svg-style')
            //     .attr('type', 'text/css')
            //     .text("@import url('https://fonts.googleapis.com/css?family=Nunito&display=swap');")

            return svg;
        },
        drawChart() {
            this.chart = patternify(this.svg, 'g', 'chart').html('');

            this.centerGroup = patternify(this.chart, 'g', 'center-group')
                .attr('transform', `translate(${this.chartMargin.left}, ${this.chartMargin.top})`);

            this.linkGroup = this.centerGroup
                .append('g')
                .attr('class', 'link-group');

            this.labelsGroup = this.centerGroup
                .append('g')
                .attr('class', 'labels-group');

            this.nodeGroup = this.centerGroup
                .append('g')
                .attr('class', 'node-group');

            this.root = this.getHierarchy();

            this.root.x0 = this.chartWidth / 2;
            this.root.y0 = 0;

            this.updateTree(this.root);
        },
        addSpace(nodeDatum) {
            nodeDatum.forEach(d => {
                var components = d.leafNode.components;

                components.pie.translateYBy(0);

                components.collapseBtn.translateYBy(0);
            });
        },
        removeSpace(nodeDatum) {
            nodeDatum.forEach(d => {
                var components = d.leafNode.components;

                components.pie.translateYBy(
                    -this.whitespace
                );

                components.collapseBtn.translateYBy(
                    -this.whitespace
                );
            });
        },
        handleCollapse(node) {
            const newData = sumBins(node.data.children.map(d => d.data));

            node.data.children = [];
            node.data.expanded = false;

            // recompute root hierarchy
            this.root = this.getHierarchy();

            this.updateTree(node, true, true);

            if (node.data.isRoot) {
                this.showRootSliderGap();
            }

            if (this.config.type === "aggregation") {
                node.data.data = newData;
                node.data.leafNode.updateHistogram(newData);
            } else {
                this.refreshHistogram(node, node.data.value);
            }
        },
        updateTree(source, triggerUpdate, isCollapse) {
            // Assigns the x and y position for the nodes
            var treeData = this.treemap(this.root);

            // Compute the new tree layout.
            var nodes = treeData.descendants();

            this.nodes = nodes;

            // Normalize for fixed-depth.
            nodes.forEach(d => {
                d.x += this.chartWidth / 2;
                d.y = d.depth * (
                    (this.dimensions.pieOuterRadius * 2 + this.levelPadding + (this.mon_cost ? 35 : 0)) + 
                    (this.config.selectionType == '2d' ? 35 : 0)
                );

                var colorCode = this.colorCodes[d.data.id];

                if (d.data.children.length || colorCode == undefined) {
                    d.data.color = colors.acceptedGreen;
                    d.data.colorPercent = 0.5;
                } else {
                    d.data.color = colorScale(colorCode);
                    d.data.colorPercent = colorCode;
                }
            });

            if (isCollapse) {
                var newNode = nodes.filter(d => d.data.id == source.data.id)[0];
                source.x0 = newNode.x;
                source.y0 = newNode.y;
            }

            var links = nodes.slice(1);

            this.addNodes(source, nodes);
            this.addLinks(source, links);

            this.chart.selectAll('g.node')
                .filter(d => d.data.id == source.data.id)
                .raise();

            this.labelsGroup.html('');

            setTimeout(() => {
                this.appendLabels(nodes);
            }, this.duration)

            if (triggerUpdate) {
                nodes.forEach(d => {
                    const data = d.data;
                    const level = d.depth;

                    var components = data.leafNode.components;
                    var selectionType = this.config.selectionType;

                    if (data.expanded) {
                        if (selectionType == '1d') {
                            if (components.editBtn) {
                                components.editBtn.hide();
                            }
                            
                        } else {
                            components.editBtnX.hide();
                            components.editBtnY.hide();
                        }

                        components.splitBtn.hide();
                        components.collapseBtn.show();

                        if (components.costSlider) {
                            components.costSlider.hide();
                        }
                    } else {
                        if (selectionType == '1d') {
                            if (components.editBtn) {
                                components.editBtn.show();
                            }
                        } else {
                            components.editBtnX.show();
                            components.editBtnY.show();
                        }

                        if (data.splitBy.length && level < this.maxLevels - 1) {
                            components.splitBtn.show();
                        }

                        components.collapseBtn.hide();
                        
                        if (components.costSlider) {
                            components.costSlider.show();
                        }
                    }

                    data.leafNode.updateColor(d.data.color);
                });
            }

            this.setNodes(nodes.filter(d => d.data.children.length == 0));

            if (source.data.isRoot && source.data.children.length > 0) {
                this.hideRootSliderGap();
            }
        },
        addLinks(sourceNode, links) {
            var linkSource = {
                x: sourceNode.x0,
                y: sourceNode.y0 + this.dy
            };

            // Update the links...
            var link = this.linkGroup.selectAll('path.link')
                .data(links, d => d.data.id);

            // Enter any new links at the parent's previous position.
            var linkEnter = link.enter()
                .append('path')
                .attr("class", 'link')
                .attr('fill', 'none')
                .attr('stroke', this.colors.linkColor)
                .attr('d', diagonal(linkSource, linkSource));

            // UPDATE
            var linkUpdate = linkEnter.merge(link);

            // Transition back to the parent element position
            linkUpdate.transition()
                .duration(this.duration)
                .attr('d', d => {
                    return diagonal({
                        x: d.x,
                        y: d.y - 30
                    }, {
                        x: d.parent.x,
                        y: d.parent.y + this.dy - 2
                    });
                })
                .attr('id', d => {
                    return `link-${d.data.id}-${d.parent.data.id}`;
                })

            // Remove any exiting links
            link.exit().transition()
                .duration(this.duration)
                .attr('d', diagonal(linkSource, linkSource))
                .remove();
        },
        addNodes(source, nodes) {
            var self = this;

            // Update the nodes...
            var node = this.nodeGroup.selectAll('g.node')
                .data(nodes, d => d.data.id);

            // Enter any new modes at the parent's previous position.
            var nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr('id', d => d.data.id)
                .attr("transform", "translate(" + source.x0 + "," + source.y0 + ")");

            nodeEnter.each(function (d) {
                var container = select(this);

                var criteriaPriority = (self.config.selectionType == '1d') ? 'high' : ['high', 'high'];

                if (self.config.criteriaPriority && self.config.criteriaPriority.length) {
                    criteriaPriority = self.config.criteriaPriority;
                }

                const criteriaRangeArr = self.criteriaRange ? [self.criteriaRange.min, self.criteriaRange.max] : null;

                d.data.leafNode = (self.config.selectionType == '2d' ? LeafNode2d : LeafNode)({
                    container,

                    criteriaRange: criteriaRangeArr, // full range
                    visualizationRange: self.config.xExtent || criteriaRangeArr, // visualization range defined on upload dataset
                    populationRange: self.populationRange || criteriaRangeArr, // filter defined in specifications

                    maxDomain: self.config.yExtent ? self.config.yExtent[1] : null,

                    node: d.data,
                    sections: self.config.sections,
                    parent: d.parent,
                    dimensions: self.dimensions,
                    translations: self.userTrans,
                    hideSplitBtn: d.depth >= self.maxLevels - 1,
                    criteriaPriority,
                    treeParams: {
                        chartHeight: self.chartHeight,
                        chartWidth: self.chartWidth,
                        margin: self.chartMargin,
                        zoomTransform: self.zoomTransform
                    },
                    impact_factors: self.config.impact_factors,
                    cost_factors: self.config.cost_factors,
                    selectedSection: self.config.selected_section,
                    pie_label: self.config.pie_label || self.userTrans.pie_label_default,
                    treeType: self.config.type,
                    onHistogramUpdateClick: (threshold, callback) => {
                        self.refreshHistogram(d, Math.ceil(threshold)).then(() => callback());
                    }
                });
            });

            // UPDATE
            var nodeUpdate = nodeEnter.merge(node);

            nodeUpdate.each((d) => {
                if (d.data.leafNode) {
                    d.data.leafNode
                        .onSplit((selected, value) => {
                            self.handleSplit(d, selected, value);
                        })
                        .onCollapse(() => {
                            self.handleCollapse(d);
                        })
                        .onUpdate(() => {
                            self.setNodes(nodes.filter(x => x.data.children.length == 0));
                        })
                        .onCostSliderUpdate((value) => {
                            d.data.mon_cost.value = value;
                            self.setNodes(nodes.filter(x => x.data.children.length == 0));
                        })
                        // .onCostFactorSelect(() => {
                        //     self.setNodes(nodes.filter(x => x.data.children.length == 0));
                        // })
                        .onImpactFactorSelect(() => {
                            self.setNodes(nodes.filter(x => x.data.children.length == 0));
                        })
                        .onEditViewOpen(({
                            container,
                            nodeHeight,
                            othersOpacity = 0.3
                        }) => {
                            const transform = zoomTransform(this.svg.node());

                            this.nodeGroup.selectAll('g.node')
                                .filter(x => x !== d)
                                .attr('opacity', othersOpacity)
                                .attr('pointer-events', 'none');

                            this.labelsGroup.attr('opacity', othersOpacity);
                            this.linkGroup.attr('opacity', othersOpacity);

                            container.transition()
                                .duration(this.duration)
                                .attr('transform', () => {
                                    const scale = (1 / transform.k) * (this.config.selectionType == '2d' ? 1.15 : 1.5);

                                    const x = this.width / 2;
                                    const y = (this.chartHeight - nodeHeight) / 2 + (d.data.isRoot ? -18 : (this.whitespace - 18));
                                    
                                    const invertedX = transform.invertX(x);
                                    const invertedY = transform.scale(scale).invertY(y);
                                    
                                    return `translate(${invertedX}, ${invertedY}) scale(${scale})`;
                                });
                        })
                        .onEditViewClose(({
                            container
                        }) => {
                            this.nodeGroup.selectAll('g.node')
                                .attr('opacity', null)
                                .attr('pointer-events', null);

                            this.labelsGroup.attr('opacity', null);
                            this.linkGroup.attr('opacity', null);

                            container.transition()
                                .duration(this.duration)
                                .attr('transform', x => `translate(${x.x}, ${x.y}) scale(1)`);
                        });
                }
            });

            // Transition to the proper position for the node
            nodeUpdate
                .transition()
                .duration(this.duration)
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                })

            // Remove any exiting nodes
            node.exit()
                .transition()
                .duration(this.duration)
                .attr("transform", function () {
                    return "translate(" + source.x0 + "," + source.y0 + ")";
                })
                .remove();

            // Store the old positions for transition.
            nodes.forEach(function (d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        },
        appendLabels(nodes) {
            nodes.forEach(node => {
                if (node.data.expanded) {
                    var sx = node.x;
                    var sy = node.y + this.dy - 8;
                    var selected = node.data.selected;

                    this.labelsGroup.append('text')
                        .attr('text-anchor', 'middle')
                        .attr('font-weight', 'bold')
                        .attr('x', sx)
                        .attr('y', sy)
                        .text(selected);

                    node.children.forEach(c => {
                        var x = c.x;
                        var y = c.y - 15;

                        this.labelsGroup.append('text')
                            .attr('text-anchor', 'middle')
                            .attr('x', x)
                            .attr('y', y)
                            .text(c.data.name)
                            .attr('fill', '#666666')
                            .attr('font-size', '15px')
                    })
                }
            });
        },
        hideRootSliderGap() {
            if (this.config.type !== 'normal') return;

            this.svg
                .select('.root-title')
                .transition()
                .duration(750)
                .attr('y', this.whitespace - 18);

            this.centerGroup
                .transition()
                .duration(750)
                .attr('transform', `translate(${this.chartMargin.left}, ${this.chartMargin.top - this.whitespace})`);
        },
        showRootSliderGap() {
            if (this.config.type !== 'normal') return;

            this.svg
                .select('.root-title')
                .transition()
                .duration(750)
                .attr('y', -18);

            this.centerGroup
                .transition()
                .duration(750)
                .attr('transform', `translate(${this.chartMargin.left}, ${this.chartMargin.top})`);
        },
        onResize() {
            this.setWidth();
            this.setHeight();
            this.drawSvg();
            this.drawChart();
        },
        getId() {
            return `node-${getRandomId()}`;
        },        
        getRoot() {
            return JSON.parse(JSON.stringify(this.root.data));
        },
        getTreeData() {
            if (this.config.tree_state) {
                return this.config.tree_state;
            }

            const criteria = this.config.selectionType == '1d' ? this.config.criteria[0] : this.config.criteria;

            return {
                isRoot: true,
                id: this.getId({ depth: 0 }),
                name: this.userTrans.root_title,
                indicator: criteria,
                criteria: criteria,
                sections: this.config.sections,
                criteriaPriority: this.config.criteriaPriority,
                data: this.initialData,
                value: this.config.defaultThresholdValue,
                defaultThresholdValue: this.config.defaultThresholdValue,
                fakePercent: {
                    pie_percent_pre: null,
                    pie_percent_post: null,
                    siblings_sum_pre: null,
                    siblings_sum_post: null
                },
                splitBy: this.config.splitBy,
                children: [],
                cost_factor: this.config.current_cost_factor,
                impact_factor: this.config.current_impact_factor,
                statistics: this.config.statistics,
                mon_cost: this.mon_cost ? {
                    min: +this.mon_cost.min,
                    max: +this.mon_cost.max,
                    value: +this.mon_cost.value
                } : null
            }
        },
        getChildNodes() {
            return this.nodes.filter(d => d.data.children.length == 0);
        },
        getBound() {
            const minX = min(this.nodes, d => d.x) - this.dimensions.pieOuterRadius - 30;
            const minY = min(this.nodes, d => d.y);
            const maxX = max(this.nodes, d => d.x) + this.dimensions.pieOuterRadius + 20;
            const maxY = max(this.nodes, d => d.y) + this.dimensions.pieOuterRadius * 2 + 110;

            const x = minX;
            const y = minY;
            const width = Math.abs(maxX - minX);
            const height = Math.abs(maxY - minY);

            return {
                x,
                y,
                width,
                height
            }
        },
        updateAllChildNodes() {
            const children = this.getChildNodes();

            this.$store.commit(mainTypes.SET_DATA_LOADING, true);

            if (children.length === 1 && children[0].depth === 0) {
                return this.refreshHistogram(children[0], children[0].data.value).then(() => {
                    this.setNodes(children);
                });
            }

            return updateAggrTree(children, this.config, this.requestPolicies).then(resp => {
                const map = new Map(resp.map(d => [d.nodeId, d.data]));
                children.forEach(node => {
                    node.data.loading = false;
                    const newData = map.get(node.data.id);

                    if (newData) {
                        node.data.data = newData;
                        node.data.leafNode.updateHistogram(newData);
                    }
                });
                this.setNodes(children);
                this.$store.commit(mainTypes.SET_DATA_LOADING, false);
                return true;
            });
        },
        async refreshHistogram(node, threshold) {
            if (this.config.selectionType !== '1d') {
                return;
            }

            try {
                this.$store.commit(mainTypes.SET_DATA_LOADING, true);
                const data = await loadPostPolicyData(node, threshold, this.config, this.requestPolicies);
                this.$store.commit(mainTypes.SET_DATA_LOADING, false);
                node.data.data = mergeBins(node.data.data, data, this.criteriaRange);
                node.data.leafNode.updateHistogram(node.data.data);
            } catch (error) {
                this.$store.commit(mainTypes.SET_DATA_LOADING, false);
                this.flash(
                    error.message,
                    "error"
                );
            }
        },
        async loadChildren(group_id, node, value) {
            // get the categorical filters
            var groupCategories;

            if (this.config.matchCase && this.config.matchCase[group_id] && this.config.matchCase[group_id].$in) {
                groupCategories = this.config.matchCase[group_id].$in;
            } else {
                groupCategories = this.config.categoricalFilters[group_id] || [];
            }

            if (groupCategories && groupCategories.length > 30) {
                return this.flash(
                    this.userTrans.split_warning,
                    "error"
                );
            }

            let data;

            try {
                this.$store.commit(mainTypes.SET_DATA_LOADING, true);

                data = await loadChildren(
                    group_id,
                    node, 
                    value, 
                    this.config, 
                    this.requestPolicies, 
                    groupCategories
                );

                this.$store.commit(mainTypes.SET_DATA_LOADING, false);

            } catch (error) {
                this.$store.commit(mainTypes.SET_DATA_LOADING, false);

                this.flash(
                    error.message,
                    "error"
                );
            }

            return data;
        },
        async handleSplit(node, selected, value) {
            var group_id = selected,
                mon_cost = node.data.mon_cost,
                impact_factor = node.data.impact_factor,
                cost_factor = node.data.cost_factor;

            var data = await this.loadChildren(group_id, node, value);

            if (data) {
                var children = data.map(d => {
                    return {
                        id: this.getId(node),
                        name: d.key,
                        indicator: d.key,
                        criteria: this.config.selectionType == '1d' ? this.config.criteria[0] : this.config.criteria,
                        data: d.bins,
                        value: value,
                        fakePercent: {
                            pie_percent_pre: null,
                            pie_percent_post: null,
                            siblings_sum_pre: null,
                            siblings_sum_post: null
                        },
                        children: [],
                        splitBy: node.data.splitBy.filter(d => d != selected),
                        mon_cost: mon_cost ? {...mon_cost} : null,
                        impact_factor: impact_factor,
                        cost_factor: cost_factor,
                        statistics: node.data.statistics
                    };
                })

                this.$set(node.data, 'children', children.sort((a, b) => ascending(a.name, b.name)));

                node.data.expanded = true;
                node.data.selected = selected;

                // recompute root hierarchy
                this.root = this.getHierarchy();
                this.updateTree(node, true, false);
            }
        }
    },
    mounted() {
        if (this.config.selectionType == '2d') {
            this.dimensions.histogramHeight = this.dimensions.histogramWidth;
        }

        this.setWidth();
        this.setHeight();
        this.treeData = this.getTreeData();

        this.container = select(this.$el);
        this.svg = this.drawSvg();
        this.drawChart();

        select(window).on(`resize.${getRandomId()}`, () => {
            this.setWidth();
            this.setHeight();
            this.drawSvg();
        });

        // automatically update aggregation tree
        if (this.config.type === "aggregation") {
            setTimeout(() => {
                this.updateAllChildNodes();
            }, 100);
        }
    },
    watch: {
        lang() {
            this.drawChart();
        }
    }
}