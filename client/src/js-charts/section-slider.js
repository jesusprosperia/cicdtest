import { drag } from 'd3-drag';
import { mouse, select } from 'd3-selection';
import patternify from '@/utils/patternify.js';
import getCustomLabel from '@/utils/custom-labels';

function renderSlider(node) {
    var width = node.width || 400;
    var height = node.height || 8;
    var container = node.container;
    var sliderGroup, circleGroup;
    var sections = node.sections || [];
    var scale = node.scale;
    var bands = scale.domain();
    var bandWidth = scale.bandwidth();

    var slider, backRect;

    var onChange = function () { };

    function main() {
        // calculation parameters
        var translation = [0, -height / 2],
            backRectWidth = width,
            backRectHeight = 30,
            trackWidth = width,
            trackHeight = 8;

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

        addSections();

        return main;
    }

    function addSections() {
        circleGroup = patternify(slider, 'g', 'slider-thumb', sections)
            .attr('transform', d => `translate(${scale(d.value) + bandWidth}, 0)`)
            .call(drag().on("drag", slide));

        patternify(circleGroup, 'circle', 'slider-thumb-circle', d => [d])
            .attr('r', 11)
            .attr('fill', '#fff')
            .attr('stroke', '#ddd')
            .attr('cursor', 'pointer')

        patternify(circleGroup, 'text', 'slider-thumb-text', d => [d])
            .attr('text-anchor', 'middle')
            .text(d => getCustomLabel(d.value, sections))
            .attr('y', 4)
            .attr('font-size', '10px')
            .attr('pointer-events', 'none');
    }

    function slide(d) {
        if (typeof d !== 'object') return;

        var cx = mouse(backRect.node())[0];
        var tempIndex = 0;

        if (cx < 0) {
            cx = 0
            tempIndex = 0;
        } 

        else if (cx > width) {
            cx = width;
            tempIndex = bands[bands.length - 1];
        } 
        
        var index = Math.floor(cx / scale.bandwidth());

        d.value = bands[index] || bands[tempIndex];

        var x = scale(d.value) + bandWidth;
        var y = 0;

        select(this).attr('transform', `translate(${x},${y})`);
        circleGroup.selectAll('.slider-thumb-text').text(x => getCustomLabel(x.value, sections));

        onChange();
    }

    main.update = function (_sections) {
        sections = _sections;

        addSections();
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

    return main();
}

export default renderSlider;