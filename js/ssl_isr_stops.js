// Margin convention from https://bl.ocks.org/mbostock/3019563
var margin = {top: 20, right: 10, bottom: 20, left: 10};
var width = 500 - margin.left - margin.right;
var height = 650 - margin.top - margin.bottom;
var svg = d3.select("#map-container")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var projection = d3.geoMercator().scale(1).translate([0,0]);
var path = d3.geoPath().projection(projection);
var hexbin = d3.hexbin()
    .size([width, height])
    .radius(8);

function ready(error, json, cards) {
  var bounds = path.bounds(json);
  var s = 0.95 / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height);
  var t = [(width - s * (bounds[1][0] + bounds[0][0])) / 2, (height - s * (bounds[1][1] + bounds[0][1])) / 2];
  projection.scale(s).translate(t);
  var color = d3.scaleQuantize()
    .domain([0, d3.max(json.features, function(d) { return d.properties.ssl_count; })])
    .range(colorbrewer['Blues'][5]);
    // Grayscale
    // .range(colorbrewer['Greys'][5]);

  var g = svg.append("g");
  g.selectAll("path")
    .data(json.features)
    .enter()
    .append("path")
      .attr("d", path)
      .attr("fill", function(d) { return color(d.properties.ssl_count); });

  cards = cards.filter(function(d) {
    return d.lon !== "" && d.lat !== "";
  })
  cards.forEach(function(d) {
    var p = projection([+d.lon, +d.lat]);
    d[0] = p[0], d[1] = p[1];
  });

  var hexbinData = hexbin(cards).sort(function(a, b) { return b.length - a.length; });
  var radius = d3.scaleLinear()
      .domain([0, hexbinData[0].length])
      .range([0, 10]);

  var cardFeature = svg.append("g")
    .selectAll("circle")
      .data(hexbinData)
    .enter().append("circle")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr("r", function(d) { return radius(d.length); });

  var cardLegend = svg.append("g")
      .attr("transform", "translate(25,200)")
      .attr("class", "g-legend");

  cardLegend.append("text")
    .attr("y", -36)
    .style("font-weight", "bold")
    .text("ISR Stops");
  cardLegend.append("text")
    .attr("y", -20)
    .text("Jan 2016-Feb 2017");

  var cardKey = cardLegend.selectAll(".g-key")
      .data([100, 500, 1000, 2000])
    .enter().append("g")
      .attr("class", "g-key");

  cardKey.append("circle")
      .attr("class", "g-cards")
      .attr("cx", function(d) { return 5; })
      .attr("cy", function(d, i) { return i*25; })
      .attr("r", radius);

  cardKey.append("text")
      .attr("x", 25)
      .attr("y", function(d, i) { return i*25; })
      .attr("dy", ".35em")
      .text(function(d) { return d; });

  var sslLegend = svg.append("g")
      .attr("transform", "translate(25,350)")
      .attr("class", "g-legend");

  sslLegend.append("text")
    .attr("y", -26)
    .style("font-weight", "bold")
    .text("# Arrest Locations w/SSL Scores");
  sslLegend.append("text")
    .attr("y", -10)
    .text("Aug 2012-Jul 2016");

  var sslKey = sslLegend.selectAll(".g-key")
      .data(color.range())
    .enter().append("g")
      .attr("class", "g-key");

  sslKey.append("rect")
    .attr("class", "g-ssl-colors")
    .attr("width", 20)
    .attr("height", 20)
    .style("fill", function(d) { return d; })
    .attr("x", 0)
    .attr("y", function(d, i) { return 20*i;});

  sslKey.append("text")
    .attr('x', 35)
    .attr('y', function(d, i) { return (20*i)+10; })
    .style("alignment-baseline", "central")
    .text(function(d) {
      return color.invertExtent(d).map(function(d) { return Math.floor(d); }).join("-");
    });
}

(function() {
  d3.queue()
    .defer(d3.json, baseUrl + "/data/chi_census_tracts.geojson")
    .defer(d3.csv, baseUrl + "/data/contact_cards.csv")
    .await(ready);
})()
