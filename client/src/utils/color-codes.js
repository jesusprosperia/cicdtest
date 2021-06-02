function getColorCodes (leafNodes) {
  const leafNodesColors = {};
  const nFamilies = leafNodes.length;
  
  for (let i = 0; i < nFamilies; i++) {
    const nSiblings = leafNodes[i].length;
    
    for (let j = 0; j < nSiblings; j++) {
      const hierarchicalColor = i / nFamilies + (j + .5) / nFamilies / nSiblings;
      leafNodesColors[leafNodes[i][j]] = hierarchicalColor;
    }
  }

  return leafNodesColors;
}

export function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function parseRgb(rgb) {
    var rgbNums = rgb.split("(")[1];
    rgbNums = rgbNums.slice(0, rgbNums.length - 1);
    rgbNums = rgbNums.split(",").map(d => d.trim());

    return {
        r: parseInt(rgbNums[0]),
        g: parseInt(rgbNums[1]),
        b: parseInt(rgbNums[2]),
    }
}

export function getLuma (color) {
  var c = color.substring(1);  // strip #
  var rgb = parseInt(c, 16);   // convert rrggbb to decimal
  var r = (rgb >> 16) & 0xff;  // extract red
  var g = (rgb >>  8) & 0xff;  // extract green
  var b = (rgb >>  0) & 0xff;  // extract blue
  
  var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
  
  return luma
}

export function isDark(colorStr) {
  let color = colorStr;

  if (color[0] !== "#") {
    const {r, g, b} = parseRgb(color);
    color = rgbToHex(r, g, b);
  }

  const luma = getLuma(color);
  return luma < 128;
}

export default getColorCodes;