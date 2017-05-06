// Margin convention from https://bl.ocks.org/mbostock/3019563
var margin = {top: 20, right: 10, bottom: 20, left: 50};
var width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right;
var height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;
var svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleLinear()
  .domain([0, 500])
  .rangeRound([0, width]);
var y = d3.scaleLinear()
  .rangeRound([height, 0]);
var z = d3.scaleOrdinal(d3.schemeCategory10);
var RACE_SEX_GROUPS = ["Black Men 20-29", "Black Women 20-29", "Hispanic Men 20-29",
          "Hispanic Women 20-29", "White Men 20-29", "White Women 20-29"]
z.domain(RACE_SEX_GROUPS);

var line = d3.line()
  .curve(d3.curveBasis)
  .x(function(d) { return x(d.gte_ssl_score); })
  .y(function(d) { return y(d.count); });

function resize() {
  width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
  height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;

  x.rangeRound([0, width]);
  y.rangeRound([height, 0]);

  svg.selectAll('.line')
    .attr("d", function(d) { return line(d.values); });
  svg.select(".x.axis").call(d3.axisBottom(x));
  svg.select(".y.axis").call(d3.axisLeft(y));
  svg.select(".g-legend").attr("transform", "translate(" + (width-150) +  ",25)");
  svg.select(".overlay")
    .attr("width", width)
    .attr("height", height);
};


function ready(data) {
  var groups = data.columns.slice(1).map(function(id) {
    return {
      id: id,
      values: data.map(function(d) {
        return {gte_ssl_score: +d.gte_ssl_score, count: +d[id]};
      })
    };
  });
  y.domain([0, d3.max(groups, function(c) { return d3.max(c.values, function(d) { return d.count; })})]);

  var group = svg.selectAll(".group")
    .data(groups)
    .enter().append("g");

  group.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return line(d.values); })
    .style("stroke", function(d) { return z(d.id); });

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "x axis")
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(y));

  var groupLegend = svg.append("g")
    .attr("transform", "translate(" + (width-150) + ",20)")
    .attr("class", "g-legend");

  groupLegend.append("text")
    .attr("y", -10)
    .style("font-weight", "bold")
    .text("Race, Sex (20-29)");

  var groupKey = groupLegend.selectAll(".g-key")
      .data(RACE_SEX_GROUPS)
    .enter().append("g")
      .attr("class", "g-key");

  groupKey.append("rect")
    .attr("class", "g-groups")
    .attr("width", 5)
    .attr("height", 2)
    .attr("y", function(d, i) { return (i*15); })
    .attr("fill", function(d) { return z(d); });

  groupKey.append("text")
    .attr("x", 10)
    .attr("y", function(d, i) { return i*15; })
    .style("alignment-baseline", "central")
    .text(function(d) { return d.substring(0, d.length-6); });

  svg.append("path")
    .attr("class", "mouse mouse-line")
    .style("stroke", "#474747")
    .style("stroke-width", 0.5)
    .style("opacity", 1);

  var bisect = d3.bisector(function(d) { return d.gte_ssl_score; }).right;
  svg.append("text")
    .attr("class", "mouse mouse-tooltip")
    .attr("y", -5);

  svg.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .on('mouseout', function() {
      d3.selectAll(".mouse").style("opacity", 0);
      d3.selectAll(".g-key text")
        .text(function(d) { return d.substring(0, d.length-6); });
    })
    .on('mouseover', function() { d3.selectAll(".mouse").style("opacity", 1); })
    .on('mousemove', function() {
      var mouse = d3.mouse(this);
      d3.select(".mouse-line")
        .attr("d", function() {
          var d = "M" + mouse[0] + "," + height;
          d += " " + mouse[0] + "," + 0;
          return d;
        });
      var sslScore = Math.round(x.invert(d3.mouse(this)[0]));
      d3.select(".mouse-tooltip")
        .attr("x", function() { return mouse[0]; })
        .text(sslScore);
      d3.selectAll(".g-key text")
        .text(function(d, i) {
          if (sslScore <= 500 && sslScore > 0) {
            return d.substring(0, d.length-6) + ": " + d3.format(",")(groups[i].values[sslScore-1].count);
          }
          return d.substring(0, d.length-6);
        });
    });

  d3.select(window).on('resize', resize);
  resize();
}

(function() {
  d3.csv(baseUrl + "/data/ssl_gte_score_chi_by_race_sex.csv", ready);
})()
