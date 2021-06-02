import { scaleLinear } from 'd3-scale';
import { drag } from 'd3-drag';
import { mouse, selectAll } from 'd3-selection';
import tippy from 'tippy.js';
import getCustomLabel from '@/utils/custom-labels';
import {formatKilo} from '@/utils/formatters';
import {dollarSign, filterSign, percentIcon} from '@/utils/constants';

function renderSlider(node) {
    var width = node.width || 400;
    var height = node.height || 8;
    var container = node.container;
    var sliderGroup, sliderValue, circleGroup, progressRect, iconImage;
    var direction = node.direction || 'h';
    var sections = node.sections || [];
    var formatThousands = node.formatThousands || false;
    var icon = node.icon || null;
    var tooltip = node.tooltip || null; // this should either be an html string or null
    var priority = node.priority;
    var showProgress = node.showProgress || false;
    var color = node.color || '#1BBC9B';

    const scale = scaleLinear()
        .domain([node.min, node.max])
        .clamp(true);

    var currentValue = node.value;
    var trackWidth, trackHeight;

    var onChange = function () { };

    function main() {
        // calculation parameters
        var range,
            translation,
            backRectWidth,
            backRectHeight;

        if (direction == 'h') {
            range = [0, width]
            translation = [0, -height / 2];
            backRectWidth = width;
            backRectHeight = 30;
            trackWidth = width;
            trackHeight = 8;
        } else {
            range = [height, 0];
            translation = [-width / 2, 0];
            backRectWidth = 30;
            backRectHeight = height;
            trackWidth = 8;
            trackHeight = height;
        }

        scale.range(range);

        var currentTranslation = direction == 'h' ? [scale(currentValue), 0] : [0, scale(currentValue)];

        sliderGroup = container.append('g')
            .attr('class', 'slider')
            .attr('transform', `translate(${node.x || 0}, ${node.y || 0})`)
            .attr('opacity', node.visible ? 1 : 0)
            .attr('pointer-events', node.visible ? 'all' : 'none');

        if (icon) {
            const iconStr = getIconImageString();

            if (iconStr) {
                var iconSize = height + 5;

                iconImage = sliderGroup.append('image')
                    .attr('xlink:href', iconStr)
                    .attr('width', iconSize)
                    .attr('height', iconSize)
                    .attr('x', -iconSize - 10)
                    .attr('y', -iconSize + 3)
            }
        }

        var slider = sliderGroup.append('g')
            .attr('transform', `translate(${translation})`)

        var backRect = slider.append('rect')
            .attr('width', backRectWidth)
            .attr('height', backRectHeight)
            .attr('y', direction == 'h' ? -backRectHeight / 2 : 0)
            .attr('x', direction == 'h' ? 0 : -backRectWidth / 2)
            .attr('fill', 'transparent')

        slider.append('rect')
            .attr('width', trackWidth)
            .attr('height', trackHeight)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('x', direction == 'h' ? 0 : -4)
            .attr('y', direction == 'h' ? -4 : 0)
            .attr('fill', '#E1E5EC')
            .attr('cursor', 'pointer')
            .on('click', slide)

        if (showProgress) {
            progressRect = slider.append('rect')
                .attr('width', () => {
                    var x = scale(currentValue);

                    return priority == 'low' ? x : trackWidth - x;
                })
                .attr('x', priority == 'low' ? 0 : scale(currentValue))
                .attr('height', trackHeight)
                .attr('rx', 5)
                .attr('ry', 5)
                .attr('y', -4)
                .attr('pointer-events', 'none')
                .attr('fill', color);
        }

        circleGroup = slider.append('g').attr('transform', `translate(${currentTranslation})`);

        circleGroup.append('circle')
            .attr('class', 'slider-thumb')
            .attr('r', 12)
            .attr('fill', '#fff')
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('cursor', 'pointer')
            .on('click', function () {
                selectAll('.slider-thumb').attr('tabindex', null);
                this.setAttribute('tabindex', 0);
                this.focus();
            })
            .on('focusin focus', function () {
                selectAll('.slider-thumb-outline').remove();

                circleGroup.append('circle')
                    .attr('class', 'slider-thumb-outline')
                    .attr('fill', 'transparent')
                    .attr('r', 14.1)
                    .attr('stroke', '#000')
                    .attr('stroke-width', 3)
                    .attr('stroke-opacity', 0.2)
                    .attr('pointer-events', 'none')
            })
            .on('focusout blur', function () { 
                selectAll('.slider-thumb-outline').remove();
            })
            .on('keydown', function () {
                if (event.key === 'ArrowRight') {
                    if (direction === 'h') {
                        currentValue = Math.min(currentValue + 1, node.max);
                        updateSliderValue(currentValue);
                    }
                } else if (event.key === 'ArrowLeft') {
                    if (direction === 'h') {
                        currentValue = Math.max(currentValue - 1, node.min);
                        updateSliderValue(currentValue);
                    }
                }
            })
            .call(
                drag().on("drag", slide)
            )

        sliderValue = circleGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 4)
            .attr('font-size', formatThousands ? '9px' : '10px')
            .attr('pointer-events', 'none')
            .text(() => {
                var num = Math.ceil(currentValue);

                if (formatThousands) {
                    return formatKilo(num);
                } else {
                    return getCustomLabel(num, sections);
                }
            });

        if (tooltip) {
            var tippyTooltip = tippy(sliderGroup.node(), {
                theme: 'light-border',
                placement: 'left',
                interactive: false,
                arrow: true,
                content: tooltip
            });
    
            window.tooltips.push(tippyTooltip)
        }
            
        function slide() {
            var cx = mouse(backRect.node())[direction == 'h' ? 0 : 1];
            
            var comparator = direction == 'h' ? width : height;

            if (cx < 0) cx = 0

            else if (cx > comparator) cx = comparator;

            currentValue = scale.invert(cx);

            updateSliderValue(currentValue);
        }

        function updateSliderValue(currentValue) {
            var x = direction == 'h' ? scale(currentValue) : 0;
            var y = direction == 'h' ? 0 : scale(currentValue);

            var text = formatThousands ?
                formatKilo(Math.ceil(currentValue)) :
                getCustomLabel(Math.ceil(currentValue), sections);

            sliderValue.text(text);

            circleGroup.attr('transform', `translate(${x}, ${y})`);

            if (progressRect) {
                progressRect.attr('width', () => {
                    var x = scale(currentValue);
                    return priority == 'low' ? x : trackWidth - x;
                })
                .attr('x', priority == 'low' ? 0 : scale(currentValue))
            }

            onChange(currentValue);
        }

        return main;
    }
    
    function getIconImageString() {
        var iconStr;

        if (icon == 'dollar') {
            iconStr = dollarSign;
        } else if (icon == 'filter') {
            iconStr = filterSign;
        } else if (icon === 'percent') {
            iconStr = percentIcon;
        }

        return iconStr;
    }

    main.updateIcon = function (_icon) {
        node.icon = _icon;
        icon = _icon;
        const iconStr = getIconImageString();
        if (iconStr && iconImage) {
            iconImage.attr('xlink:href', iconStr)
        }
    }

    main.update = function (value) {
        currentValue = value;

        sliderValue.text(getCustomLabel(Math.ceil(currentValue), sections));

        var x = direction == 'h' ? scale(currentValue) : 0;
        var y = direction == 'h' ? 0 : scale(currentValue);

        circleGroup.attr('transform', `translate(
            ${x},
            ${y}
        )`);

        if (progressRect) {
            progressRect.attr('width', () => {
                var x = scale(currentValue);
                return priority == 'low' ? x : trackWidth - x;
            })
            .attr('x', priority == 'low' ? 0 : scale(currentValue))
        }
    }

    main.updateColor = function (_color) {
        if (_color) {
            color = _color;
        } else {
            color = '#1BBC9B';
        }

        if (progressRect) {
            progressRect.attr('fill', color);
        }   

        circleGroup.select('circle')
            .attr('stroke', color);
    }

    main.onChange = function (f) {
        onChange = f;
        return main;
    }

    main.show = function () {
        node.visible = true;
        sliderGroup
            .attr('opacity', 1)
            .attr('pointer-events', 'all')
    }

    main.hide = function () {
        node.visible = false;
        sliderGroup
            .attr('opacity', 0)
            .attr('pointer-events', 'none')
    }

    main.translate = function ([x, y]) {
        node.x = x;
        node.y = y;

        sliderGroup
            .transition().duration(750)
            .attr('transform', `translate(${x}, ${y})`)
    }

    return main();
}

export default renderSlider;