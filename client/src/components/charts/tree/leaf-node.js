import renderPie from './pie';
import renderHistogram from './histogram';
import renderButton from './button';
import renderSlider from './slider';
import renderTextButton from './text-button';
import { extent, sum } from 'd3-array';
import tippy from 'tippy.js';
import Statistic from './statistic';
import { refreshIcon, costFactorIcon, impactFactorIcon, splitIcon, collapseIcon } from '@/utils/constants';
import renderPie2Level from './pie-2level';
import { getTooltipHtml } from '@/utils/tooltip';
import { getStatsData } from '../shared/stats-calc';
import { allocateBinsToBounds } from '@/utils/array';

const btnStyle = `
    padding: .25rem .5rem; 
    font-size: .875rem; line-height: 1.5; 
    border-radius: .2rem; 
    text-align: center;
    vertical-align: middle;
    display: inline-block;
    font-weight: 400;
    border: 1px solid transparent;
`;

function LeafNode(params) {
    var {
        container,
        node,
        dimensions,
        parent,
        translations,
        hideSplitBtn,
        criteriaPriority,
        sections,
        selectedSection,
        impact_factors,
        cost_factors,
        pie_label
    } = params;

    var data = node.data;
    var cost_factor = node.cost_factor;
    var impact_factor = node.impact_factor;
    var mon_cost = node.mon_cost;
    var statistics = node.statistics;

    var histogramY = 45;
    var costSliderDy = mon_cost ? 35 : 0;
    var selectedSectionValue = selectedSection ? selectedSection.value : null;

    var padding = dimensions.nodePadding;
    var width = padding * 2 + dimensions.pieOuterRadius * 2 + dimensions.pieHistPadding + dimensions.histogramWidth;
    var height = padding * 2 + dimensions.histogramHeight + histogramY + (statistics && statistics.length ? (statistics.length * 40 - 30) : 0);
    var xTranslation = -width / 2 + padding;
    var splitBtnMargin = 8;
    var editView = params.editView || false;

    var showSplitBtn = node.splitBy.length > 0;
    var showUpdateBtn = impact_factor || false;
    const postPolicy = (impact_factor || params.treeType === 'aggregation');

    if (hideSplitBtn) {
        showSplitBtn = false;
    }

    var showThresholdSlider = params.treeType === 'normal';

    var minMax = params.visualizationRange || extent(data, d => d.criteria);

    // adjust node.value to cover all the bins
    if (node.value >= minMax[1]) {
        if (criteriaPriority === 'high') {
            node.value = minMax[1] + 1;
        } else {
            node.value = minMax[1];
        }
    }
    
    if (node.value <= minMax[0]) {
        if (criteriaPriority === 'low') {
            node.value = minMax[0] - 1;
        } else {
            node.value = minMax[0];
        }
    }

    var currentValue = node.value;
    var oldValue = node.value;
    var total = sum(data, d => d.sum);

    node.total = total;

    var getAcceptedPoints = (value, prop = 'sum') => {
        const _currentValue = (value || currentValue);

        return sum(data.filter(d => {
            return criteriaPriority == 'high' ? d.criteria >= _currentValue : d.criteria <= _currentValue
        }), d => d[prop]);
    }

    var getPieValue = (prop = 'sum') => {
        let accepted = getAcceptedPoints(selectedSectionValue, prop);
        return (accepted / total) * 100;
    }

    var pieValue, pieValueLevel2, sumOfSiblings, sumOfSiblingsLayer2;

    // need to pull out the fake percent and sums.
    // `fake` means not calculated from the data but from children.
    var {
        pie_percent_pre = null,
        pie_percent_post = null,
        siblings_sum_pre = null,
        siblings_sum_post = null
    } = node.fakePercent || {};

    if (node.fakePercent && node.children.length > 0 && pie_percent_pre !== null && siblings_sum_pre !== null) {
        pieValue = pie_percent_pre;
        sumOfSiblings = siblings_sum_pre;
    } else {
        pieValue = getPieValue();
        sumOfSiblings = getAcceptedPoints(selectedSectionValue, 'sum');
    }

    if (postPolicy) {
        if (node.fakePercent && node.children.length > 0 && pie_percent_post !== null && siblings_sum_post !== null) {
            pieValueLevel2 = pie_percent_post;
            sumOfSiblingsLayer2 = siblings_sum_post;
        } else {
            pieValueLevel2 = getPieValue('current');
            sumOfSiblingsLayer2 = getAcceptedPoints(selectedSectionValue, 'current');
        }
    }

    var noop = function () {};

    var splitFunc = noop,
        collapseFunc = noop,
        onUpdate = noop,
        onEditViewOpen = noop,
        onEditViewClose = noop,
        onCostSliderUpdate = noop, 
        onRefreshClick = noop,
        onImpactFactorSelect = noop,
        onCostFactorSelect = noop;

    // components
    var slider,
        pie,
        splitBtn,
        histogram,
        editBtn,
        backgroundRect,
        collapseBtn,
        cancelBtn,
        okBtn,
        costSlider,
        refreshHistogram,
        costFactorBtn,
        impactFactorBtn,
        statsComponents,
        pieLabel, 
        breadcrumb, 
        defineThreshholds;

    function main() {
        // add pie chart
        pie = (postPolicy ? renderPie2Level : renderPie)({
            container,
            translations,
            id: node.id,
            node: node,
            value: postPolicy ? [pieValue, pieValueLevel2] : pieValue,
            pieInnerRadius: dimensions.pieInnerRadius,
            pieOuterRadius: params.pieOuterRadius,
            title: pie_label,
            translation: [
                editView ? width / 2 - padding - dimensions.pieOuterRadius : 0,
                dimensions.pieOuterRadius + costSliderDy + (showThresholdSlider ? 25 : 0)
            ]
        }).onPieClick(function () {
            if (!node.expanded && !editView) {
                showEditView();
            }
        }).onPieMouseover(function () {
            if (node.expanded) {
                h(node);
                
                // eslint-disable-next-line
                function h(n) {
                    if (n.children) {
                        n.children.forEach(d => {
                            d.leafNode.components.pie.highlight(false);

                            h(d);
                        });
                    }
                }
            }
        }).onPieMouseOut(function () {
            if (node.expanded) {
                c(node);

                // eslint-disable-next-line
                function c(n) {
                    if (n.children) {
                        n.children.forEach(d => {
                            d.leafNode.components.pie.clearHighlight();

                            c(d);
                        });
                    }
                }
            }
        });

        if (statistics && statistics.length) {
            statsComponents = [];
            const statsData = getStatisticData();
            const rectHeight = 18;
            
            statistics.forEach((s, i) => {
                const comp = Statistic({
                    id: 'stat_' + i,
                    container,
                    translation: [
                        width / 2 - padding - dimensions.pieOuterRadius * 2,
                        padding + dimensions.pieOuterRadius * 2 + costSliderDy + 25 + i * (rectHeight + 15)
                    ],
                    width: dimensions.pieOuterRadius * 2,
                    data: statsData[i],
                    title: s.name,
                    rectHeight,
                    visible: false 
                });

                statsComponents.push(comp);
            })
        }  

        // add histogram
        histogram = renderHistogram({
            data: allocateBinsToBounds(data, params.visualizationRange),
            criteriaRange: params.visualizationRange,
            maxDomain: params.maxDomain,
            sections,
            container: container,
            currentValue: currentValue,
            fieldName: node.criteria,
            width: dimensions.histogramWidth,
            height: dimensions.histogramHeight,
            visible: editView,
            criteriaPriority: criteriaPriority,
            impact_factor: postPolicy,
            translation: [
                xTranslation,
                height - dimensions.histogramHeight - padding - (statistics && statistics.length ? (statistics.length * 40 - 40) : 0),
            ],
            color: node.color,
            colorPercent: node.colorPercent
        }).onUpdate(function () {
            pieValue = getPieValue();

            if (postPolicy) {
                pieValueLevel2 = getPieValue('current');
            }

            if (statistics && statistics.length && statsComponents) {
                const statsData = getStatisticData();
                statistics.forEach((s, i) => statsComponents[i].update(statsData[i]));
            }

            pie.update(postPolicy ? [pieValue, pieValueLevel2] : pieValue);
        })

        if (showThresholdSlider) {
            // add slider
            slider = histogram.addSlider({
                value: node.value,
                visible: editView
            }).onChange(function (value) {
                currentValue = value;

                if (editBtn) {
                    editBtn.update(value);
                }

                histogram.update(value);

                if (parent) {
                    updateParents(parent);
                }

                onUpdate();
            })
        }

        collapseBtn = renderButton({
            container,
            translation: [
                editView ? dimensions.pieOuterRadius + padding - width / 2 : 0,
                dimensions.pieOuterRadius * 2 + splitBtnMargin + costSliderDy + (showThresholdSlider ? 25 : 0)
            ],
            visible: false,
            btnUrl: collapseIcon
        }).click(function () {
            // currentValue = getValue(data, sumOfSiblings / total, criteriaPriority);

            // editBtn.update(currentValue);
            // histogram.update(currentValue);

            // if (slider) {
            //     slider.update(currentValue);
            // }

            collapseFunc();
        });

        // split button
        splitBtn = renderButton({
            container,
            translation: [
                editView ? dimensions.pieOuterRadius + padding - width / 2 : 0,
                dimensions.pieOuterRadius * 2 + splitBtnMargin + costSliderDy + (showThresholdSlider ? 25 : 0)
            ],
            visible: (!editView && showSplitBtn),
            btnUrl: splitIcon
        });

        if (showThresholdSlider) {
            editBtn = renderSlider({
                icon: 'filter',
                container,
                tooltip: node.criteria,
                color: node.color,
                x: -dimensions.pieOuterRadius,
                y: 5,
                width: dimensions.pieOuterRadius * 2,
                min: criteriaPriority == 'low' ? minMax[0] - 1 : minMax[0],
                max: criteriaPriority == 'high' ? minMax[1] + 1 : minMax[1],
                value: node.value,
                sections: sections,
                priority: criteriaPriority,
                name: node.criteria,
                showProgress: true,
                visible: !editView
            }).onChange(function (value) {
                currentValue = Math.ceil(value);
                node.value = currentValue;
                
                if (slider) {
                    slider.update(value);
                }

                if (editBtn) {
                    editBtn.update(value);
                }

                histogram.update(value);
    
                if (parent) {
                    updateParents(parent);
                }
    
                onUpdate();
            })
            // .click(function () {
            //     showEditView();
            // });
        }

        // cost slider
        if (mon_cost) {        
            costSlider = renderSlider({
                icon: cost_factor ? cost_factor.icon.value : 'dollar',
                container,
                color: node.color,
                tooltip: translations.amount_per_unit,
                formatThousands: true,
                x: -dimensions.pieOuterRadius, 
                y: costSliderDy + 5,
                width: dimensions.pieOuterRadius * 2,
                min: mon_cost.min,
                max: mon_cost.max,
                value: mon_cost.value,
                visible: !editView
            }).onChange(function (value) {
                onCostSliderUpdate(Math.ceil(value));
            })

            if (showUpdateBtn) {
                onRefreshClick = () => {
                    if (!node.loading) {
                        container.selectAll('.refresh-icon').classed('loading', true)
                        node.loading = true;
    
                        params.onHistogramUpdateClick(currentValue, () => {
                            container.selectAll('.refresh-icon').classed('loading', false)
                            node.loading = false;
                        });
                    }
                }

                refreshHistogram = renderTextButton({
                    container,
                    translation: [width / 2 - padding - 50, padding - 3],
                    visible: editView,
                    html: `<button 
                        class="btn btn-sm btn-outline-light p-1" 
                        style="border: none; line-height: 12px; background-color: transparent;"
                    >
                        <img src="${refreshIcon}" style="width: 15px; height: 15px;" class="refresh-icon" />
                    </button>`
                }).click(onRefreshClick);

                const t1 = tippy(refreshHistogram.getNode(), {
                    theme: 'light-border',
                    arrow: true,
                    followCursor: true,
                    content: translations.refresh_btn_tooltip,
                    placement: 'right'
                });
    
                window.tooltips.push(t1);

                impactFactorBtn = renderTextButton({
                    container,
                    translation: [width / 2 - padding - 25, padding - 3],
                    visible: editView,
                    html: `
                        <button class="btn btn-sm btn-outline-light p-1" style="border: none; line-height: 12px; background-color: transparent;">
                            <img src="${impactFactorIcon}" style="width: 16px; height: 14px;" />
                        </button>
                    `
                })

                const t2 = tippy(impactFactorBtn.getNode().querySelector('button'), {
                    theme: 'light-border',
                    arrow: true,
                    content: translations.impact_factor_tooltip,
                    followCursor: true,
                    placement: 'right'
                });
    
                window.tooltips.push(t2);

                const t = tippy(impactFactorBtn.getNode(), {
                    theme: 'light-border',
                    trigger: 'click',
                    interactive: true,
                    arrow: true,
                    content: getTooltipHtml({ 
                        options: impact_factors,
                        nodeId: 'impact-' + node.id, 
                        headerText: 'Select impact factor', 
                        btnText: 'Select', 
                        btnClass: 'btn-outline-success', 
                        selectedIndex: impact_factors.indexOf(node.impact_factor || impact_factor)
                    }, 
                        (selected) => {
                            impact_factor = selected;
                            node.impact_factor = selected;
                            onRefreshClick();
                            onImpactFactorSelect(selected);
                            t.hide();
                        }
                    ),
                    placement: 'left'
                });
    
                window.tooltips.push(t);
            }

            if (cost_factor) {
                costFactorBtn = renderTextButton({
                    container,
                    translation: [width / 2 - padding, padding - 3],
                    visible: editView,
                    html: `
                        <button class="btn btn-sm btn-outline-light p-1" style="border: none; line-height: 12px; background-color: transparent;">
                            <img src="${costFactorIcon}" style="width: 16px; height: 14px;" />
                        </button>
                    `
                })

                const t = tippy(costFactorBtn.getNode(), {
                    theme: 'light-border',
                    trigger: 'click',
                    interactive: true,
                    arrow: true,
                    content: getTooltipHtml({ 
                        options: cost_factors.map(d => d.name),
                        nodeId: 'cost-' + node.id, 
                        headerText: 'Select cost factor', 
                        btnText: 'Select', 
                        btnClass: 'btn-outline-success', 
                        selectedIndex: cost_factors.findIndex(d => d.name === cost_factor.name)
                    }, 
                        (selected) => {
                            cost_factor = cost_factors.filter(d => d.name === selected)[0];
                            node.cost_factor = cost_factor;
                            onUpdate();
                            onCostFactorSelect(cost_factor);
                            costSlider && costSlider.updateIcon(cost_factor.icon.value);
                            t.hide();
                        }
                    ),
                    placement: 'left'
                });
    
                window.tooltips.push(t);
                
                const t3 = tippy(costFactorBtn.getNode().querySelector('button'), {
                    theme: 'light-border',
                    arrow: true,
                    content: translations.cost_factor_tooltip,
                    followCursor: true,
                    placement: 'right'
                });
    
                window.tooltips.push(t3);
            }
        }

        cancelBtn = renderTextButton({
            container,
            translation: [
                width / 2 - padding - 18,
                height - padding
            ],
            visible: editView,
            html: `<button 
                    class="btn btn-sm btn-outline-secondary"
                    style="${btnStyle} color: #6c757d; border-color: #6c757d; background-color: #fff;"
                >
                    ${translations.cancel_btn}
                </button>`
        }).click(() => {
            if (currentValue != oldValue) {
                currentValue = oldValue;

                histogram.update(currentValue);

                if (editBtn) {
                    editBtn.update(currentValue);
                }

                if (slider) {
                    slider.update(currentValue);
                }


                if (parent) {
                    updateParents(parent);
                }

                onUpdate();

                setTimeout(() => {
                    hideEditView();
                }, 750);
            } else {
                hideEditView();
            }
        });

        okBtn = renderTextButton({
            container,
            translation: [
                width / 2 - 110,
                height - padding
            ],
            visible: editView,
            html: `<button 
                class="btn btn-sm btn-outline-success" 
                style="${btnStyle} color: #28a745; border-color: #28a745; background-color: #fff; padding-left: 1rem !important; padding-right: 1rem !important;"
            >
                ${translations.ok_btn}
            </button>`
        }).click(() => {
            oldValue = currentValue;
            node.value = currentValue;
            onRefreshClick();
            onUpdate();
            hideEditView();
        })

        if (node.isRoot) {
            container.append('text')
                .attr('class', 'root-title')
                .attr('text-anchor', 'middle')
                .attr('font-weight', 'bold')
                .attr('y', -18)
                .text(node.name);
        }

        if (pie_label) {
            pieLabel = container.append('text')
                .attr('class', 'pie-label')
                .attr('text-anchor', 'middle')
                .attr('pointer-events', 'none')
                .attr('opacity', 0)
                .attr('font-size', '10px')
                .attr('fill', '#000')
                .text(pie_label)
        }

        defineThreshholds = container.append('text')
            .attr('font-weight', '600')
            .attr('x', -width / 2 + padding)
            .attr('y', padding + 4)
            .attr('font-size', '15px')
            .attr('opacity', 0)
            .attr('pointer-events', 'none')
            .text(translations.define_thresholds_txt);

        // background rectangle
        backgroundRect = container.append('rect')
            .attr('transform', `translate(${-width / 2})`)
            .attr('fill', '#fff')
            .attr('stroke', '#ddd')
            .attr('rx', 10)
            .attr('ry', 10)
            .attr('width', width)
            .attr('height', height)
            .attr('opacity', editView ? 1 : 0)
            .attr('pointer-events', 'none')
            .lower();

        // breadcrumb
        breadcrumb = container.append('text')
            .attr('class', 'pie-breadcrumb')
            .attr('x', -width / 2 + padding)
            .attr('y', padding + 22)
            .attr('opacity', 0)
            .attr('font-size', '11px')
            .attr('fill', '#000')
            .html( getBreadCrumb() )

        var tippyTooltip;

        if (showSplitBtn) {
            tippyTooltip = tippy(splitBtn.getNode(), {
                theme: 'light-border',
                trigger: 'click',
                interactive: true,
                arrow: true,
                content: getTooltipHtml({ 
                    options: node.splitBy,
                    nodeId: node.id, 
                    headerText: translations.split_by_properties, 
                    btnText: translations.split_btn, 
                    btnClass: 'btn-outline-success', 
                    selectedIndex: 0
                }, 
                    (selected) => {
                        splitFunc(selected, currentValue);
                        tippyTooltip.hide();
                    }
                ),
                placement: 'right'
            });

            window.tooltips.push(tippyTooltip);
        }

        if (node.children.length > 0) {
            splitBtn.hide();

            if (editBtn) {
                editBtn.hide();
            }

            collapseBtn.show();

            if (costSlider) {
                costSlider.hide();
            }
        }

        main.components = {
            pie,
            splitBtn,
            editBtn,
            slider,
            histogram,
            collapseBtn,
            tippyTooltip,
            costSlider
        };

        return main;
    }

    function getBreadCrumb() {
        let breadcrumb = [node.name];
        let _parent = parent;

        while(_parent) {
            breadcrumb.push(_parent.data.name);
            _parent = _parent.parent;
        }

        return breadcrumb.reverse().join(' &#x2b62 ')
    }

    function updateParents(_parent) {
        var parentData = _parent.data;
        var parentTotal = parentData.total;
        
        // find sum of accepted siblings
        var sumOfAcceptedSiblings = sum(parentData.children.map(d => d.leafNode.getNumOfAccepted()));
        var parentPercentage = (sumOfAcceptedSiblings / parentTotal) * 100;

        var sumOfAcceptedSiblingsLevel2 = null;
        var parentPercentageLayer2 = null;

        if (postPolicy) {
            sumOfAcceptedSiblingsLevel2 = sum(parentData.children.map(d => d.leafNode.getNumOfAcceptedLevel2()));
            parentPercentageLayer2 = (sumOfAcceptedSiblingsLevel2 / parentTotal) * 100;
        }

        parentData.fakePercent = {
            pie_percent_pre: parentPercentage,
            pie_percent_post: parentPercentageLayer2,
            siblings_sum_pre: sumOfAcceptedSiblings,
            siblings_sum_post: sumOfAcceptedSiblingsLevel2
        };

        parentData.leafNode.updatePie(
            parentPercentage, 
            sumOfAcceptedSiblings,
            parentPercentageLayer2,
            sumOfAcceptedSiblingsLevel2
        );

        if (_parent.parent) {
            updateParents(_parent.parent);
        }
    }

    function getStatisticData() {
        return getStatsData({
            statistics,
            currentValue,
            criteriaPriority,
            minMax: params.populationRange,
            data,
            postPolicy,
            color: node.color
        })
    }

    function showEditView(othersOpacity = 0.3) {
        editView = !editView;

        // refresh the view
        onRefreshClick();

        const dy = mon_cost ? 25 : 0;

        pie.translate([
            width / 2 - padding - dimensions.pieOuterRadius,
            padding + dimensions.pieOuterRadius + 8 + costSliderDy / 2 + dy
        ]);

        if (costSlider) {
            costSlider.translate([
                width / 2 - padding - dimensions.pieOuterRadius * 2,
                padding + 25 + (pie_label ? 0 : 7)
            ]);
        }

        splitBtn.hide();
        cancelBtn.show();
        okBtn.show();

        if (editBtn) {
            editBtn.hide();
        }

        setTimeout(() => {
            if (refreshHistogram) {
                refreshHistogram.show();
            }
            if (costFactorBtn) {
                costFactorBtn.show()
            }
            
            if (impactFactorBtn) {
                impactFactorBtn.show()
            }

            if (statsComponents) {
                statsComponents.forEach(d => d.show())
            }

            if (pieLabel) {
                pieLabel.attr('opacity', 1)
                    .attr('x', width / 2 - padding - dimensions.pieOuterRadius)
                    .attr('y', padding + 4 + costSliderDy / 2 + dy)
            }
            
            if (slider) {
                slider.show();
            }

            histogram.show();
            defineThreshholds.attr('opacity', 1);
            breadcrumb.attr('opacity', 1);
        }, 750)

        backgroundRect.attr('opacity', editView ? 1 : 0);

        container.raise()

        onEditViewOpen({
            container,
            nodeWidth: width,
            nodeHeight: height,
            currentValue,
            othersOpacity
        })
    }

    function hideEditView() {
        editView = !editView;

        pie.translate([
            0,
            dimensions.pieOuterRadius + costSliderDy + (showThresholdSlider ? 25 : 0)
        ]);

        if (costSlider) {
            costSlider.translate([
                -dimensions.pieOuterRadius, 
                costSliderDy + 5
            ])
        }

        if (pieLabel) {
            pieLabel.attr('opacity', 0)
        }

        if (slider) {
            slider.hide();
        }

        histogram.hide();
        cancelBtn.hide();
        okBtn.hide();
        defineThreshholds.attr('opacity', 0);
        breadcrumb.attr('opacity', 0);

        if (statsComponents) {
            statsComponents.forEach(d => d.hide())
        }

        if (refreshHistogram) {
            refreshHistogram.hide();
        }

        if (impactFactorBtn) {
            impactFactorBtn.hide()
        }

        if (costFactorBtn) {
            costFactorBtn.hide()
        }

        setTimeout(() => {
            if (showSplitBtn) {
                splitBtn.show();
            }

            if (editBtn) {
                editBtn.show();
            }
        }, 750)

        backgroundRect.attr('opacity', editView ? 1 : 0);
        container.lower()

        onEditViewClose({
            container,
            nodeWidth: width,
            nodeHeight: height
        })
    }

    main.updateHistogram = function (newData) {
        data = newData;

        pieValue = getPieValue();
        pieValueLevel2 = getPieValue('current');

        pie.update([pieValue, pieValueLevel2]);
        histogram.updateData(allocateBinsToBounds(newData, params.visualizationRange));

        if (parent) {
            updateParents(parent);
        }

        if (statistics && statistics.length && statsComponents) {
            const statsData = getStatisticData();
            statistics.forEach((s, i) => statsComponents[i].update(statsData[i]));
        }
    }

    main.onUpdate = function (f) {
        onUpdate = f;
        return main;
    }

    main.onSplit = function (f) {
        splitFunc = f;
        return main;
    }

    main.onCollapse = function (f) {
        collapseFunc = f;
        return main;
    }

    main.updatePie = function (p, s, p2, s2) {
        sumOfSiblings = s;
        sumOfSiblingsLayer2 = s2;

        pie.update(postPolicy ? [p, p2] : p);

        return main;
    }

    main.onCostFactorSelect = function(f) {
        onCostFactorSelect = f;
        return main;
    }

    main.onImpactFactorSelect = function(f) {
        onImpactFactorSelect = f;
        return main;
    }

    main.onEditViewOpen = function (f) {
        onEditViewOpen = f;
        return main;
    }

    main.onEditViewClose = function (f) {
        onEditViewClose = f;
        return main;
    }

    main.onCostSliderUpdate = function (f) {
        onCostSliderUpdate = f;
        return main;
    }

    main.getNumOfAccepted = function () {
        if (sumOfSiblings && node.expanded) {
            return sumOfSiblings;
        }

        return getAcceptedPoints(selectedSectionValue, 'sum');
    }

    main.getNumOfAcceptedLevel2 = function () {
        if (sumOfSiblingsLayer2 && node.expanded) {
            return sumOfSiblingsLayer2;
        }

        return getAcceptedPoints(selectedSectionValue, 'current');
    }

    main.getUnitsAccepted = function () {
        return getAcceptedPoints(null, 'sum');
    }

    main.getAcceptedCost = function () {
        let prop = 'sum';

        if (cost_factor && data.some(d => d.hasOwnProperty(cost_factor.name))) {
            prop = cost_factor.name;
        }

        return getAcceptedPoints(null, prop);
    }

    main.updateColor = function (color) {
        pie.updatePieColor();
        histogram.updateColor(color);

        if (editBtn) {
            editBtn.updateColor(color);
        }

        if (slider) {
            slider.updateColor(color);
        }

        if (statsComponents) {
            statsComponents.forEach(d => d.updateColor(color));
        }

        if (costSlider) {
            costSlider.updateColor(color);
        }

        return main;
    }

    main.showEditView = (opacity) => showEditView(opacity);
    main.hideEditView = hideEditView;
    main.getContainer = () => container;
    main.getSize = () => ({ width, height })

    return main();
}

export default LeafNode;