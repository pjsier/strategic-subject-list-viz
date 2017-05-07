// Adapted from https://bl.ocks.org/mbostock/4063582
// Margin convention from https://bl.ocks.org/mbostock/3019563
var margin = {top: 10, right: 50, bottom: 50, left: 10};
var width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right;
var height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;
var svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
    color = d3.scaleOrdinal(d3.schemePaired.map(fader)),
    format = d3.format(",d");

var treemap = d3.treemap()
    .tile(d3.treemapResquarify)
    .size([width, height])
    .round(true)
    .paddingInner(1);

d3.json(baseUrl + "/data/ssl_treemap_data.json", function(error, data) {
  if (error) throw error;

  var root = d3.hierarchy(data)
      .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
      .sum(function(d) { return d.size; })
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

  treemap(root);

  var cell = svg.selectAll("g")
    .data(root.leaves())
    .enter().append("g")
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

  cell.append("rect")
      .attr("id", function(d) { return d.data.id; })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return d.y1 - d.y0; })
      .attr("fill", function(d) { return color(d.parent.data.id); });

  cell.append("clipPath")
      .attr("id", function(d) { return "clip-" + d.data.id; })
    .append("use")
      .attr("xlink:href", function(d) { return "#" + d.data.id; });

  cell.append("text")
      .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
    .selectAll("tspan")
      .data(function(d) { return d.data.name.split(/(?=[A-Z][^A-Z])/g); })
    .enter().append("tspan")
      .attr("x", 4)
      .attr("y", function(d, i) { return 13 + i * 10; })
      .text(function(d) { return d; });

  cell.append("title")
      .text(function(d) { return d.data.id + "\n" + format(d.value); });

  var titleG = svg.append("g")
    .attr("width", width)
    .attr("height", height);

  var sexMap = {"M": "Men", "F": "Women"};
  var commonRaces = ["Black", "Hispanic", "White"];
  root.children.forEach(function(c1) {
    c1.children.forEach(function(c2) {
      // For larger segments, include for both men and women
      if (commonRaces.indexOf(c1.data.name) !== -1) {
        titleG.append("text")
          .attr("transform", "translate(" + c2.x0 + "," + c2.y0 + ")")
          .attr("x", (c2.x1 - c2.x0)/2)
          .attr("y", (c2.y1 - c2.y0)/2)
          .attr("text-anchor", "middle")
          .attr("font-size", "14px")
          .attr("font-weight", "bold")
          .text(c1.data.name + " " + c2.data.name);
      }
      // Otherwise, custom labels outsize of map itself
      else {
        if (c2.data.name === "Men") {
          var raceName = c1.data.name;
          // Handling clip path errors
          if (c1.data.name === "Unknown-Not-Listed") {
            raceName = "Unknown/Not Listed";
          }
          titleG.append("text")
            .attr("transform", "translate(" + c1.x0 + "," + c1.y0 + ")")
            .attr("x", (c1.x1 - c1.x0)/2)
            .attr("y", ((c1.y1 - c1.y0)/2)+25)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(raceName + " Men, Women")
        }
      }
    });
  })
});
