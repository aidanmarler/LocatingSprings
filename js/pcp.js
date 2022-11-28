

// PCP CREATION
function createPCP() {
  // establish "global" variables
  var pointCount = "109";
  var dataLoad;
  var theID;

  // define a linear color scale
  var colorscale = d3.scale.linear()
    .domain([0, 33]) //use d3 max
    .range(["steelblue", "brown"])
    .interpolate(d3.interpolateLab);

  // return the appropriate color based on slope variable
  var color = function(d) {return colorscale(d['Slope'])}

  // initialize the PCP plot: assign color and alpha
  var parcoords = d3.parcoords()("#pcp")
    .color(color)  // quantitative color scale
    .alpha(0.6)
  
  // load csv file an put it into the PCP
  d3.csv('data/springs.csv', function(data) {
    parcoords
      .data(data)
      .hideAxis(["permanent_ID", "Lat", "Lon"])
      .render()
      .shadows()
      .alpha(0.5)
      //enable the brushing
      .brushMode("1D-axes") 
      .reorderable()
      .interactive();
    // for the later highlighing operation
    dataLoad = data;
  });

  // on brushing, update the selected points with the most bass-ackwards method of deleting and re-adding layers
  parcoords.on("brush", function() {
    //load the selected points to a variable, and convert them to a GeoJSON
    var selectedPoints = GeoJSON.parse(parcoords.brushed(), {
      Point:   ['Lat', 'Lon'],
      Include: ["permanent_ID", 'Lat', 'Lon', 
                "Geologic Layer", 'Drainage Class', 'Hydrologic Group', 
                'Available Water Storage (0-150cm)', "Elevation (m)", "Slope"]
    });
    
    points.clearLayers(); // clear all the points from the Points layer
    points.addData(selectedPoints); // put the "selected points" into the Points layer
    pointCount = selectedPoints.features.length; // get the length of the selected points to use as # of points
    legend.updateCount(pointCount); // update the point count
  });


  //make some popups and include the text from the "description" field.  summon the highlighting on hover, too
  function addPopups(feature, layer) {

    let IDs = feature.properties.permanent_ID
    let Lat = ""
    let Lon = ""
    let Geolo = ""
    let Drain = ""
    let Hydro = ""
    let Water = ""
    let Eleva = ""
    let Slope = feature.properties.Slope
  
    //concatinate a big string with the HTML formatting and some headers
    let myString = "ID: " + IDs + " and " + "Slope: " + Slope
    layer.bindTooltip(myString);

    //run the highlighter code
    layer.on({
      mouseover: highlightLine, 
      mouseout: resetHighlight
    })
  };

  //customize the appearance of the markers
  function pointToCircle(feature, latlng) {
    //color the points based on selected property
    let fillColorVar = "#0C56C8";//"#668A66"
    let ringColorVar = "white";//"#228B22";
    
    var geojsonMarkerOptions = {
      radius: 5,
      weight: 1,
      color: ringColorVar,
      opacity: 1,
      fillColor: fillColorVar,
      fillOpacity: 1
    };
    
    var circleMarker = L.circleMarker(latlng, geojsonMarkerOptions);
    return circleMarker;
  }


  // highlight lines on hovering using the ID property
  function highlightLine(e) {
    theID = this.feature.properties.permanent_ID
    for (var i = 0; i < dataLoad.length; i++) {
      if (dataLoad[i].permanent_ID == theID) {
        parcoords.highlight([dataLoad[i]]);
      }
    }
  }

  //reset highlighting
  function resetHighlight() {
    parcoords.unhighlight([dataLoad[theID]]);
  }


  //make a helper to actually apply the styling options with Omnivore
  var omnivoreStyleHelper = L.geoJSON(null, {
    onEachFeature: addPopups,
    pointToLayer: pointToCircle
  });

  //set the default value of points to the whole CSV file, and call the style helper
  var points = omnivore.csv('data/springs.csv', null, omnivoreStyleHelper);
  map.addLayer(points);

  //add a hovering box ("legend") that displays the number of points that are selected
  var legend = L.control({
    position: "bottomleft"
  });


  //some functions to control legend updating
  legend.onAdd = function(map) {
    var div = L.DomUtil.create("div", "legend");
    div.innerHTML += "<b>Points Selected: </b><br>" + pointCount
    return div;
  };

  legend.onRemove = function(map) {
    delete map.legend;
  };

  legend.updateCount = function(str) {
    this.getContainer().innerHTML = "<b>Points Selected: </b><br>" + pointCount
  };
  legend.addTo(map);

};