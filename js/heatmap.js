// set the dimensions and margins of the graph
const margin = { top: 20, right: 10, bottom: 40, left: 40 },
  width = 320 - margin.left - margin.right,
  height = 270 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3v6.select("#heatmap")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Labels of row and columns
const myGroups = ["Arikaree", "Niobrara", "Ogallala", "Pierre Shale", "White River"]
const myVars = ["B/D", "A/D", "D", "C", "B", "A"]

// Build X scales and axis:
const x = d3v6.scaleBand()
  .range([0, width])
  .domain(myGroups)
  .padding(0.01);
svg.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3v6.axisBottom(x))

// Build X scales and axis:
const y = d3v6.scaleBand()
  .range([height, 0])
  .domain(myVars)
  .padding(0.01);
svg.append("g")
  .call(d3v6.axisLeft(y));

// Build logarithmic color scale 
const myColor = d3v6.scaleLog()
  .range(["grey", "white", "#0C56C8"])
  .domain([0, 1, 54]);

//Read the data
d3v6.csv("data/springs_matrix.csv").then(function (data) {
  // create a tooltip
  const counter = d3v6.select("#heatmap")
    .append("div")
    .style("opacity", 1)
    .attr("class", "tooltip")
    .style("color", "black")
    .html("")

  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = function (event, d) {
    counter.style("opacity", 1)
  }

  const mousemove = function (event, d) {
    counter
      .html("<b>" + d.Count + "</b> springs")
      .style("left", (event.x) / 2 + "px")
      .style("top", (event.y) / 2 + "px")
      counter.style("color", "white")
  }

  const mouseleave = function (d) {
    counter.html("")
  }

  // add the squares
  svg.selectAll()
    .data(data, function (d) { return d.Geology + ':' + d.Hydro; })
    .enter()
    .append("rect")
    .attr("x", function (d) { return x(d.Geology) })
    .attr("y", function (d) { return y(d.Hydro) })
    .attr("width", x.bandwidth()-1)
    .attr("height", y.bandwidth()-1)
    .style("fill", function (d) { return myColor(d.Count) })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
})