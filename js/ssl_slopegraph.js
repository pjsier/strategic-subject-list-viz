// Adapted from https://bl.ocks.org/mbostock/4063582
// Margin convention from https://bl.ocks.org/mbostock/3019563
var margin = {top: 30, right: 25, bottom: 50, left: 25};
var width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right;
var height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;
var svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var slopeData = [
  {demographic: "Black Men 20-29", count250: 33810, count300: 27030, count350: 3983},
  {demographic: "Black Women 20-29", count250: 11631, count300: 8730, count350: 490},
  {demographic: "Hispanic Men 20-29", count250: 15565, count300: 10940, count350: 792},
  {demographic: "Hispanic Women 20-29", count250: 3198, count300: 2269, count350: 72},
  {demographic: "White Men 20-29", count250: 5185, count300: 3504, count350: 118},
  {demographic: "White Women 20-29", count250: 1777, count300: 1204, count350: 21}
];
var padding = 10;

var y = d3.scaleLinear()
  .domain([21, 33810])
  .rangeRound([height, 0]);
var z = d3.scaleOrdinal(d3.schemePaired);
var RACE_SEX_GROUPS = [
  "Black Men 20-29", "Black Women 20-29", "Hispanic Men 20-29",
  "Hispanic Women 20-29", "White Men 20-29", "White Women 20-29"
];
z.domain(RACE_SEX_GROUPS);
// For handling indices later on
var sorted300 = slopeData.sort(function(a, b) { return b.count300 - a.count300 }).map(function(d) { return d.demographic; });
var sorted350 = slopeData.sort(function(a, b) { return b.count350 - a.count350 }).map(function(d) { return d.demographic; });

function resize() {
  width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
  height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;

  y.rangeRound([height, 0]);

  svg.selectAll("text.end-vals")
    .attr("x", width-100);
  svg.selectAll("line")
    .attr("x2", width-100-padding);
};

(function() {
  // Create markers to use on lines later
  var defs = d3.select("#chart").append("defs");
  defs.selectAll("marker")
    .data(RACE_SEX_GROUPS)
    .enter().append("marker")
      .attr("id", function(d) { return "marker_" + d.replace(/ /g, "_"); })
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("refX", 5)
      .attr("refY", 5)
    .append("circle")
      .attr("cx", 5)
      .attr("cy", 5)
      .attr("r", 1.5)
      .attr("fill", function(d) { return z(d); });

  var labelVals = svg.append("g")
    .attr("class", "labels")
    .selectAll("text")
      .data(slopeData)
      .enter();

  labelVals.append("text")
    .attr("class", "start-vals")
    .attr("text-anchor", "end")
    .attr("alignment-baseline", "central")
    .attr("x", 100)
    .attr("y", function(d) { return y(d.count250);})
    .text(function(d) { return d.demographic.substring(0,d.demographic.length-6)+ " " + d3.format(".2s")(d.count250); });
  labelVals.append("text")
    .attr("class", "end-vals")
    .attr("text-anchor", "start")
    .attr("alignment-baseline", "central")
    .attr("x", width-100)
    .attr("y", function(d) {
    // For handling collisions in >= 350
      if (d.count350 <= 500) {
        return y(500)+(sorted350.indexOf(d.demographic)*12)-15;
      }
      return y(d.count350);
    })
    .text(function(d) { return d.demographic.substring(0,d.demographic.length-6) + " " + d3.format(".2s")(d.count350); });

  svg.select("g.labels")
    .append("text")
    .attr("class", "start-top")
    .attr("text-anchor", "end")
    .attr("x", 100)
    .attr("y", -15)
    .attr("font-weight", "bold")
    .text("# Scores >= 250");
  svg.select("g.labels")
    .append("text")
    .attr("class", "end-top end-vals")
    .attr("text-anchor", "start")
    .attr("x", width-100)
    .attr("y", -15)
    .attr("font-weight", "bold")
    .text("# Scores >= 350");

  svg.append("g")
    .attr("class", "lines")
    .selectAll("line")
      .data(slopeData)
      .enter()
      .append("line")
        .attr("x1", 100+padding)
        .attr("x2", width-100-padding)
        .attr("y1", function(d) { return y(d.count250); })
        .attr("y2", function(d) { return y(d.count350); })
        .attr("marker-start", function(d) { return "url(#marker_" + d.demographic.replace(/ /g, "_") + ")"})
        .attr("marker-end", function(d) { return "url(#marker_" + d.demographic.replace(/ /g, "_") + ")"})
        .style("stroke-width", "2")
        .style("stroke-linecap", "round")
        .style("stroke", function(d) { return z(d.demographic); });

    d3.select(window).on("resize", resize);
    resize();
})()
