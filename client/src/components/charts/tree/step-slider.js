import { drag } from 'd3-drag';
import { mouse, event, selectAll } from 'd3-selection';
import getCustomLabel from '@/utils/custom-labels';
import {formatKilo} from '@/utils/formatters';

function renderSlider(node) {
    var width = node.width || 400;
    var height = node.height || 8;
    var container = node.container;
    var sliderGroup, sliderValue, circleGroup;
    var sections = node.sections || [];
    var formatThousands = node.formatThousands || false;
    var color = node.color || '#1BBC9B';
    var scale = node.scale;
    var bands = scale.domain();
    var bandWidth = node.bandWidth;
    var slider, backRect;
    var currentValue = node.value;
    
    var onChange = function () { };

    function main() {
        // calculation parameters
        var translation = [0, -height / 2],
            backRectWidth = width,
            backRectHeight = 30,
            trackWidth = width,
            trackHeight = 8;

        var currentTranslation = [scale(currentValue) + bandWidth, 0];

        sliderGroup = container.append('g')
            .attr('class', 'slider')
            .attr('transform', `translate(${node.x || 0}, ${node.y || 0})`)
            .attr('opacity', node.visible ? 1 : 0)
            .attr('pointer-events', node.visible ? 'all' : 'none');

        slider = sliderGroup.append('g')
            .attr('transform', `translate(${translation})`)

        backRect = slider.append('rect')
            .attr('width', backRectWidth)
            .attr('height', backRectHeight)
            .attr('y', -backRectHeight / 2)
            .attr('x', 0)
            .attr('fill', 'transparent')

        slider.append('rect')
            .attr('width', trackWidth)
            .attr('height', trackHeight)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('x', 0)
            .attr('y',  -4)
            .attr('fill', '#E1E5EC')
            .attr('cursor', 'pointer')
            .on('click', slide)

        circleGroup = slider.append('g').attr('transform', `translate(${currentTranslation})`);

        circleGroup.append('circle')
            .attr('class', 'slider-thumb')
            .attr('r', 12)
            .attr('fill', '#fff')
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('cursor', 'pointer')
            .call(drag().on("drag", slide))
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
                    currentValue = Math.min(currentValue + 1, bands[bands.length - 1]);
                    updateSliderValue(currentValue);
                } else if (event.key === 'ArrowLeft') {
                    currentValue = Math.max(currentValue - 1, bands[bands[0]]);
                    updateSliderValue(currentValue);
                }
            })
    
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
        
        return main;
    }

    function slide() {
        var cx = mouse(backRect.node())[0];

        if (cx < 0) {
            cx = 0;
        } 

        else if (cx > width) {
            cx = width;
        }
        
        var index = Math.floor(cx / scale.bandwidth());

        if (index < 0) {
            currentValue = bands[0];
        } else if (index > bands.length - 1) {
            currentValue = bands[bands.length - 1];
        } else {
            currentValue = bands[index];
        }

        updateSliderValue(currentValue);
    }
    
    function updateSliderValue(currentValue) {
        var text = formatThousands ? formatKilo(Math.ceil(currentValue)) : getCustomLabel(Math.ceil(currentValue), sections);

        sliderValue.text(text);

        var x = scale(currentValue) + bandWidth;
        var y = 0;

        circleGroup.attr('transform', `translate(${x},${y})`);

        onChange(currentValue);
    }

    main.update = function (value) {
        currentValue = Math.ceil(value);

        sliderValue.text(getCustomLabel(Math.ceil(currentValue), sections));

        var x = scale(currentValue) + bandWidth;
        var y = 0

        circleGroup.attr('transform', `translate(${x}, ${y})`);
    }

    main.updateColor = function (_color) {
      if (_color) {
          color = _color;
      } else {
          color = '#1BBC9B';
      }  

      circleGroup.select('circle').attr('stroke', color);
    }

    main.onChange = function (f) {
        onChange = f;
        return main;
    }

    main.show = function () {
        node.visible = true;
        sliderGroup
            .attr('opacity', node.visible ? 1 : 0)
            .attr('pointer-events', node.visible ? 'all' : 'none')
    }

    main.hide = function () {
        node.visible = false;
        sliderGroup
            .attr('opacity', node.visible ? 1 : 0)
            .attr('pointer-events', node.visible ? 'all' : 'none')
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