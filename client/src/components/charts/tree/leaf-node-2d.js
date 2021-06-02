import renderPie from './pie';
import renderButton from './button';
import renderSlider from './slider';
import renderTextButton from './text-button';
import Scatter from './scatter';
import { extent, sum } from 'd3-array';
import tippy from 'tippy.js';
import Legend from './legend';
import { getValue2d } from '@/utils/percentile';

function LeafNode2d(params) {
    var {
        container,
        node,
        dimensions,
        parent,
        translations,
        hideSplitBtn,
        criteriaPriority,
        sections
    } = params;

    var data = node.data;

    // if mon_cost has value, then we render a slider
    var mon_cost = node.mon_cost;

    var sliderX,
        sliderY,
        pie,
        splitBtn,
        scatter,
        editBtnX,
        editBtnY,
        backgroundRect,
        collapseBtn,
        cancelBtn,
        // balanceBtn,
        okBtn,
        costSlider;

    // slide everything down because of the second slider.
    var dy = 35;
    var topTitleDy = 45;
    var splitBtnMargin = 8;
    var costSliderDy = mon_cost ? 30 : 0;

    var padding = dimensions.nodePadding,
        width = padding * 2 + dimensions.pieOuterRadius * 2 + dimensions.pieHistPadding + dimensions.histogramWidth,
        height = padding * 2 + dimensions.histogramHeight + topTitleDy,
        xTranslation = -width / 2 + padding,
        editView = params.editView || false;

    var criteriaX = node.criteria[0];
    var criteriaY = node.criteria[1];

    var extentX = extent(data, d => +d.criteriaX);
    var extentY = extent(data, d => +d.criteriaY);

    var currentValueX = node.value[0];
    var currentValueY = node.value[1];
    var oldValueX = currentValueX;
    var oldValueY = currentValueY;

    var total = sum(data, d => d.sum);
    node.total = total;

    var getAcceptedPoints = () => {
        return sum(data.filter(d => {
         return (criteriaPriority[0] == 'high' ? +d.criteriaX >= currentValueX : +d.criteriaX <= currentValueX) &&
                (criteriaPriority[1] == 'high' ? +d.criteriaY >= currentValueY : +d.criteriaY <= currentValueY);
        }), d => d.sum);
    }

    var pieValue = ((
        getAcceptedPoints() / total
    ) * 100);

    var splitFunc = function () { };
    var collapseFunc = function () { };
    var onUpdate = function () { };
    var onEditViewOpen = function () { };
    var onEditViewClose = function () { };
    // var showBalanceBtn = function () { };
    // var hideBalanceBtn = function () { };
    var onCostSliderUpdate = function () {}

    var sumOfSiblings = getAcceptedPoints();

    var showSplitBtn = node.splitBy.length > 0;
    // var showBalanceButton = false;

    if (hideSplitBtn) {
        showSplitBtn = false;
    }

    function main() {
        // add pie chart
        pie = renderPie({
            container,
            node: node,
            id: node.id,
            value: pieValue,
            pieInnerRadius: dimensions.pieInnerRadius,
            pieOuterRadius: params.pieOuterRadius,
            translation: [
                editView ? width / 2 - padding - dimensions.pieOuterRadius : 0,
                padding + dimensions.pieOuterRadius + dy + costSliderDy
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

        // add scatter
        scatter = Scatter({
            data,
            sections,
            container,
            currentValueX,
            currentValueY,
            criteria: node.criteria,
            width: dimensions.histogramWidth,
            height: dimensions.histogramHeight,
            visible: editView,
            criteriaPriority: criteriaPriority,
            translation: [
                xTranslation,
                padding + topTitleDy
            ]
        }).onUpdate(function () {
            pieValue = node.piePercent || ((
                getAcceptedPoints() / total
            ) * 100);

            pie.update(pieValue);

            if (parent) {
                updateParents(parent);
            }

            onUpdate();
        });

        // add sliderX
        sliderX = scatter.addSlider({
            direction: 'h',
            value: currentValueX,
            visible: editView,
            sections: sections
        }).onChange(function (value) {
            currentValueX = value;
            editBtnX.update(value);
            scatter.update(currentValueX, currentValueY);
        })

        // add sliderY
        sliderY = scatter.addSlider({
            direction: 'v',
            value: currentValueY,
            visible: editView
        }).onChange(function (value) {
            currentValueY = value;
            editBtnY.update(value);
            scatter.update(currentValueX, currentValueY);
        })

        collapseBtn = renderButton({
            container,
            translation: [
                editView ? dimensions.pieOuterRadius + padding - width / 2 : 0,
                padding + dimensions.pieOuterRadius * 2 + splitBtnMargin + dy + costSliderDy
            ],
            visible: false,
            btnUrl: './icons/merged.png'
        }).click(function () {
            const val = getValue2d(data, sumOfSiblings / total, criteriaPriority);

            currentValueX = val[0];
            currentValueY = val[1];

            scatter.update(currentValueX, currentValueY);
            editBtnX.update(currentValueX);
            editBtnY.update(currentValueY);

            if (sliderX) {
                sliderX.update(currentValueX);
            }

            if (sliderY) {
                sliderY.update(currentValueY)
            }

            collapseFunc();
        });

        // split button
        splitBtn = renderButton({
            container,
            translation: [
                editView ? dimensions.pieOuterRadius + padding - width / 2 : 0,
                padding + dimensions.pieOuterRadius * 2 + splitBtnMargin + dy + costSliderDy
            ],
            visible: (!editView && showSplitBtn),
            btnUrl: './icons/arrow.png'
        });

        // balance btn
        // balanceBtn = renderButton({
        //     container,
        //     translation: [
        //         editView ? dimensions.pieOuterRadius + padding - width / 2 : 15,
        //         padding + dimensions.pieOuterRadius * 2 + splitBtnMargin + dy + costSliderDy
        //     ],
        //     visible: (!editView && showBalanceButton),
        //     btnUrl: './icons/balance.png'
        // });

        cancelBtn = renderTextButton({
            container,
            translation: [
                width / 2 - padding - 18,
                height - padding
            ],
            visible: editView,
            html: `<button class="btn btn-sm btn-outline-secondary">${translations.cancel_btn}</button>`
        }).click(() => {
            if (currentValueX != oldValueX || currentValueY != oldValueY) {
                currentValueX = oldValueX;
                currentValueY = oldValueY;

                editBtnX.update(currentValueX);
                editBtnY.update(currentValueY);

                scatter.update(currentValueX, currentValueY);

                sliderX.update(currentValueX);
                sliderY.update(currentValueY);

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
                width / 2 - 120,
                height - padding
            ],
            visible: editView,
            html: `<button class="btn btn-sm btn-outline-success pl-3 pr-3">${translations.ok_btn}</button>`
        }).click(() => {
            oldValueX = currentValueX;
            oldValueY = currentValueY;

            node.value = [currentValueX, currentValueY];

            hideEditView();
        })

        editBtnX = renderSlider({
            icon: 'filter',
            container,
            tooltip: criteriaX,
            color: node.color,
            x: -dimensions.pieOuterRadius, 
            y: 5,
            width: dimensions.pieOuterRadius * 2,
            min: extentX[0] - 1,
            max: extentX[1] + 2,
            value: currentValueX,
            sections: sections,
            priority: criteriaPriority[0],
            name: criteriaX,
            showProgress: true,
            visible: !editView
        }).onChange(function (value) {
            currentValueX = value;
            sliderX.update(value);
            editBtnX.update(value);
            scatter.update(currentValueX, currentValueY);
        })
        // .click(function () {
        //     showEditView();
        // });

        editBtnY = renderSlider({
            icon: 'filter',
            container,
            tooltip: criteriaY,
            color: node.color,
            x: -dimensions.pieOuterRadius, 
            y: dy,
            width: dimensions.pieOuterRadius * 2,
            min: extentY[0] - 1,
            max: extentY[1] + 2,
            value: currentValueY,
            priority: criteriaPriority[1],
            name: criteriaY,
            showProgress: true,
            visible: !editView
        }).onChange(function (value) {
            currentValueY = value;
            sliderY.update(value);
            editBtnY.update(value);
            scatter.update(currentValueX, currentValueY);
        })
        // .click(function () {
        //     showEditView();
        // });

        // cost slider
        if (mon_cost) {      
            costSlider = renderSlider({
                icon: 'dollar',
                container,
                color: node.color,
                tooltip: translations.amount_per_unit,
                formatThousands: true,
                x: -dimensions.pieOuterRadius, 
                y: costSliderDy + dy,
                width: dimensions.pieOuterRadius * 2,
                min: mon_cost.min,
                max: mon_cost.max,
                value: mon_cost.value,
                visible: !editView
            }).onChange(function (value) {
                onCostSliderUpdate(Math.ceil(value));
            })
        }

        if (node.isRoot) {
            container.append('text')
                .attr('id', 'root-title')
                .attr('text-anchor', 'middle')
                .attr('font-weight', 'bold')
                .attr('y', -18)
                .text(node.name);
        }

        var defineThreshholds = container.append('text')
            .attr('text-anchor', 'start')
            .attr('font-weight', '600')
            .attr('x', -width / 2 + padding)
            .attr('y', padding + 4)
            .attr('font-size', '15px')
            .text(translations.define_thresholds_txt)
            .attr('opacity', 0)
            .attr('pointer-events', 'none');

        var percentAccepted = Legend({
            container,
            items: [{
                text: translations.percentage_accepted,
                color: '#1BBC9B'
            }],
            rectSize: 14,
            width: dimensions.pieOuterRadius * 2,
            chartVisible: editView,
            translation: [
                width / 2 - dimensions.pieOuterRadius * 2 - padding + 8,
                padding + dimensions.pieOuterRadius * 2 + 43 + costSliderDy / 2
            ],
        })

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

        var tippyTooltip;

        if (showSplitBtn) {
            tippyTooltip = tippy(splitBtn.getNode(), {
                theme: 'light-border',
                trigger: 'click',
                interactive: true,
                arrow: true,
                content: getTooltipHtml(),
                placement: 'right'
            })

            window.tooltips.push(tippyTooltip);
        }

        function showEditView() {
            editView = !editView;

            pie.translate([
                width / 2 - padding - dimensions.pieOuterRadius,
                padding + dimensions.pieOuterRadius + 15 + costSliderDy / 2
            ]);

            if (costSlider) {
                costSlider.translate([
                    width / 2 - padding - dimensions.pieOuterRadius * 2,
                    padding + 8
                ]);
            }

            splitBtn.hide();
            editBtnX.hide();
            editBtnY.hide();
            cancelBtn.show();
            okBtn.show();
            // balanceBtn.hide();

            setTimeout(() => {
                sliderX.show();
                sliderY.show();
                scatter.show();
                defineThreshholds.attr('opacity', 1);
                percentAccepted.show();
            }, 750)

            backgroundRect.attr('opacity', editView ? 1 : 0);
            container.raise();
            onEditViewOpen({
                container,
                nodeWidth: width,
                nodeHeight: height
            })
        }

        function hideEditView() {
            editView = !editView;

            pie.translate([
                0,
                padding + dimensions.pieOuterRadius + dy + costSliderDy
            ]);

            if (costSlider) {
                costSlider.translate([
                    -dimensions.pieOuterRadius, 
                    costSliderDy + dy
                ])
            }

            okBtn.hide();
            cancelBtn.hide();
            sliderX.hide();
            sliderY.hide();
            scatter.hide();
            defineThreshholds.attr('opacity', 0);
            percentAccepted.hide()

            setTimeout(() => {
                if (showSplitBtn) {
                    splitBtn.show();
                }

                // if (showBalanceButton) {
                //     balanceBtn.show();
                // }

                editBtnX.show();
                editBtnY.show();
            }, 750)

            backgroundRect.attr('opacity', editView ? 1 : 0);
            container.lower();

            onEditViewClose({
                container,
                nodeWidth: width,
                nodeHeight: height
            });
        }

        function getTooltipHtml() {
            var tooltip = document.createElement('div');

            tooltip.id = 'split-form-' + node.id;

            tooltip.innerHTML = `
                <div class='pop-up'>
                    <div class="mb-2">${translations.split_by_properties}</div>
                    <div class="text-left">
                    ${
                    node.splitBy.map((d, i) => {
                        return `<div class="form-check">
                                    <input class="form-check-input" type="radio" value="${d}" ${i == 0 ? 'checked' : ''} 
                                        name="splitValue">
                                    <label class="form-check-label">
                                        ${d}
                                    </label>
                                </div>`
                    }).join('')
                    }
                    </div>
                </div>
            `;

            var button = document.createElement('button');
            button.innerHTML = translations.split_btn;
            button.setAttribute('class', 'mt-2 w-100 btn btn-sm btn-outline-success');
            tooltip.appendChild(button);

            button.addEventListener('click', function () {
                var splitFormId = '#split-form-' + node.id;

                var selected = document.querySelector(splitFormId + ' input[name="splitValue"]:checked').value;

                splitFunc(selected, [currentValueX, currentValueY]);

                tippyTooltip.hide();
            });

            return tooltip;
        }

        // showBalanceBtn = function () {
        //     collapseBtn.translate([
        //         -15,
        //         collapseBtn.translate()[1],
        //     ]);
        //     splitBtn.translate([
        //         -15,
        //         splitBtn.translate()[1],
        //     ]);
        //     balanceBtn.show();
        //     showBalanceButton = true;
        // }

        // hideBalanceBtn = function () {
        //     collapseBtn.translate([
        //         0,
        //         collapseBtn.translate()[1],
        //     ]);
        //     splitBtn.translate([
        //         0,
        //         splitBtn.translate()[1],
        //     ]);
        //     balanceBtn.hide();
        //     showBalanceButton = false;
        // }

        if (node.children.length > 0) {
            // showBalanceBtn();
            splitBtn.hide();
            editBtnX.hide();
            editBtnY.hide();
            collapseBtn.show();
            if (costSlider) {
                costSlider.hide();
            }
        }

        main.components = {
            pie,
            scatter,
            splitBtn,
            editBtnX,
            editBtnY,
            sliderX,
            sliderY,
            backgroundRect,
            collapseBtn,
            // balanceBtn,
            tippyTooltip,
            costSlider
        }

        return main;
    }

    function updateParents(_parent) {
        var parentData = _parent.data;
        var parentTotal = parentData.total;

        var sumOfAcceptedSiblings = sum(
            parentData.children.map(d => d.leafNode.getNumOfAccepted())
        );

        var parentPercentage = (sumOfAcceptedSiblings / parentTotal) * 100;

        parentData.leafNode.updatePie(parentPercentage, sumOfAcceptedSiblings);

        if (_parent.parent) {
            updateParents(_parent.parent);
        }
    }

    main.onUpdate = function (f) {
        onUpdate = f;
        return main;
    }

    main.reset = function (defaultValue) {
        node.value = defaultValue;
        currentValueX = defaultValue[0];
        currentValueY = defaultValue[1];
        sumOfSiblings = getAcceptedPoints();

        pieValue = ((
            getAcceptedPoints() / total
        ) * 100);

        container.html('');

        main();

        if (parent) {
            updateParents(parent);
        }

        onUpdate();

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

    // main.showBalanceBtn = function () {
    //     showBalanceBtn();
    //     return main;
    // }

    // main.hideBalanceBtn = function () {
    //     hideBalanceBtn();
    //     return main;
    // }

    main.onSplit = function (f) {
        splitFunc = f;
        return main;
    }

    main.onCollapse = function (f) {
        collapseFunc = f;
        return main;
    }

    main.updatePie = function (p, s) {
        sumOfSiblings = s;

        pie.update(p);

        // const percent = p / 100;

        // const val = getValue2d(data, percent, criteriaPriority);

        // currentValueX = val[0];
        // currentValueY = val[1];

        // scatter.update(currentValueX, currentValueY);
        // editBtnX.update(currentValueX);
        // editBtnY.update(currentValueY);

        // if (sliderX) {
        //     sliderX.update(currentValueX);
        // }

        // if (sliderY) {
        //     sliderY.update(currentValueY)
        // }

        return main;
    }

    main.onCostSliderUpdate = function (f) {
        onCostSliderUpdate = f;
        return main;
    }

    main.getNumOfAccepted = function () {
        return sumOfSiblings && node.expanded ? sumOfSiblings : getAcceptedPoints();
    }

    main.getUnitsAccepted = function () {
        return sumOfSiblings && node.expanded ? sumOfSiblings : getAcceptedPoints();
    }

    main.getAcceptedCost = function () {
        return sumOfSiblings && node.expanded ? sumOfSiblings : getAcceptedPoints();
    }

    main.updateColor = function (color) {
        editBtnX.updateColor(color);
        editBtnY.updateColor(color);
        pie.updatePieColor();

        if (costSlider) {
            costSlider.updateColor(color);
        }
        return main;
    }

    return main();
}

export default LeafNode2d;