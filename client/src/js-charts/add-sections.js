import { select } from 'd3-selection';
import patternify from '@/utils/patternify.js';

export default function addSections({
    chart,
    sections,
    xScale,
    height,
    margin,
    translateY
}) {
    var dx = 5;
    var dy = translateY !== undefined ? translateY : -30;
    var initialY = 10;

    var textParams = sections.map(d => {
        return {
            ...d,
            y: initialY,
            anchor: 'end'
        }
    });

    chart.selectAll('.section').remove();

    var sectionsDom = patternify(chart, 'g', 'section', sections)
        .lower()
        .sort((a, b) => a.value - b.value)
        .attr('transform', d => `translate(${xScale(d.value)}, ${dy})`);

    patternify(sectionsDom, 'line', 'section-line', d => [d])
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 5)
        .attr('y2', height - margin.bottom + 20)
        .attr('stroke', '#ccc')
        .attr('stroke-width', '1px');

    patternify(sectionsDom, 'text', 'section-text', d => [d])
        .attr('x', -dx)
        .attr('y', initialY)
        .attr('text-anchor', 'end')
        .text(d => d.name)
        .attr('font-size', '10px')
        .attr('pointer-events', 'none')


    sectionsDom.each(function(d, i) {
        var txt = select(this).select('.section-text').node();
        var width = txt.getBoundingClientRect().width;
        var anchor = textParams[i].anchor;
        
        textParams[i].width = width;
        textParams[i].x = xScale(d.value) + (anchor == 'start' ? dx : -dx);
    })

    textParams.forEach(function(d, i) {
        if (i > 0) {
            var current = d;
            var prev = textParams[i - 1];
            var range0 = [];
            var range1 = [];

            if (prev.anchor == 'start') {
                range0 = [prev.x, prev.x + prev.width];
            } else {
                range0 = [prev.x - prev.width, prev.x];
            }

            if (current.anchor == 'start') {
                range1 = [current.x, current.x + current.width];
            } else {
                range1 = [current.x - current.width, current.x];
            }

            // if current one overlaps previus one and previous one is not adjusted yet
            if (
                (range1[0] <= range0[1] && range1[0] >= range0[0]) ||
                (range1[1] <= range0[1] && range1[0] >= range0[0])
            ) {
                if (!prev.adjusted) {
                    current.y -= 12;
                    current.adjusted = true;
                }
            }
        }
    })

    sectionsDom.each(function(_, i) {
        var y = textParams[i].y;
        var anchor = textParams[i].anchor;

        var text = select(this).select('.section-text');
        var line = select(this).select('.section-line');

        text.attr('y', y);
        line.attr('y1', y - 4);

        patternify(select(this), 'line', 'tick-line', d => [d])
            .attr('x1', 0)
            .attr('x2', anchor == 'start' ? dx - 1 : - dx + 1)
            .attr('y1',  y - 4)
            .attr('y2',  y - 4)
            .attr('stroke', '#ccc')
            .attr('stroke-width', '1px')
    })

    return sectionsDom;
}