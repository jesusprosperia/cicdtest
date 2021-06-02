import { scaleLinear } from 'd3-scale';
import { drag } from 'd3-drag';
import tippy from 'tippy.js';
import getCustomLabel from '@/utils/custom-labels';
import {dollarSign, filterSign} from '@/utils/constants';

function renderSliderButton(params) {
    var container = params.container;
    var rectWidth = params.rectWidth || 120,
        rectHeight = params.rectHeight || 8;
    var sections = params.sections || [];
    var priority = params.priority;
    var icon = params.icon || null;

    var btn, circle, text, progressRect;
    var clickFunc = function () { };

    const scale = scaleLinear()
        .domain([params.min, params.max])
        .range([0, rectWidth])
        .clamp(true);

    var currentValue = params.value;

    function main() {
        btn = container.append('g').attr('class', 'slider-btn')
            .attr('opacity', params.visible ? 1 : 0)
            .attr('pointer-events', params.visible ? 'all' : 'none')
            .attr('transform',
                `translate( 
                    ${params.translation}
                )`);

        if (icon) {
            var iconStr;

            if (icon == 'dollar') {
                iconStr = dollarSign;
            } else if (icon == 'filter') {
                iconStr = filterSign;
            }

            if (iconStr) {
                var iconSize = rectHeight + 5;

                btn.append('image')
                    .attr('xlink:href', iconStr)
                    .attr('width', iconSize)
                    .attr('height', iconSize)
                    .attr('x', -iconSize - 5)
                    .attr('y', -iconSize / 2)
            }
        }

        btn.append('rect')
            .attr('width', rectWidth)
            .attr('height', rectHeight)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('x', 0)
            .attr('y', -4)
            .attr('fill', '#E1E5EC')
            .attr('cursor', 'pointer')
            .on('click', d => {
                clickFunc(d);
            });

        progressRect = btn.append('rect')
            .attr('width', () => {
                var x = scale(currentValue);

                return priority == 'low' ? x : rectWidth - x;
            })
            .attr('x', priority == 'low' ? 0 : scale(currentValue))
            .attr('height', rectHeight)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('y', -4)
            .attr('fill', '#1BBC9B')

        circle = btn.append('circle')
            .attr('cx', scale(currentValue))
            .attr('r', 12)
            .attr('fill', '#fff')
            .attr('stroke', '#1BBC9B')
            .attr('stroke-width', 1.5)
            .attr('cursor', 'pointer')
            .on('click', d => {
                clickFunc(d);
            })
            .call(drag().on("start", d => clickFunc(d)));

        text = btn.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', scale(currentValue))
            .text(
                getCustomLabel(Math.ceil(currentValue), sections)
            )
            .attr('y', 4)
            .attr('font-size', '10px')
            .attr('pointer-events', 'none')

        var tippyTooltip = tippy(btn.node(), {
            theme: 'light-border',
            placement: 'left',
            interactive: false,
            arrow: true,
            content: `<div>${params.name}</div>`
        });

        window.tooltips.push(tippyTooltip)

        return main;
    }

    main.show = function () {
        params.visible = true;
        btn.attr('opacity', 1)
            .attr('pointer-events', 'all')
    }

    main.hide = function () {
        params.visible = false;
        btn.attr('opacity', 0)
            .attr('pointer-events', 'none')
    }

    main.translate = function (translation) {
        params.translation = translation;
        btn
            .transition().duration(750)
            .attr('transform', `translate(${params.translation})`)
    }

    main.update = function (value) {
        currentValue = value;
        circle.attr('cx', scale(currentValue));
        text.attr('x', scale(currentValue))
            .text(
                getCustomLabel(Math.ceil(currentValue), sections)
            );
        progressRect.attr('width', () => {
            var x = scale(currentValue);

            return priority == 'low' ? x : rectWidth - x;
        })
        .attr('x', priority == 'low' ? 0 : scale(currentValue))
    }

    main.click = function (f) {
        clickFunc = f;
        return main;
    }

    main.getNode = function () {
        return btn.node();
    }

    return main();
}

export default renderSliderButton;