// Margin convention from https://bl.ocks.org/mbostock/3019563
var margin = {top: 50, right: 10, bottom: 100, left: 50};
var width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right;
var height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;
var svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleBand()
  .rangeRound([0, width])
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

  svg.select(".y.axis").call(d3.axisLeft(y).ticks(null, "s").tickSizeInner(-width).tickSizeOuter(0));
  svg.select(".y.axis text")
    .attr("y", y(y.ticks().pop()) + 0.05);

  svg.selectAll(".data-bars")
    .attr("x", function(d) { return x(d.data.demographic); })
    .attr("y", function(d) { return y(d[1]); })
    .attr("height", function(d) { return y(d[0]) - y(d[1]); })
    .attr("width", x.bandwidth());
  svg.selectAll(".bar-label")
    .attr("x", function(d) { return x(d.demographic) + (x.bandwidth()/2);})
    .attr("font-size", "12px")
    .style("opacity", 1);

  svg.selectAll(".legend g rect")
    .attr("x", width - 19);
  svg.selectAll(".legend g text")
    .attr("x", width - 24);

  if (width <= 600) {
    svg.selectAll(".x.axis text")
      .attr("transform", "rotate(-65)")
      .attr("text-anchor", "end")
      .attr("font-size", "8px")
      .attr("y", 2)
      .attr("dx", -5);
    svg.selectAll(".bar-label")
      .attr("font-size", "10px")
      .style("opacity", 1);
    if (width <= 250) {
      svg.selectAll(".bar-label").style("opacity", 0);
    }
  }
  else {
    svg.selectAll(".x.axis text")
      .attr("transform", null)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("dx", null);
  }
};

(function() {
  data.forEach(function(d) { d["Without SSL Score"] = d.acs_pop - d["With SSL Score"]; });
  data.sort(function(d) { return d["Without SSL Score"]; });
  x.domain(["Black Men", "Hispanic Men", "Black Women",
            "White Men", "Hispanic Women", "White Women"]);
  y.domain([0, d3.max(data, function(d) { return d.acs_pop; })]).nice();

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.select(".x.axis path").style("display", "none");
  svg.selectAll(".x.axis g line").style("display", "none");

  svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(y).ticks(null, "s"))
    .append("text")
      .attr("x", -(height/2)-30)
      .attr("y", -35)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start")
      .text("Chicago Pop. 20-29");

  svg.selectAll(".y.axis .domain")
    .style("opacity", 0);
  svg.selectAll(".y.axis .tick line")
    .style("opacity", 0.7)
    .style("stroke-width", 0.5);

  svg.append("g")
    .selectAll("g")
    .data(d3.stack().keys(["With SSL Score", "Without SSL Score"])(data))
    .enter().append("g")
      .attr("fill", function(d) { return z(d.key); })
      .attr("class", function(d) { return d.key.toLowerCase().replace(/ /g, "_"); })
    .selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
      .attr("class", "data-bars")
      .attr("x", function(d) { return x(d.data.demographic); })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .attr("width", x.bandwidth());

  var labelG = svg.append("g")
    .selectAll("text")
    .data(data)
    .enter();

  labelG.append("text")
    .attr("class", "with_ssl_labels bar-label")
    .attr("text-anchor", "middle")
    .attr("x", function(d) { return x(d.demographic) + (x.bandwidth()/2); })
    .attr("y", function(d) { return y(d["With SSL Score"]) - 5; })
    .attr("font-size", "12px")
    .text(function(d) { return Math.round((d["With SSL Score"]/d.acs_pop)*100) + "%"; });

  labelG.append("text")
    .attr("class", "total_labels bar-label")
    .attr("text-anchor", "middle")
    .attr("x", function(d) { return x(d.demographic) + (x.bandwidth()/2); })
    .attr("y", function(d) { return y(d.acs_pop) - 5; })
    .attr("font-size", "12px")
    .text(function(d) { return d3.format(".2s")(d.acs_pop); });

  var legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("class", "legend")
      .attr("text-anchor", "end")
    .selectAll("g")
    .data(["With SSL Score", "Without SSL Score"])
    .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + ((i * 20)-50) + ")"; });

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
