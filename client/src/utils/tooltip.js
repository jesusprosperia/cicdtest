
export const getTooltipHtml = ({ 
    options, 
    nodeId, 
    headerText, 
    btnText, 
    btnClass, 
    selectedIndex 
  }, callback) => {

  var tooltip = document.createElement('div');
  tooltip.id = 'form-' + nodeId;
  tooltip.innerHTML = `
      <div class='pop-up'>
          <div class="mb-2">${headerText}</div>
          <div class="text-left">
              ${options.map((d, i) => {
                  return `
                      <div class="form-check">
                          <input class="form-check-input" type="radio" value="${d}" ${i == selectedIndex ? 'checked' : ''} name="checkboxes" />

                          <label class="form-check-label">
                              ${d}
                          </label>
                      </div>`
                  }).join('')
              }
          </div>
      </div>
  `;

  var button = document.createElement('button');
  button.innerHTML = btnText;
  button.setAttribute('class', 'mt-2 w-100 btn btn-sm ' + btnClass);
  tooltip.appendChild(button);

  button.addEventListener('click', function () {
      var splitFormId = '#form-' + nodeId;
      var selected = document.querySelector(splitFormId + ' input[name="checkboxes"]:checked').value;
      callback(selected);
  });

  return tooltip;
};