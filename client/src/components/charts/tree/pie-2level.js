import { arc, pie } from 'd3-shape';
import patternify from '@/utils/patternify';
import roundNumber from '@/utils/round-number';
import { colors } from '@/colors';
import { select, selectAll } from 'd3-selection';
import tippy from "tippy.js";
import {hexToRgb, parseRgb} from '@/utils/color-codes';

function renderPie2Level(params) {
    var container = params.container;
    var slices, outlineCircle, path, texts;
    var translations = params.translations;
    var datum = container.datum();

    const attrs = {
        innerRadius: params.pieInnerRadius || 20,
        outerRadius: params.pieOuterRadius || 70
    };
    var pieValue = params.value;
    var posPietValue = params.value;
    var pieData = generatePieData(pieValue);

    const arcGenerator = (rInner, rOuter) => {
      return arc()
        .innerRadius(rInner)
        .outerRadius(rOuter)
    }

    const pieGenerator = pie().sort(null)
        .startAngle(0 - Math.PI / 2)
        .endAngle(Math.PI * 1.5)
        .value(d => d.value);

    var interval = null;

    var onPieClick = () => { };
    var onPieMouseover = () => { };
    var onPieMouseOut = () => { };

    function main() {
        slices = patternify(container, 'g', 'slices')
            .attr('transform', `translate(${params.translation})`)
            .attr('cursor', 'pointer')
            .on('click', () => {
                onPieClick();
            })
            .on('mouseover', () => {
                main.highlight(false);
                onPieMouseover();
            })
            .on('mouseout', () => {
                main.clearHighlight();
                onPieMouseOut();
            });

        outlineCircle = patternify(slices, 'circle', 'stroke-circle')
            .attr('r', attrs.outerRadius + 1)
            .attr('fill', 'transparent')
            .attr('stroke', colors.highlight)
            .attr('stroke-width', 2)
            .attr('opacity', 0)

        var layers = patternify(slices, 'g', 'layer', pieData);

        var arcs = patternify(layers, 'g', 'arc', d => pieGenerator(d.data).map(x => {
            const _arc = arcGenerator(d.rInner, d.rOuter);

            return {
                ...x,
                _arc,
                d: _arc(x)
            }
        }));

        path = patternify(arcs, 'path', 'arc-path', d => [d])
            .attr('d', d => d.d)
            .attr('fill', d => d.data.color)

        texts = patternify(arcs, 'text', 'arc-text', d => [d])
            .attr("transform", function (d) { return "translate(" + d._arc.centroid(d) + ")"; })
            .attr('dy', 5)
            .attr('opacity', d => d.data.hasTextLabel ? 1 : 0)
            .attr('font-size', '9px')
            .attr("text-anchor", "middle")
            .attr("pointer-events", 'none')
            .attr("fill", d => d.data.textColor)
            .text(d => roundNumber(d.data.value, 1))

        arcs.each(function(d) {
            if (this._tippy) {
                this._tippy.destroy(true);
            }

            tippy(this, {
                theme: "light-border",
                arrow: true,
                delay: 0,
                content: d.data.suffixText + ' ' + roundNumber(d.data.value, 1) + '%',
                placement: "right"
            });
        });

        patternify(slices, 'text', 'center-text')
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr("pointer-events", 'none')
            .attr('font-weight', 600)
            .text(roundNumber(posPietValue, 1) + '%')

        return main;
    }

    function generatePieData(value) {
      const preValue = value[0];
      const postValue = value[1];
      const greyvalue = 100 - preValue;
      const postValue1 = preValue - postValue;
      posPietValue = postValue;
      const rgb = hexToRgb(params.node.color);

      const layer1 = [
        {
          suffixText: translations['pre_policy'],
          value: preValue,
          color: params.node.color,
          changesColor: true
        },
        {
          suffixText: '',
          value: greyvalue,
          color: colors.notAccepted
        }
      ]

      const layer2 = [
        {
          suffixText: translations['post_policy'],
          value: postValue,
          color: params.node.color,
          changesColor: true,
          hasTextLabel: postValue > 3.5 && roundNumber(preValue, 1) != roundNumber(postValue, 1),
          textColor: params.node.colorPercent < 0.7 ? '#fff' : '#000'
        },
        {
          suffixText: translations['pie_chart_difference'],
          value: postValue1,
          changesColor: true,
          opacity: 0.6,
          color: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`,
          hasTextLabel: postValue1 > 5,
          textColor: '#000'
        },
        {
          suffixText: '',
          value: greyvalue,
          color: colors.notAccepted
        }
      ]

      const outerSlice = attrs.outerRadius - attrs.innerRadius;

      return [
        { rInner: attrs.innerRadius, rOuter: attrs.innerRadius + outerSlice / 2 - 0.5, data: layer1.filter(d => d.value) },
        { rInner: attrs.innerRadius + outerSlice / 2, rOuter: attrs.outerRadius, data: layer2.filter(d => d.value) }
      ];
    }

    main.updatePieColor = function(color, textColor) {
        if (color) {
            params.node.color = color;
        }

        var c = params.node.color;
        var rgb = c.slice(0, 3) === "rgb" ? parseRgb(c) : hexToRgb(c);

        path
            .each(d => {
                if (d.data.changesColor) {
                    if (d.data.opacity) {
                        d.data.color = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${d.data.opacity})`
                    } else {
                        d.data.color = params.node.color;
                    }
                }
            })
            .attr('fill', d => d.data.color);

        if (textColor) {
            texts.attr("fill", textColor)
        }
    }

    main.update = function (value) {
        pieValue = value;

        pieData = generatePieData(pieValue);

        return main();
    }

    main.translate = function (translation) {
        params.translation = translation;
        slices
            .transition()
            .duration(750)
            .attr('transform', `translate(${params.translation})`)
    }

    main.translateYBy = function (dy) {
        slices
            .transition()
            .duration(750)
            .attr('transform', `translate(${params.translation[0]}, ${params.translation[1] + dy})`);
    }

    main.highlight = function (animate = true) {
        outlineCircle.attr('opacity', 1);

        var i = 0;

        if (animate) {
            animateFunc();

            interval = setTimeout(() => {
                animateFunc();
            }, 500);
        }

        function animateFunc() {
            slices
                .transition().duration(500)
                .attr('transform', `translate(${params.translation}) scale(${i % 2 == 0 ? 1.08 : 1})`)
                .on('end', function () {
                    if (!interval) {
                        slices.attr('transform', `translate(${params.translation}) scale(1)`);
                    }
                })
            i++;
        }

        var d = datum;

        while (d.parent) {
            select(`#link-${d.data.id}-${d.parent.data.id}`).raise()
                .attr('stroke', colors.highlight)
                .attr('stroke-width', 2);

            d = d.parent;
        }

        const stack = select('#stack-' + params.id);

        if (!stack.empty()) {
            const d = stack.datum();

            const tooltip = stack.node()._tippy;

            if (tooltip) tooltip.show();

            stack.raise().select('rect').attr('stroke', d.scaledVal < 0.5 ? colors.highlightLight : colors.highlight).attr('stroke-width', 2);
        }

        return main;
    }

    main.clearHighlight = function () {
        outlineCircle.attr('opacity', 0);

        if (interval) {
            clearInterval(interval);
            interval = null;
        }

        selectAll('.link')
            .attr('stroke', colors.linkColor)
            .attr('stroke-width', null);

        const stack = select('#stack-' + params.id);

        if (!stack.empty()) {
            const tooltip = stack.node()._tippy;

            if (tooltip) tooltip.hide();

            stack.select('rect').attr('stroke', null).attr('stroke-width', null);
        }

        return main;
    }

    main.onPieClick = function (f) {
        onPieClick = f;
        return main;
    }

    main.onPieMouseover = function (f) {
        onPieMouseover = f;
        return main;
    }

    main.onPieMouseOut = function (f) {
        onPieMouseOut = f;
        return main;
    }

    return main();
}

export default renderPie2Level;