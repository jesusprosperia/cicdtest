import patternify from "@/utils/patternify";
import tippy from "tippy.js";
import renderTooltip from "./tooltip";
import roundNumber from "@/utils/round-number";
import { scaleLinear } from "d3-scale";
import { select, selectAll } from "d3-selection";
import { extent } from "d3-array";
import { getRandomId } from "@/utils/formatters";
import { isDark } from "@/utils/color-codes";
import { geoMercator, geoPath } from "d3-geo";
import { formatKilo } from "@/utils/formatters";

export default function MapModule(params) {
  var attrs = Object.assign(
    {
      id: getRandomId(),
      width: 500,
      height: 500,
      margin: {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      },
      container: "body",
      data: null, // map is colored based on this data
      all_data: null, // this will include precalculated values for statistics and impacts shown in tooltip
      geojson: {},
      texts: {},
      colors: [],
      hasLabels: true,
      onMouseOver: () => {},
      onMouseOut: () => {},
      onClick: () => {},
    },
    params
  );

  var container,
    svg,
    chart,
    features,
    mapContainer,
    chartWidth,
    chartHeight,
    colorScale,
    path,
    projection,
    grey = "#ddd",
    tooltip,
    dataMap = new Map(),
    chartsMap = new Map(),
    colorMinMax = null,
    borderWidth = 0.15;

  function main() {
    container = select(attrs.container);

    setDimensions();

    // projection
    projection = geoMercator().fitSize(
      [chartWidth, chartHeight],
      attrs.geojson
    );

    // path generator
    path = geoPath().projection(projection);

    // color scale
    colorScale = scaleLinear()
      .domain([0, 25, 50, 75, 100])
      .range(attrs.colors)
      .clamp(true);

    drawContainers();
    drawFeatures();
  }

  function drawContainers() {
    //Add svg
    svg = patternify(container, "svg", "chart-svg")
      .attr("width", attrs.width)
      .attr("height", attrs.height);

    //Add chart group
    chart = patternify(svg, "g", "chart").attr(
      "transform",
      `translate(${attrs.margin.left}, ${attrs.margin.top})`
    );

    //Add map container
    mapContainer = patternify(chart, "g", "map-container");
  }

  function drawLegend() {
    const legendHeight = attrs.height * 0.8;
    const colors = colorScale.range();
    const p = 100 / (colors.length - 1);

    const grad = colors.map((d, i) => `${d} ${p * i}%`).join(",");

    let leftPos = 80;

    if (attrs.width < 1000) {
      leftPos = attrs.width * 0.01;
    }

    const legendWrapper = patternify(container, "div", "legend-wrapper")
      .style("position", "absolute")
      .style("left", leftPos + "px")
      .style("top", "40px");

    const statLabels = patternify(legendWrapper, "div", "stat-labels");

    patternify(statLabels, "h6", "stat-name").text(attrs.texts.statText);

    patternify(statLabels, "h6", "pre-post-name").text(
      "(" + attrs.texts.prePostText + ")"
    );

    const legend = patternify(legendWrapper, "div", "legend");

    const labels = patternify(legend, "div", "labels");

    patternify(
      labels,
      "div",
      "legend-label",
      colorScale
        .domain()
        .map((d) => formatKilo(Math.round(d)))
        .reverse()
    ).text((d) => d);

    patternify(legend, "div", "legend-grad")
      .style("background", `linear-gradient(to top, ${grad})`)
      .style("height", legendHeight + "px")
      .style("width", "30px")
      .style("border-radius", "5px");

    const template = document.getElementById("popup_template");

    if (template) {
      if (tooltip) tooltip.destroy();

      template.style.display = "block";

      tooltip = tippy(legendWrapper.node(), {
        theme: "light-border",
        trigger: "click",
        placement: "left-start",
        interactive: true,
        arrow: true,
        content: template,
        maxWidth: 260,
      });
    }
  }

  function getInvertedColor(name, isHighlight = false) {
    const d = dataMap.get(name);
    let strokeColor = "#fff";

    if (d) {
      const color = colorScale(d.value);
      const dark = isDark(color);

      if (isHighlight) {
        strokeColor = dark ? "#A2A2A2" : "#578cf7";
      } else {
        strokeColor = dark ? "#fff" : "#A2A2A2";
      }
    }

    return strokeColor;
  }

  // Update stroke to polygon and stack rect
  function highlight(name) {
    chart.selectAll("path.polygon").attr("stroke", ({ properties }) => {
      return getInvertedColor(properties.name, properties.name === name);
    });

    selectAll(".stack-map rect").attr("stroke", ({ key }) => {
      return getInvertedColor(key, key === name);
    });
  }

  function drawFeatures() {
    const featuresGroup = patternify(mapContainer, "g", "features-group");

    features = patternify(featuresGroup, "g", "feature", attrs.geojson.features)
      .on("mouseover", function({ properties }) {
        highlight(properties.name);

        const d = dataMap.get(properties.name);
        if (d) {
          const stack = select("#stack-map-" + d.id);

          if (!stack.empty()) {
            const tooltip = stack.node()._tippy;
            if (tooltip) tooltip.show();
          }

          select(this).raise();
        }
      })
      .on("mouseout", function({ properties }) {
        const d = dataMap.get(properties.name);

        if (d) {
          const stack = select("#stack-map-" + d.id);

          if (!stack.empty()) {
            const tooltip = stack.node()._tippy;
            if (tooltip) tooltip.hide();
          }
        }

        highlight(null);
      });

    patternify(features, "path", "polygon", (d) => [d])
      .attr("d", path)
      .attr("fill", grey)
      .attr("stroke-width", borderWidth)
      .attr("stroke", null);

    patternify(features, "text", "polygon-label", (d) => [d])
      .attr("font-size", "12px")
      .attr("font-weight", 600)
      .attr("text-anchor", "middle")
      .attr("transform", (d) => {
        const centroid = path.centroid(d);
        return `translate(${centroid})`;
      });

    if (attrs.all_data) {
      main.setAllData(attrs.all_data);
    }

    if (attrs.data) {
      dataMap = new Map(attrs.data.map((d) => [d.name, d]));
      colorize();
    }
  }

  function setDimensions() {
    if (!container.node()) return;

    var containerRect = container.node().getBoundingClientRect();

    if (containerRect.width > 0) {
      attrs.width = containerRect.width;
    }

    chartWidth = attrs.width - attrs.margin.right - attrs.margin.left;
    chartHeight = attrs.height - attrs.margin.bottom - attrs.margin.top;
  }

  function colorize(min_max) {
    if (min_max) {
      colorMinMax = min_max;
    } else if (!colorMinMax) {
      colorMinMax = extent(attrs.data, (d) => d.value);
    }

    const domain = getColorDomain(colorMinMax);
    colorScale.domain(domain).range(attrs.colors);

    features.each(function({ properties }) {
      const datum = dataMap.get(properties.name);
      const { statCharts, pie } = chartsMap.get(properties.name) || {};

      let color = grey;
      let textColor = "#000";
      let text = "";

      if (datum) {
        color = colorScale(datum.value);
        textColor = isDark(color) ? "#fff" : "#000";

        text = attrs.texts.isImpact
          ? `${roundNumber(datum.value, 1)}%`
          : formatKilo(Math.round(datum.value));

        // update statistics color
        if (statCharts) {
          statCharts.forEach((d) => {
            d.updateColor(color, textColor);
          });
        }

        // update pie color
        if (pie) {
          pie.updatePieColor(color, textColor);
        }
      }

      select(this)
        .select(".polygon")
        .attr("fill", color)
        .attr("stroke-width", borderWidth)
        .attr("stroke", textColor);

      select(this)
        .select(".polygon-label")
        .text(text)
        .attr("fill", textColor);
    });

    drawLegend();
  }

  function getColorDomain([min, max]) {
    const len = attrs.colors.length;
    const stops = [];
    const diff = Math.abs(max - min) || 100;
    const each = diff / (len - 1);

    for (let i = 0; i < len; i++) {
      stops.push(min + i * each);
    }

    return stops;
  }

  //////////////////////////////////////////////////////
  ///////////////// instance methods ///////////////////
  //////////////////////////////////////////////////////
  main.highlight = (name, noTooltip = false) => {
    highlight(name);

    if (!noTooltip) {
      features.each(function({ properties }) {
        if (this._tippy) {
          if (properties.name === name && !this._tippy.state.isShown) {
            this._tippy.show();
          } else if (this._tippy.state.isShown) {
            this._tippy.hide();
          }
        }
      });
    }
  };

  main.clearHighlight = (noTooltip = false) => {
    highlight(null);

    features.each(function() {
      if (!noTooltip) {
        if (this._tippy) this._tippy.hide();
      }
    });
  };

  main.setTexts = (texts) => {
    attrs.texts = texts;
    return main;
  };

  main.setColors = (colors) => {
    attrs.colors = colors;
    return main;
  };

  main.setAllData = (all_data) => {
    attrs.all_data = all_data;

    features.each(function({ properties }) {
      const datum = all_data.find((d) => d.key === properties.name);
      const { content, ...rest } = datum
        ? renderTooltip(datum, attrs.translations)
        : { content: properties.name };

      chartsMap.set(properties.name, { ...rest });

      if (this._tippy) {
        this._tippy.destroy();
      }

      tippy(this, {
        theme: "light-border",
        arrow: true,
        allowHTML: true,
        delay: 0,
        placement: "right",
        content: content,
        maxWidth: 300,
        interactive: true,
        // distance: 30,
        hideOnClick: "toggle",
      });
    });

    return main;
  };

  main.setData = (data, min_max) => {
    attrs.data = data;
    dataMap = new Map(attrs.data.map((d) => [d.name, d]));
    colorize(min_max);
  };
  main.colorScale = () => colorScale;
  main.getSize = () => {
    return [chartWidth, chartHeight];
  };
  main.colorize = colorize;
  main.render = function() {
    main();
    let timer = null;
    // on window resize, rerender map
    select(window).on("resize." + attrs.id, function() {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        main();
      }, 150);
    });
    return main;
  };

  return main;
}
