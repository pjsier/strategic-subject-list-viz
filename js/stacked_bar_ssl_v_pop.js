// Margin convention from https://bl.ocks.org/mbostock/3019563
var margin = {top: 20, right: 10, bottom: 20, left: 50};
var width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right;
var height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;
var svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleBand()
  .rangeRound([0, width])
  .paddingOuter(0.3)
  .paddingInner(0.3)
  .align(0.1);

var y = d3.scaleLinear()
  .rangeRound([height, 0]);

var RACE_SEX_GROUPS = [
  "Black Men 20-29", "Black Women 20-29", "Hispanic Men 20-29",
  "Hispanic Women 20-29", "White Men 20-29", "White Women 20-29"
];
var z = d3.scaleOrdinal()
  .domain(RACE_SEX_GROUPS)
  .range(["#6b486b", "#98abc5"]);

var data = [
  {demographic: "Black Men", acs_pop: 60112, "With SSL Score": 33836},
  {demographic: "Black Women", acs_pop: 68742, "With SSL Score": 11638},
  {demographic: "Hispanic Men", acs_pop: 69197, "With SSL Score": 15576},
  {demographic: "Hispanic Women", acs_pop: 64413, "With SSL Score": 3201},
  {demographic: "White Men", acs_pop: 87842, "With SSL Score": 5192},
  {demographic: "White Women", acs_pop: 92974, "With SSL Score": 1777}
];

function resize() {
  width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
  height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;

  x.rangeRound([0, width]);
  y.rangeRound([height, 0]);

  svg.select(".x.axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.select(".y.axis").call(d3.axisLeft(y).ticks(null, "s"));
  svg.select(".y.axis text")
    .attr("y", y(y.ticks().pop()) + 0.05);

  svg.selectAll(".data-bars")
    .attr("x", function(d) { return x(d.data.demographic); })
    .attr("y", function(d) { return y(d[1]); })
    .attr("height", function(d) { return y(d[0]) - y(d[1]); })
    .attr("width", x.bandwidth());

  svg.selectAll(".legend g rect")
    .attr("x", width - 19);
  svg.selectAll(".legend g text")
    .attr("x", width - 24);
};

(function() {
  data.forEach(function(d) { d["Without SSL Score"] = d.acs_pop - d["With SSL Score"]; });
  data.sort(function(d) { return d["Without SSL Score"]; });
  x.domain(["Black Men", "Hispanic Men", "Black Women",
            "White Men", "Hispanic Women", "White Women"]);
  y.domain([0, d3.max(data, function(d) { return d.acs_pop; })]).nice();

  svg.append("g")
    .selectAll("g")
    .data(d3.stack().keys(["With SSL Score", "Without SSL Score"])(data))
    .enter().append("g")
      .attr("fill", function(d) { return z(d.key); })
    .selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
      .attr("class", "data-bars")
      .attr("x", function(d) { return x(d.data.demographic); })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .attr("width", x.bandwidth());

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(y).ticks(null, "s"))
    .append("text")
      .attr("x", 5)
      .attr("y", y(y.ticks().pop()) + 0.5)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start")
      .text("Chicago ACS 2015 Population Ages 20-29");

  var legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("y", -10)
      .attr("class", "legend")
      .attr("text-anchor", "end")
    .selectAll("g")
    .data(["With SSL Score", "Without SSL Score"])
    .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + ((i * 20)-20) + ")"; });

  legend.append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", z);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(function(d) { return d; });

  d3.select(window).on('resize', resize);
  resize();
})()
