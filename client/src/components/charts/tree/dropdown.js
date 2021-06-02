import { getRandomId } from '@/utils/formatters';

function renderDropdown(params) {
  var container = params.container;

  var g,
      id = getRandomId(),
      options = params.options || [], 
      selected = params.selected,
      onChange = params.onChange || function () {},
      width = params.width || 120,
      height = params.height || 40;

  function main() {
      g = container.append('g')
          .attr('opacity', params.visible ? 1 : 0)
          .attr('pointer-events', params.visible ? 'all' : 'none')
          .attr('transform', `translate(${params.translation})`);

      g.append('foreignObject')
          .attr('width', width)
          .attr('height', height)
          .attr('x', -width / 2)
          .attr('y', -height / 2)
          .html(`
            <select id="select-${id}" class="form-control form-control-sm small-control">
              ${
                options.map(opt => {
                  return `<option 
                    value="${opt.value}" 
                    ${selected === opt.value ? 'selected' : ''}
                  >${opt.text}</option>`
                }).join('')
              }
            </select>
          `);

      g.select('#select-' + id)
       .on('change', function() {
          onChange(this.value);
       })

      return main;
  }

  main.show = function () {
      params.visible = true;
      g.attr('opacity', params.visible ? 1 : 0)
       .attr('pointer-events', params.visible ? 'all' : 'none')
  }

  main.hide = function () {
      params.visible = false;
      g.attr('opacity', params.visible ? 1 : 0)
         .attr('pointer-events', params.visible ? 'all' : 'none')
  }

  main.translate = function (translation) {
      params.translation = translation;
      g
        .transition().duration(750)
        .attr('transform', `translate(${params.translation})`)
  }

  main.getNode = function () {
      return g.node();
  }

  return main();
}

export default renderDropdown;