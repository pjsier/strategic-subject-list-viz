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
    .size([width, height])
    .round(true)
    .paddingInner(1);


function treemapForScore() {
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
    .sort(function(a, b) { return b.height - a.height || b.value - a.value;; });

  treemap = treemap.size([width, height]);
  treemap(root);
}


function resize() {
  width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
  height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;

  treemap.size([width, height]);
  treemap(root);

  var leaves = svg.selectAll("g g");
  leaves.data(root.leaves())
    .transition()
      .duration(300)
      .ease(d3.easeQuadInOut)
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });
  leaves.exit().remove();

  leaves.selectAll("rect")
    .transition()
      .duration(300)
      .ease(d3.easeQuadInOut)
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return d.y1 - d.y0; });
  leaves.selectAll("rect").exit().remove();

  var backG = svg.select("g.background");
  var titleG = svg.select("g.titles");
  backG.selectAll("text").remove();
  titleG.selectAll("text").remove();

  if (width < 350) {
    return;
  }
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


d3.csv(baseUrl + '/data/treemap_ssl_groups.csv', function(error, data) {
  csvData = data;
  treemapForScore();

  var cell = svg.selectAll("g")
    .data(root.leaves())
    .enter().append("g")
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

  cell.append("rect")
    .attr("id", function(d) { return d.data.id; })
    .attr("class", function(d) { return d.data.id.split(".").join(" "); })
    .attr("width", function(d) { return d.x1 - d.x0; })
    .attr("height", function(d) { return d.y1 - d.y0; })
    .attr("fill", function(d) { return color(d.parent.data.id); });

  cell.append("clipPath")
      .attr("id", function(d) { return "clip-" + d.data.id; })
    .append("use")
      .attr("xlink:href", function(d) { return "#" + d.data.id; });

  cell.append("text")
    .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
    .attr("x", 4)
    .attr("y", 14)
    .text(function(d) { return d.data.key; });

  cell.append("title")
    .text(function(d) { return d.data.key + "\n" + format(d.data.value); });

  var backG = svg.append("g").attr("class", "background");
  var titleG = svg.append("g").attr("class", "titles");

  resize();
  d3.select(window).on("resize", resize);
  d3.select("#scoreInput").on("input", function () {
    var el = document.getElementById("scoreInput");
    scoreNum = +el.value;
    treemapForScore();
    resize();
  });
});


d3.json(baseUrl + "/data/ssl_treemap_data.json", function(error, data) {
  if (error) throw error;

  var root = d3.hierarchy(data)
    .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
    .sum(function(d) { return d.size; })
    .sort(function(a, b) { return b.height - a.height || b.value - a.value; });
});
