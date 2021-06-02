import { arc, pie } from 'd3-shape';
import patternify from '@/utils/patternify.js';
import { colors } from '@/colors';
import { select, selectAll } from 'd3-selection';

function renderPie(params) {
    var pieData = generatePieData(params.value);
    var container = params.container;
    var slices, outlineCircle, path, texts;
    var datum = container.datum();

    const attrs = {
        innerRadius: params.pieInnerRadius || 20,
        outerRadius: params.pieOuterRadius || 70
    };

    const arcGenerator = arc()
        .innerRadius(attrs.innerRadius)
        .outerRadius(attrs.outerRadius)

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

        var arcs = patternify(slices, 'g', 'arc', pieGenerator(pieData));

        path = patternify(arcs, 'path', 'arc-path', d => [d])
            .attr('d', d => {
                return arcGenerator(d);
            })
            .attr('fill', (d) => {
                if (d.data.accepts) {
                    if (params.node.children.length) {
                        return colors.acceptedGreen;
                    }

                    return params.node.color;
                }

                return colors.notAccepted;
            })

        texts = patternify(arcs, 'text', 'arc-text', d => [d])
            .attr("transform", function (d) { return "translate(" + arcGenerator.centroid(d) + ")"; })
            .attr('dy', 4)
            .attr('font-size', '12px')
            .attr("text-anchor", "middle")
            .attr("pointer-events", 'none')
            .attr("fill", d => {
                if (d.data.accepts && params.node.colorPercent < 0.7) {
                    return '#fff';
                }
        
                return "#000";
            })
            .text(d => Math.round(d.value) + '%')

        return main;
    }

    function generatePieData(value) {
        return [
            {
                value: value,
                accepts: true
            },
            {
                value: 100 - value,
                accepts: false
            }
        ].filter(d => d.value)
    }

    main.updatePieColor = function(color, textColor) {
        path.attr('fill', (d) => {
            if (d.data.accepts) {
                if (color) {
                    return params.node.color = color;
                }
                
                if (params.node.children.length) {
                    return colors.acceptedGreen;
                }

                return params.node.color;
            }

            return colors.notAccepted;
        })

        texts.attr("fill", d => {
            if (textColor) {
                return textColor;
            }

            if (d.data.accepts && params.node.colorPercent < 0.7) {
                return '#fff';
            }
    
            return "#000";
        })
    }

    main.update = function (value) {
        pieData = generatePieData(value);
        return main();
    }

    main.translate = function (translation) {
        params.translation = translation;
        slices
            .transition().duration(750)
            .attr('transform', `translate(${params.translation})`)
    }

    main.translateYBy = function (dy) {
        slices
            .transition().duration(750)
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

export default renderPie;