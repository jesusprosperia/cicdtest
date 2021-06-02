import { format } from 'd3-format';

export const getRandomId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const formatNumber = (num) => {
  return format(",.2f")(num);
}

export const thousandFormat = (num) => {
  return format(",")(num)
}

export const formatKilo = (num) => {
  if (num > -1000 && num < 1000) {
    return num;
  }
  
  var f = format(".3~s");

  return f(num).replace(/G/,"B");
}

/**
 * Display a number with 3 digit's precision
 * @param  {Number} num The number to be displayed
 * @return {String}     The formatted string of the number
 */
export const formatStatistic = (num) => {
  
  var f = format(".3~s");

  return f(num).replace(/G/,"B");
}

export const fixIntegers = (obj, keys) => {
  const newObj = {...obj};
  keys.forEach(k => {
    const d = newObj[k];
    if (!isNaN(d)) {
      newObj[k] = +d;
    }
  });
  return newObj;
}