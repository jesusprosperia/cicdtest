import patternify from '@/utils/patternify.js';
import {scaleLinear} from 'd3-scale';
import {sum, cumsum} from 'd3-array';
import tippy from "tippy.js";
import {select} from 'd3-selection';

function Statistic({
    container,
    translation,
    data,
    title,
    width,
    rectHeight,
    visible,
    id
}) {
    var group, rectGroup, rects;
    var scale = scaleLinear()
      .domain([0, sum(data, d => d.value)])
      .range([0, width])
      .clamp(true);

    function main() {
      group = patternify(container, 'g', 'stat-group' + id)
        .attr('transform', `translate(${translation})`)
        .attr('opacity', visible ? 1 : 0);

      patternify(group, 'text', 'stat-title')
        .attr('transform', `translate(${width / 2})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#666666')
        .attr('y', 7)
        .text(title);

      rectGroup = patternify(group, 'g', 'stat-rects-container')
        .attr('transform', 'translate(0, 10)')

      addRects();

      return main;
    }

    function addRects() {
      const cumulative = cumsum(data, d => d.value);
      const rectData = data.map((d, i) => {
        const w = scale(d.value);
        return {
          ...d,
          x: i ? scale(cumulative[i - 1]) : 0,
          width: w
        }
      })

      rects = patternify(rectGroup, 'g', 'stat-rect-group', rectData)
        .attr('transform', d => `translate(${d.x})`)

      patternify(rects, 'rect', 'stat-rect', d => [d])
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', d => d.width)
        .attr('height', rectHeight)
        .attr('fill', d => d.color)

      patternify(rects, 'text', 'stat-text', d => [d])
        .attr('x', d => d.width / 2 || 0)
        .attr('text-anchor', 'middle')
        .attr('y', rectHeight / 2 + 4)
        .attr('font-size', '8px')
        .attr('fill', d => d.textColor)
        .attr('opacity', d => d.width > 20 ? 1 : 0)
        .text(d => d.valueText)

      rects.each(function(d) {
        if (this._tippy) {
            this._tippy.destroy(true);
        }

        tippy(this, {
            theme: "light-border",
            arrow: true,
            delay: 0,
            content: d.name + d.valueText,
            placement: "right"
        });
      });
    }

    main.updateColor = function(color, textColor) {
      rects.each(function(d, i) {
        if (i === 0) {
          d.color = color;

          select(this)
            .select('.stat-rect')
            .attr('fill', d => d.color)

          if (textColor) {
            d.textColor = textColor;

            select(this)
              .select('.stat-text')
              .attr('fill', textColor)
          }
        }
      })

      return main;
    }

    main.update = function(newData) {
      data = newData;
      scale.domain([0, sum(data, d => d.value)])
      addRects();
      return main;
    }

    main.show = function () {
        visible = true;
        group.attr('opacity', 1).attr('pointer-events', 'all');
        return main;
    }

    main.hide = function () {
        visible = false;
        group.attr('opacity', 0).attr('pointer-events', 'none');
        return main;
    }

    return main();
}

export default Statistic;