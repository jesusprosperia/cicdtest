import { max } from 'd3-array';
import { select } from 'd3-selection';
import patternify from '@/utils/patternify.js';
import { axisLeft, axisBottom } from 'd3-axis';
import { scaleLinear, scaleBand } from 'd3-scale';
import renderSlider from './section-slider';
import { colors } from '@/colors';
import addSections from '@/js-charts/add-sections-band';

export default function SimpleHistogram(params) {
    var width = params.width || 520,
        height = params.height || 250,
        margin = {
            top: 30,
            right: 15,
            bottom: 65,
            left: 65
        };

    var data = params.data;
    var sections = params.sections || [];
    var title = params.fieldName;
    var container = params.container || document.body;
    var xExtent = params.xExtent;
    var yExtent = params.yExtent;
    // eslint-disable-next-line
    var currentValue = params.currentValue;
    var update;
    var svg;
    var chart;
    var sectionsGroup;
    var slider;
    // eslint-disable-next-line
    var sectionsDom;
    var x, y, chartHeight, chartWidth;
    // eslint-disable-next-line
    var onUpdate = () => { }

    function main() {
        container = select(container);

        // calculations
        chartWidth = width - margin.left - margin.right;
        chartHeight = height - margin.top - margin.bottom;

        var bands = data.map(d => d.criteria).sort((a, b) => a - b);
        var tickValues = bands.filter(d => d % 5 === 0);

        // scales
        x = scaleBand()
            .domain(bands)
            .range([0, chartWidth]);

        y = scaleLinear()
            .domain(params.yDomain || [0, max(data, d => d.sum)])
            .range([chartHeight, 0])
            .nice().clamp(true);

        svg = patternify(container, 'svg', 'simple-histogram')
            .attr('width', width)
            .attr('height', height)

        // drawing
        chart = patternify(svg, 'g', 'histogram')
            .attr('pointer-events', 'none')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
            .attr('opacity', params.visible ? 1 : 0);

        addCropArea();

        sectionsGroup = patternify(chart, 'g', 'sections-group');

        patternify(chart, 'text', 'x-axis-title')
            .attr("transform", `translate(
                ${chartWidth / 2}, ${chartHeight + margin.bottom / 2 + 16}
            )`)
            .style("text-anchor", "middle")
            .text(title);

        var xAxis = patternify(chart, 'g', 'x-axis')
            .attr('transform', `translate(0, ${chartHeight})`)
            .call(
                axisBottom(x).tickPadding(15).tickValues(tickValues)
            )

        var yAxis = patternify(chart, 'g', 'y-axis')
            .call(
                axisLeft(y).ticks(5)
            );

        yAxis.selectAll('path').remove();
        xAxis.selectAll('path').remove();
        xAxis.selectAll('line').remove();

        chart.selectAll("rect.bar")
            .data(data)
            .join("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.criteria) + 0.5)
            .attr("y", d => y(d.sum))
            .attr("width", x.bandwidth() - 1)
            .attr("height", d => y(0) - y(d.sum))
            .attr("fill", colors.notAccepted);

        update = function () {
            
        }

        slider = renderSlider({
            container: chart,
            value: 0,
            visible: true,
            x: 0,
            y: chartHeight + 8,
            width: chartWidth,
            sections: sections,
            scale: x
        }).onChange(() => {
            const [min, max] = xExtent;
            // constrain
            sections.forEach(d => {
                d.value = Math.max(min, Math.min(max, d.value));
            })

            sectionsDom = addSections({
                chart: sectionsGroup,
                sections,
                xScale: x,
                height: height - 20,
                margin,
                translateY: -20
            });
        });

        if (sections.length) {
            sectionsDom = addSections({
                chart: sectionsGroup,
                sections,
                xScale: x,
                height: height - 20,
                margin,
                translateY: -20
            });
        }

        return main;
    }

    function addCropArea() {
        var [xMin, xMax] = xExtent;

        var cropData = { 
            x1: x(xMin), 
            x2: x(xMax) + x.bandwidth(),
            y: yExtent ? y(yExtent[1]) : 0,
        };

        chart.selectAll("rect.boundary")
            .data([cropData])
            .join("rect")
            .attr("class", "boundary")
            .attr("x", d => d.x1)
            .attr("y", d => d.y)
            .attr("width", d => d.x2 - d.x1)
            .attr("height", d => chartHeight - d.y + 1)
            .attr("fill", "#f8f8f8");
    }

    main.updateSections = function(_sections) {
        sections = _sections;

        sectionsDom = addSections({
            chart: sectionsGroup,
            sections,
            xScale: x,
            height: height - 20,
            margin,
            translateY: -20
        });
        
        slider.update(sections);
    }

    main.updateXAxisExtent = function(min, max) {
        if (min) {
            xExtent[0] = min;
        } 

        if (max) {
            xExtent[1] = max;
        }

        addCropArea();
    }

    main.updateYAxisExtent = function(min, max) {
        if (min) {
            yExtent[0] = min;
        } 

        if (max) {
            yExtent[1] = max;
        }

        addCropArea();
    }

    main.update = function (value) {
        currentValue = value;
        update();
        return main;
    }

    main.onUpdate = function (f) {
        onUpdate = f;
        return main;
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

    main.getSlider = function () {
        return slider;
    }

    return main();
}