import patternify from '@/utils/patternify.js';

function Legend({
    container,
    translation,
    items,
    width,
    rectSize,
    chartVisible
}) {

    var legendG;

    function main() {
        legendG = patternify(container, 'g', 'legend')
            .attr('transform', `translate(${translation})`)
            .attr('pointer-events', 'none')
            .attr('opacity', chartVisible ? 1 : 0);

        var legendItem = patternify(legendG, 'g', 'legend-item', items)
            .attr('transform', (d, i) => `translate(0, ${i * (rectSize + 8)})`)

        patternify(legendItem, 'text', 'label', d => [d])
            .attr('y', 4)
            .attr('x', width - rectSize - 5)
            .attr('text-anchor', 'end')
            .attr('font-size', '12px')
            .attr('font-weight', 600)
            .text(d => d.text)

        patternify(legendItem, 'rect', 'label-rect', d => [d])
            .attr('width', rectSize)
            .attr('height', rectSize)
            .attr('x', width - rectSize)
            .attr('y', -rectSize / 2)
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('fill', d => d.color)

        return main;
    }

    main.show = function () {
        chartVisible = true;
        legendG.attr('opacity', 1)
        return main;
    }

    main.hide = function () {
        chartVisible = false;
        legendG.attr('opacity', 0)
        return main;
    }

    return main();
}

export default Legend;