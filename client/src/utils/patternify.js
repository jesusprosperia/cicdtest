// handles d3.js update, enter and exit selections
function patternify (container, elementTag, selector, data = null) {
    data = data || [selector]
  
    // Pattern in action
    var selection = container.selectAll('.' + selector).data(data, (d, i) => {
      if (typeof d === 'object') {
        if (d.id) {
          return d.id
        }
      }
      return i
    })
    
    selection.exit().remove()
    selection = selection.enter().append(elementTag).merge(selection)
    selection.attr('class', selector)
    return selection
}

export default patternify;