/**
 * Generates image base64 uri from svg (svg must be d3 selection)
 * @param {D3Selection} svg d3 selection
 * @param {Object} bound width and height of the svg
 * @param {Number} quality Get image quality index (basically,  index you can zoom in)
 */
function getImageUrl(svg, bound, quality = 1) {
  // Retrieve svg node
  var svgNode = svg.node(); 
  
  return new Promise((resolve, reject) => {
    // Create image
    var image = new Image();

    image.onload = function () {
      // Create image canvas
      var canvas = document.createElement('canvas');
      canvas.style.backgroundColor = '#fff'; 
      
      // Set width and height based on SVG node
      var rect = bound || svgNode.getBoundingClientRect();
      var width = rect.width * quality;
      var height = rect.height * quality;
  
      canvas.width = width;
      canvas.height = height; 
  
      // Draw background
      var context = canvas.getContext('2d');
      
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);
  
      context.drawImage(image, 0, 0, width, height);
  
      var dt = canvas.toDataURL('image/png');
      
      resolve(dt);
    };

    image.onerror = reject;
    var url = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(serializeString(svgNode));
    image.src = url;
  });
} 

// This function serializes SVG and sets all necessary attributes
function serializeString(svg) {
  var xmlns = 'http://www.w3.org/2000/xmlns/';
  var xlinkns = 'http://www.w3.org/1999/xlink';
  var svgns = 'http://www.w3.org/2000/svg';

  svg = svg.cloneNode(true);

  var fragment = window.location.href + '#';
  var walker = document.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT, null, false);

  while (walker.nextNode()) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = walker.currentNode.attributes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var attr = _step.value;

        if (attr.value.includes(fragment)) {
          attr.value = attr.value.replace(fragment, '#');
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          // throw _iteratorError;
          console.error(_iteratorError);
        }
      }
    }
  }

  svg.setAttributeNS(xmlns, 'xmlns', svgns);
  svg.setAttributeNS(xmlns, 'xmlns:xlink', xlinkns);
  var serializer = new XMLSerializer();
  var string = serializer.serializeToString(svg);
  return string;
}

function getImageUrlFromImage(img) {
  var canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

export {
  getImageUrl,
  getImageUrlFromImage
};