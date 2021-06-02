import renderPie from '../tree/pie';
import renderPie2Level from '../tree/pie-2level';
import { select } from 'd3-selection';
import patternify from '@/utils/patternify.js';
import { getRandomId } from '@/utils/formatters';
import Statistic from '../tree/statistic';

export default function renderTooltip({ 
  key,
  pie_label,
  post_impact,
  pre_impact,
  hasPostPolicy,
  statistics
}, translations) {
  const pieInnerRadius = 25;
  const pieOuterRadius = 85;
  const rectHeight = 18;

  const width = pieOuterRadius * 2 + 40;
  const height = 20 + pieOuterRadius * 2 + statistics.length * (rectHeight + 15) + 45;

  const div = document.createElement('div');
  const container = select(div);
  const svg = patternify(
    container,
    'svg',
    'tooltip-svg'
  )
    .attr('width', width)
    .attr('height', height)
  
  svg.append('text')
    .attr('class', 'pie-label')
    .attr('text-anchor', 'middle')
    .attr('pointer-events', 'none')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .attr('fill', '#000')
    .attr('x', width / 2)
    .attr('y', 11)
    .text(key)

  const pieLabel = svg.append('text')
    .attr('class', 'pie-label')
    .attr('text-anchor', 'middle')
    .attr('pointer-events', 'none')
    .attr('font-size', '12px')
    .attr('font-weight', 400)
    .attr('fill', '#000')
    .attr('x', width / 2)
    .attr('y', 30)
    .text(pie_label)
  
  const pieGroup = patternify(svg, 'g', 'pie-group')
    .attr('transform', `translate(${width / 2}, ${pieOuterRadius + 36})`);

  // pie chart
  const pie = (hasPostPolicy ? renderPie2Level : renderPie)({
    container: pieGroup,
    translations,
    id: getRandomId(),
    node: { color: '#21918c', colorPercent: 0.6 },
    value: hasPostPolicy ? [pre_impact, post_impact] : pre_impact,
    pieInnerRadius,
    pieOuterRadius,
    translation: [0, 0]
  });

  const statCharts = [];

  if (statistics && statistics.length) {
    statistics.forEach((s, i) => {
      const chart = Statistic({
        id: '_stat_tooltip_' + i,
        container: svg,
        visible: true,
        translation: [15, pieOuterRadius * 2 + 55 + i * (rectHeight + 15)],
        width: width - 30,
        data: s.stat,
        title: s.name,
        rectHeight
      });
      statCharts.push(chart);
    })
  }

  return {
    content: div,
    statCharts,
    pie,
    updatePieLabel: (label) => {
      pie_label = label;
      pieLabel.text(label)
    }
  };
}