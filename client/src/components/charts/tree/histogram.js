import { min, max, range } from 'd3-array';
import patternify from '@/utils/patternify.js';
import { axisLeft, axisBottom } from 'd3-axis';
import { scaleLinear, scaleBand } from 'd3-scale';
import { colors, styleMap } from '@/colors';
import addSections from '@/js-charts/add-sections-band';
import renderSlider from './step-slider';

function renderHistogram(params) {
    var width = params.width || 400,
        height = params.height || 250,
        margin = {
            top: 15,
            right: 5,
            bottom: 45,
            left: 45
        };
    
    var title = params.fieldName;
    var container = params.container;
    var criteriaPriority = params.criteriaPriority || 'low';
    var update;
    var chart;
    var stackesContainer;
    var bars;
    var addSlider;
    var sections = params.sections;
    var yAxis;

    var impactFactor = params.impact_factor || false;
    var data = params.data.map(d => {
        return {
            ...d,
            value: d.sum,
            current: d.hasOwnProperty('current') ? d.current : d.sum
        }
    });

    var minCriteria = params.criteriaRange ? params.criteriaRange[0] : min(data, d => d.criteria);
    var maxCriteria = params.criteriaRange ? params.criteriaRange[1] : max(data, d => d.criteria);
    var currentValue = params.currentValue;

    // backward compatibility fix for older configured sections. 
    // making sure section values are not out of min and max criteria range.
    sections.forEach(d => {
        if (d.value < minCriteria) {
            d.value = minCriteria;
        } else if (d.value > maxCriteria) {
            d.value = maxCriteria;
        }
    })

    var bands = range(minCriteria, maxCriteria + 1);

    if (criteriaPriority == 'low') {
        bands.unshift(minCriteria - 1);
    } else {
        bands.push(maxCriteria + 1);
    }

    // scales
    var m = max(data, d => Math.max(d.value, d.current));
    var domain = params.maxDomain ? [0, Math.min(params.maxDomain, m)] : [0, m];
    var x = scaleBand().domain(bands)
    var y = scaleLinear()
        .domain(domain)
        .clamp(true);

    var onUpdate = () => { }

    var compare = (d) => {
        return criteriaPriority == 'high' ? d.criteria >= currentValue : d.criteria <= currentValue;
    }

    var styleAccessor = (d, prop) => {
        const style = {...styleMap[d.type]};

        if (d.type == 'current') {
            style.fill = params.color;
        }

        if (compare(d)) {
            return style[prop];
        }

        if (impactFactor && prop == 'fill' && d.type == 'current') {
            return style[prop];
        }
        
        return prop == 'fill' ? colors.notAccepted : style[prop];
    }

    var bandWidth = 0;
    var bandWidthPriority = 0;

    function main() {
        // calculations
        var chartWidth = width - margin.left - margin.right;
        var chartHeight = height - margin.top - margin.bottom;

        x.range([0, chartWidth]);
        y.range([chartHeight, 0]);

        bandWidth = x.bandwidth();
        bandWidthPriority = criteriaPriority == 'low' ? bandWidth : 0;

        // drawing
        chart = patternify(container, 'g', 'histogram')
            .attr('pointer-events', 'none')
            .attr('transform', `translate(${margin.left + params.translation[0]}, ${margin.top + params.translation[1]})`)
            .attr('opacity', params.visible ? 1 : 0);

        patternify(chart, 'text', 'x-axis-title')
            .attr("transform", `translate(
                ${chartWidth / 2}, ${chartHeight + margin.bottom + 6}
            )`)
            .style("text-anchor", "middle")
            .text(title);

        var xAxis = patternify(chart, 'g', 'x-axis')
            .attr('transform', `translate(0, ${chartHeight})`)
            .call(axisBottom(x).tickPadding(15).ticks(5))

        yAxis = patternify(chart, 'g', 'y-axis')
            .call(axisLeft(y).ticks(5));

        yAxis.selectAll('path').remove();
        xAxis.selectAll('path').remove();
        xAxis.selectAll('line').remove();

        stackesContainer = patternify(chart, 'g', 'stacks')

        drawBars();

        var currentLine = patternify(chart, 'line', 'current-line')
            .attr('x1', x(currentValue) + bandWidthPriority)
            .attr('x2', x(currentValue) + bandWidthPriority)
            .attr('y1', 0)
            .attr('y2', chartHeight)
            .attr('stroke', '#2F353B')
            .attr('stroke-width', '1.5px')
            .attr('stroke-dasharray', '5 5')

        addSlider = function (sliderParams) {
            return renderSlider(Object.assign(sliderParams, {
                container: chart,
                x: 0,
                y: chartHeight + 8,
                width: chartWidth,
                sections: sections,
                scale: x,
                bandWidth: bandWidthPriority
            }));
        }

        update = function () {
            chart.selectAll('.stack-bar')
                .attr("stroke", d => styleAccessor(d, 'stroke'))
                .attr("stroke-dasharray", d => styleAccessor(d, 'strokeDasharray'))
                .attr("fill", d => styleAccessor(d, 'fill'));

            currentLine
                .attr('x1', x(currentValue) + bandWidthPriority)
                .attr('x2', x(currentValue) + bandWidthPriority)

            onUpdate(currentLine);
        }

        if (sections && sections.length) {
            xAxis.selectAll('text').remove();

            chart.selectAll('.x-axis-title')
                .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + margin.bottom - 8})`)

            addSections({
                chart,
                sections,
                xScale: x,
                height,
                margin
            });
        }

        return main;
    }

    function drawBars() {
        var stacks = patternify(stackesContainer, 'g', 'stack', data);

        bars = patternify(stacks, 'rect', 'stack-bar', d => {
            if (impactFactor) {
                return [
                    { criteria: d.criteria, type: 'current', value: d.current || 0 },
                    { criteria: d.criteria, type: 'original', value: d.sum || 0 }
                ]
            }

            return [{ criteria: d.criteria, type: 'current', value: d.sum || 0 }];
        })
        .attr('data-criteria', d => d.criteria)
        .attr("x", d => x(d.criteria) + 0.75)
        .attr("width", Math.max(1, bandWidth - 1.5))
        .attr("y", d => y(d.value))
        .attr("height", d => {
            return y(0) - y(d.value)
        })
        .attr('stroke-width', .5)
        .attr("stroke", d => styleAccessor(d, 'stroke'))
        .attr("stroke-dasharray", d => styleAccessor(d, 'strokeDasharray'))
        .attr("fill", d => styleAccessor(d, 'fill'));
    }

    main.updateData = function (newData) {
        data = newData;
        const m = max(data, d => Math.max(d.current, d.sum));
        const domain = params.maxDomain ? [0, Math.min(params.maxDomain, m)] : [0, m];

        y.domain(domain);
        yAxis.call(axisLeft(y).ticks(5));
        yAxis.selectAll('path').remove();
        drawBars();
    }

    main.addSlider = function (sliderParams) {
        if (typeof addSlider === 'function') {
            return addSlider(sliderParams);
        }
    }

    main.update = function (value) {
        currentValue = Math.ceil(value);
        update();
        return main;
    }

    main.onUpdate = function (f) {
        onUpdate = f;
        return main;
    }

    main.updateColor = function(color) {
        params.color = color;

        bars.attr("fill", d => styleAccessor(d, 'fill'));
    }

    main.show = function () {
        params.visible = true;
        chart.attr('opacity', params.visible ? 1 : 0)
            .attr('pointer-events', params.visible ? 'all' : 'none')
    }

    main.hide = function () {
        params.visible = false;
        chart.attr('opacity', params.visible ? 1 : 0)
            .attr('pointer-events', params.visible ? 'all' : 'none')
    }

    return main();
}

export default renderHistogram;