// additional statistics calculations
import { sum } from "d3-array";
import roundNumber from "@/utils/round-number";
import { formatStatistic } from "@/utils/formatters";
import { colors } from "@/colors";

/**
 * Filters data accordint to section value
 * @param {Array} data
 * @param {Number} section
 * @param {String} priority
 */
const sectionFilter = (data, section, priority) => {
  return data.filter((d) => {
    return priority == "low" ? d.criteria <= section : d.criteria > section;
  });
};

/**
 * Calculates statistics value
 * @param {Array} data node's data array
 * @param {String} priority low or high priority
 * @param {String} preOrPost pre or post policy
 */
export default function GetStat(
  data,
  section,
  statColumn,
  statType,
  priority = "low",
  preOrPost = "pre"
) {
  const statField = preOrPost + "_" + statColumn;
  const sectionData = sectionFilter(data, section, priority);
  const criteria = preOrPost == "pre" ? "sum" : "current";

  const _count = sum(sectionData, (d) => d[criteria]);
  const _sum = sum(sectionData, (d) => d[statField]);
  const _count_total = sum(data, (d) => d[criteria]);
  const _sum_total = sum(data, (d) => d[statField]);

  if (statType === "count") {
    return _count;
  }

  if (statType === "sum") {
    return _sum;
  }

  if (statType === "percentage_count") {
    return (100 * _count) / _count_total;
  }

  if (statType === "percentage_sum") {
    return (100 * _sum) / _sum_total;
  }

  if (statType === "mean") {
    return _count ? _sum / _count : 0;
  }

  if (statType === "poverty_gap") {
    const mean = _count ? _sum / _count - 0.5 : 0;

    if (section > 0) {
      let poverty_gap;

      if (priority === "low") {
        // calculate poverty gap
        poverty_gap = (100 * (section - mean)) / section;
      }

      if (priority === "high") {
        // calculate poverty gap
        poverty_gap = (100 * (mean - section)) / section;
      }

      return poverty_gap;
    }

    return 1;
  }

  if (statType === "FGT1") {
    if (_count_total === 0) {
      return 1;
    }

    const mean = _count_total
      ? (_sum - _count * 0.5 + section * (_count_total - _count)) / _count_total
      : 0;

    if (section > 0) {
      let poverty_gap;

      if (priority === "low") {
        poverty_gap = (100 * (section - mean)) / section;
      }

      if (priority === "high") {
        poverty_gap = (100 * (mean - section)) / section;
      }

      return poverty_gap;
    }

    return 1;
  }

  if (statType === "gini") {
    const weights = sectionData.map((d) => d[statField]);
    const x = sectionData.map((d) => d.criteria);

    const count = outerMultipy(weights, weights);

    const _subtracted = outerSubtract(x, x);
    const _multiplied = multiplyMatrixElements(_subtracted, count);
    const _projected = matrixMap(_multiplied, (d) => Math.abs(d));
    const mad = summarizeMatrix(_projected) / summarizeMatrix(count);

    const rmad = mad / average(x, weights);
    return 0.5 * rmad;
  }

  return 0;
}

function outerSubtract(a, b) {
  const product = [];

  for (let i = 0; i < a.length; i++) {
    const arr = [];
    const ith = a[i];

    for (let j = 0; j < b.length; j++) {
      const jth = b[j];

      arr.push(ith - jth);
    }

    product.push(arr);
  }

  return product;
}

function summarizeMatrix(matrix) {
  let sum = 0;

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      sum += matrix[i][j];
    }
  }
  return sum;
}

function matrixMap(matrix, callback) {
  const product = [];

  for (let i = 0; i < matrix.length; i++) {
    const arr = [];
    for (let j = 0; j < matrix[i].length; j++) {
      arr.push(callback(matrix[i][j]));
    }
    product.push(arr);
  }
  return product;
}

function average(a, weights) {
  const _sum = sum(a, (d, i) => d * weights[i]);
  const sumWeights = sum(weights);
  return _sum / sumWeights;
}

function multiplyMatrixElements(a, b) {
  const product = [];

  for (let i = 0; i < a.length; i++) {
    let arr = [];
    let bTh = b[i];

    for (let j = 0; j < a[i].length; j++) {
      arr[j] = bTh[j] * a[i][j];
    }
    product.push(arr);
  }

  return product;
}

function outerMultipy(a, b) {
  const product = [];

  for (let i = 0; i < a.length; i++) {
    const arr = [];
    const ith = a[i];

    for (let j = 0; j < b.length; j++) {
      const jth = b[j];

      arr.push(ith * jth);
    }

    product.push(arr);
  }

  return product;
}

export function getStatsData({
  statistics,
  currentValue,
  criteriaPriority,
  minMax,
  data,
  postPolicy,
  color,
}) {
  const statsData = [];

  if (statistics && statistics.length) {
    statistics.forEach((s) => {
      if (s.section.isCustom) {
        s.section.value = currentValue;
      }

      if (s.section.isFull) {
        s.section.value = criteriaPriority == "low" ? minMax[1] : minMax[0];
      }

      const sectionValue = s.section.value;
      const pre = GetStat(
        data,
        sectionValue,
        s.column,
        s.type,
        criteriaPriority,
        "pre"
      );

      const datum = [
        {
          stat_name: s.name,
          color: color,
          value: pre,
          textColor: "#fff",
          valueText:
            pre < 1 && pre > 0
              ? roundNumber(pre, 2)
              : formatStatistic(roundNumber(pre, 2)),
          name: "Pre policy: ",
        },
      ];

      if (
        postPolicy &&
        data.some((d) => d.hasOwnProperty("post_" + s.column))
      ) {
        const post = GetStat(
          data,
          sectionValue,
          s.column,
          s.type,
          criteriaPriority,
          "post"
        );

        datum.unshift({
          stat_name: s.name,
          color: color,
          value: post,
          textColor: "#fff",
          valueText:
            post > 0 && post < 1
              ? roundNumber(post, 2)
              : formatStatistic(roundNumber(post, 2)),
          name: "Post policy: ",
        });

        datum[1].color = colors.notAccepted;
        datum[1].textColor = "#000";
      }

      statsData.push(datum);
    });
  }
  return statsData;
}
