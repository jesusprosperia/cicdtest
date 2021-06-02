import { extent, sum } from 'd3-array';
import patternify from '@/utils/patternify.js';
import { axisLeft, axisBottom } from 'd3-axis';
import { scaleLinear, scaleSequential } from 'd3-scale';
import renderSlider from './slider';
import { hexbin } from 'd3-hexbin';
import { interpolateRgb } from 'd3-interpolate';
import addSections from '@/js-charts/add-sections';

function Scatter(params) {
  var width = params.width || 400,
    height = params.height || 400,
    margin = {
      top: 15,
      right: 15,
      bottom: 45,
      left: 45
    },
    radius = 5,
    container = params.container,
    criteria = params.criteria,
    data = params.data,
    translation = params.translation || [0, 0],
    chartVisible = params.visible,
    colors = {
      green: params.colors ? params.colors.green : '#0a9b7d',
      grey: params.colors ? params.colors.grey : '#E1E5EC',
      lightGreen: '#c3f7ed'
    },
    _currentValueX = params.currentValueX,
    _currentValueY = params.currentValueY,
    criteriaPriority = params.criteriaPriority || ['high', 'high'],
    onUpdate = () => { },
    update = () => { },
    addSlider,
    xScale,
    chart = null,
    innerChart,
    sections = params.sections;

  function main() {
    // calculations
    var chartWidth = width - margin.left - margin.right;
    var chartHeight = height - margin.top - margin.bottom;
    var criteriaX = criteria[0];
    var criteriaY = criteria[1];

    var total = sum(data, d => d.sum);
    var dataExtentX = extent(data, d => +d.criteriaX);
    var dataExtentY = extent(data, d => +d.criteriaY);

    var currentValueX = _currentValueX || dataExtentX[0];
    var currentValueY = _currentValueY || dataExtentY[0];

    xScale = scaleLinear()
      .range([0, chartWidth])
      .domain([
        dataExtentX[0] - 5,
        dataExtentX[1] + 5
      ]);

    var yScale = scaleLinear()
      .range([chartHeight, 0])
      .domain([
        dataExtentY[0] - 5,
        dataExtentY[1] + 5
      ]);

    // hexbin generator
    var hexbinGenerator = hexbin()
      .x(d => xScale(+d.criteriaX))
      .y(d => yScale(+d.criteriaY))
      .radius(radius)
      .extent([
        [0, 0],
        [chartWidth, chartHeight]
      ]);

    var bins = hexbinGenerator(data);

    var colorInterpolator = interpolateRgb(colors.lightGreen, colors.green);

    var color = scaleSequential()
      .domain(extent(bins, d => d.length))
      .interpolator(d => {
        return colorInterpolator(d);
      });

    var compare = (d) => {
      return (criteriaPriority[0] == 'high' ? +d.criteriaX >= currentValueX : +d.criteriaX <= currentValueX) &&
             (criteriaPriority[1] == 'high' ? +d.criteriaY >= currentValueY : +d.criteriaY <= currentValueY)
    }

    var colorScale = (bin) => {
      var p = sum(bin.filter(compare), d => d.sum) / total;
      if (p > 0) {
        return color(bin.length);
      }
      return colors.grey;
    };

    // drawing
    chart = patternify(container, 'g', 'scatter')
      .attr('pointer-events', 'none')
      .attr('transform', `translate(${translation[0]}, ${translation[1]})`)
      .attr('opacity', chartVisible ? 1 : 0);

    innerChart = patternify(chart, 'g', 'scatter-inner')
      .attr('pointer-events', 'none')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    var xAxis = patternify(innerChart, 'g', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(
        axisBottom(xScale).tickPadding(15)
      )

    var yAxis = patternify(innerChart, 'g', 'y-axis')
      .call(
        axisLeft(yScale).tickPadding(15)
      );

    yAxis.selectAll('path').remove();
    xAxis.selectAll('path').remove();
    xAxis.selectAll('line').remove();
    yAxis.selectAll('line').remove();

    patternify(innerChart, 'text', 'x-axis-title')
      .attr("transform", `translate(
       ${chartWidth / 2}, ${chartHeight + margin.bottom + 8}
      )`)
      .style("text-anchor", "middle")
      .text(criteriaX);

    patternify(innerChart, 'text', 'y-axis-title')
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left - 18)
      .attr("x", 0 - (chartHeight / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(criteriaY);

    var hexagons = patternify(innerChart, 'path', 'hexagon', bins)
      .attr("d", hexbinGenerator.hexagon())
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("fill", colorScale);

    var currentLineX = patternify(innerChart, 'line', 'current-line-x')
      .attr('x1', xScale(currentValueX))
      .attr('x2', xScale(currentValueX))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#2F353B')
      .attr('stroke-width', '1.5px')
      .attr('stroke-dasharray', '5 5')

    var currentLineY = patternify(innerChart, 'line', 'current-line-y')
      .attr('y1', yScale(currentValueY))
      .attr('y2', yScale(currentValueY))
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('stroke', '#2F353B')
      .attr('stroke-width', '1.5px')
      .attr('stroke-dasharray', '5 5')

    addSlider = function (sliderParams) {
      var direction = sliderParams.direction || 'h';

      var min, max, x, y, sliderWidth, sliderHeight;

      if (direction == 'h') {
        min = xScale.domain()[0];
        max = xScale.domain()[1];
        x = 0;
        y = chartHeight + 8;
        sliderWidth = chartWidth;
        sliderHeight = 8;
      } else {
        min = yScale.domain()[0];
        max = yScale.domain()[1];
        x = 0;
        y = 0;
        sliderWidth = 8;
        sliderHeight = chartHeight
      }

      var slider = renderSlider(Object.assign(sliderParams, {
        min,
        max,
        x,
        y,
        container: innerChart,
        width: sliderWidth,
        height: sliderHeight
      }));

      return slider;
    }

    update = function () {
      currentValueX = _currentValueX;
      currentValueY = _currentValueY;

      hexagons.attr('fill', colorScale);

      currentLineX.attr('x1', xScale(currentValueX))
        .attr('x2', xScale(currentValueX))

      currentLineY.attr('y1', yScale(currentValueY))
        .attr('y2', yScale(currentValueY))

      onUpdate(
        currentValueX,
        currentValueY
      );
    }

    if (sections && sections.length) {
      xAxis.selectAll('text').remove();

      innerChart.selectAll('.x-axis-title')
        .attr("transform", `translate(
          ${chartWidth / 2}, ${chartHeight + margin.bottom - 10}
        )`)

      addSections({
        chart: innerChart,
        sections,
        xScale,
        height,
        margin
      });
    }

    return main;
  }

  main.addSlider = function (sliderParams) {
    if (typeof addSlider === 'function') {
      return addSlider(sliderParams);
    }
  }

  main.update = function (currentValueX, currentValueY) {
    _currentValueX = currentValueX;
    _currentValueY = currentValueY;
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
  }

  main.hide = function () {
    params.visible = false;
    chart.attr('opacity', params.visible ? 1 : 0)
  }

  return main();
}

export default Scatter;