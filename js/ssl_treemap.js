// Adapted from:
// - https://bl.ocks.org/mbostock/4063582
// - https://bl.ocks.org/mbostock/2838bf53e0e65f369f476afd653663a2
// Margin convention from https://bl.ocks.org/mbostock/3019563
var margin = {top: 10, right: 10, bottom: 10, left: 10};
var width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right;
var height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;
var svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var scoreNum = 0;
var csvData, root;

var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
    color = d3.scaleOrdinal(d3.schemePaired.map(fader)),
    format = d3.format(",d");

var treemap = d3.treemap()
    .tile(d3.treemapSquarify.ratio(1))
    // .tile(d3.treemapResquarify)
    .size([width, height])
    .round(true)
    .paddingInner(1);

// TODO:
// - Add tooltips on both hover and click


function updateLabels() {
  var backG = svg.select("g.background");
  var titleG = svg.select("g.titles");

  backG.selectAll("text").remove();
  titleG.selectAll("text").remove();

  root.children.forEach(function(c1) {
    c1.children.forEach(function(c2) {
      // For larger segments, include for both men and women
      if (["black", "white", "hispanic"].indexOf(c1.data.key.split(".")[0].toLowerCase()) !== -1) {
        var titleTransform = "translate(" + c2.x0 + "," + c2.y0 + ")";
        titleG.append("text")
          .attr("transform", titleTransform)
          .attr("x", (c2.x1 - c2.x0)/2)
          .attr("y", ((c2.y1 - c2.y0)/2)-7)
          .text(c1.data.key);
        titleG.append("text")
          .attr("transform", titleTransform)
          .attr("x", (c2.x1 - c2.x0)/2)
          .attr("y", ((c2.y1 - c2.y0)/2)+7)
          .text(c2.data.key);
        backG.append("text")
          .attr("class", "background")
          .attr("transform", titleTransform)
          .attr("x", (c2.x1 - c2.x0)/2)
          .attr("y", ((c2.y1 - c2.y0)/2)-7)
          .text(c1.data.key);
        backG.append("text")
          .attr("class", "background")
          .attr("transform", titleTransform)
          .attr("x", (c2.x1 - c2.x0)/2)
          .attr("y", ((c2.y1 - c2.y0)/2)+7)
          .text(c2.data.key);
      }
    });
  });
}


function updateData() {
  var data = csvData;
  var scoreData = data.filter(function(d) { return (d.ssl_score >= scoreNum) && (d.sex != "Other"); });
  var scoreNest = d3.nest()
    .key(function(d) { return d.race; })
    .key(function(d) { return d.sex; })
    .key(function(d) { return d.age; })
    .rollup(function(d) { return d3.sum(d, function(d) { return +d.count; }); });

  root = d3.hierarchy({values: scoreNest.entries(scoreData)}, function(d) { return d.values; })
    .eachBefore(function(d) {
      if (d.data.key) {
        d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.key.toLowerCase();
      }
      else {
        d.data.id = "ssl";
      }
    })
    .sum(function(d) { return d.value; })
    .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

  updateLayout();
}


function updateLayout() {
  width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
  height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;

  treemap.size([width, height]);
  treemap(root);

  var leafG = svg.select("g.leafgroup")
  var leaves = leafG.selectAll("g.leaves")
    .data(root.leaves(), function(d) { return d.data.id; });
  leaves.exit().remove();

  // RE-ADD INFORMATION FOR NEW DATA

  var leavesEnter = leaves.enter()
    .append("g")
      .attr("class", "leaves")
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

  var rectLeaves = leavesEnter.append("rect")
    .attr("id", function(d) { return d.data.id; })
    .attr("class", function(d) { return d.data.id.split(".").join(" "); })
    .attr("fill", function(d) { return color(d.parent.data.id); })
    .attr("width", function(d) { return d.x1 - d.x0; })
    .attr("height", function(d) { return d.y1 - d.y0; });

  leavesEnter.append("clipPath")
      .attr("id", function(d) { return "clip-" + d.data.id; })
    .append("use")
      .attr("xlink:href", function(d) { return "#" + d.data.id; });

  leavesEnter.append("text")
    .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
    .attr("x", 4)
    .attr("y", 14)
    .text(function(d) { return d.data.key; });

  leavesEnter.append("title")
    .text(function(d) { return d.data.key + "\n" + format(d.data.value); });
  updateLabels();

  // UPDATE SELECTION FOR CHANGED INFO

  var leavesTransition = leaves.transition()
      .duration(300)
      .ease(d3.easeQuadInOut)
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
    .select("rect")
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return d.y1 - d.y0; });
}


d3.csv(baseUrl + '/data/treemap_ssl_groups.csv', function(error, data) {
  csvData = data;
  updateData();

  width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
  height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;

  treemap.size([width, height]);
  treemap(root);

  var leafG = svg.append("g").attr("class", "leafgroup")
  svg.append("g").attr("class", "background");
  svg.append("g").attr("class", "titles");

  var leaves = leafG.selectAll("g.leaves")
    .data(root.leaves(), function(d) { return d.data.id; })
    .enter()
    .append("g")
      .attr("class", "leaves")
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

  leaves.append("rect")
    .attr("id", function(d) { return d.data.id; })
    .attr("class", function(d) { return d.data.id.split(".").join(" "); })
    .attr("width", function(d) { return d.x1 - d.x0; })
    .attr("height", function(d) { return d.y1 - d.y0; })
    .attr("fill", function(d) { return color(d.parent.data.id); });

  leaves.append("clipPath")
      .attr("id", function(d) { return "clip-" + d.data.id; })
    .append("use")
      .attr("xlink:href", function(d) { return "#" + d.data.id; });

  leaves.append("text")
    .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
    .attr("x", 4)
    .attr("y", 14)
    .text(function(d) { return d.data.key; });

  leaves.append("title")
    .text(function(d) { return d.data.key + "\n" + format(d.data.value); });

  updateLabels();
  d3.select(window).on("resize", updateData);
  d3.select("#scoreInput").on("input", function () {
    var el = document.getElementById("scoreInput");
    scoreNum = +el.value;
    d3.select("#scoreVal").text(scoreNum);
    updateData();
  });
});
