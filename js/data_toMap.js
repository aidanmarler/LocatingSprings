'use strict';

// if true, will run the collectSpringPointData function.
// may take several minutes
//const gatherSpringData = false;

//declare map variable globally so all functions have access
let map;
let pointObject = { coordinates: null, geol_layer: null };
let canPlaceMarker = true;
const legend = document.getElementById("mapLegend");
const legendLabels = document.getElementById("legend-labels");
const legendTitle = document.getElementById("legend-title");
const svgLegendColors = document.getElementById("svgColors");
const toggles = document.getElementById("toggles");

// define layers
let pointClick_layer = L.circleMarker(); // svg point for where the user clicks
let studyArea_layer; // white background
let geol_layer_main; // used in the point click functioN
let springs_layer_main; // used for itterating though springs to retrive data about them
let elev_layer_main; // used in the point click function
let slope_layer_main; // used in the point click function
let hydro_layer_main; // used in the point click function
let geology_layers = []; // used for visualization of geology
let spring_layers = []; // used for visualization of springs
let elev_layers = []; // used for visualization of elevation
let slope_layers = []; // used for visualization of slope
let hydro_layers = []; // used for visualization of slope

// these store what map layers are active so that the legend knows what to display
let geol_active = true;
let elev_active = false;
let slope_active = false;
let hydro_active = false;

// MAIN - calls functions createMap and getData
function main() {
    createMap();
    getData(map);
    legendDisplay();
};

// BASE FUNCTIONS
// Creates leaflet map
// Also contains functions for on click and on hover events
function createMap() {

    // create a variable to hold the dark background layer
    let darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        minZoom: 7
    });

    // create a variable to hold the elevation background layer
    let elevLayer = L.tileLayer('http://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles Courtesy <a href="http://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer" target="_blank">USGS</a>',
        minZoom: 7,
        maxZoom: 16
    });

    // create the map
    map = L.map('map', {
        center: [42.573288694114915, -100.70264421623715],
        zoom: 7.8,
        layers: [darkLayer, elevLayer]
    });

    //create the "on click" function to retrieve data for any point
    map.on('click', function (e) {

        // Get properties of each layer for any point clicked
        assignPointProperties(e.latlng.lat, e.latlng.lng, pointObject);

        // use assigned point properties to get popupContent
        let popupContent = displayPointObject(pointObject, pointClick_layer);

        // create a leaflet latlng object from lat and long values
        let latlng = L.latLng(e.latlng.lat, e.latlng.lng);

        // set a delay of 0 to place marker
        // this is a bugfix
        setTimeout(() => placeMarker(), 0);
        function placeMarker() {
            // if a marker is supposed to be placed then...
            if (canPlaceMarker === true) {
                // if a marker isnt placed, then place a marker
                if (pointClick_layer._latlng === undefined) {
                    // define pointClick_layer and add to map
                    pointClick_layer = L.circleMarker(latlng, marker_style);
                    pointClick_layer.addTo(map);
                    marker_hover();
                    // if a marker is placed, then move it to the new location
                } else {
                    // change point location with setLatLng
                    pointClick_layer.setLatLng(latlng);
                    pointClick_layer.bringToFront();
                }
                // bind popup with popup content as created above
                pointClick_layer.bindPopup(popupContent);
            }
        }


        // call display function to print pointObject contents in the pointPanel


        pointClick_layer.on('click', marker_clickOn);
        pointClick_layer.on('mouseover', marker_mouseOver);
        pointClick_layer.on('mouseout', marker_mouseOut);

        for (var spring in spring_layers) {
            spring_layers[spring].on('click', spring_clickOn);
            spring_layers[spring].on('mouseover', spring_mouseOver);
            spring_layers[spring].on('mouseout', spring_mouseOut);
        }
    });

    // on click of the marker, remove it from the map and set the marker layer to be empty    
    function marker_clickOn(e) {
        pointClick_layer.remove(map)
        pointClick_layer = L.circleMarker();
        canPlaceMarker = true;
    }

    // bool for hovering over marker
    let isOverMarker = false;

    // on mouse over marker, make it so you can't place one down (so that you instead remove it if clicked)
    function marker_mouseOver(e) {
        canPlaceMarker = false;
        marker_hover();
    }

    // On hover (called after placement and on mouse over)
    function marker_hover() {
        // set hovering to true
        isOverMarker = true;
        // delay .3 seconds
        setTimeout(() => showPopup(), 300);
        function showPopup() {
            // if still hovering after .3 seconds, show the popupcontents for the marker
            if (isOverMarker === true) {
                pointClick_layer.openPopup();
                pointClick_layer.bringToFront();
            }
        }
    };

    // On mouse out, turn off hovering so that the popup is not displayed
    function marker_mouseOut(e) {
        isOverMarker = false;
        canPlaceMarker = true;
    }

    // On spring click...
    function spring_clickOn(e) {
        // if active, set to inactive
        if (e.target.isActive === true) {
            e.target.isActive = false;
            e.target.setStyle(springs_style);
            return false
            // if inactive, set to active
        } else {
            e.target.isActive = true;
            e.target.setStyle(background_style);
            return true
        }

    }

    // if hovering over a marker, make it so a marker cannot be placed
    function spring_mouseOver(e) {
        canPlaceMarker = false;
    }

    // if not hovering, set a marker so that it can be placed
    function spring_mouseOut(e) {
        canPlaceMarker = true;
    }

    // set basemaps to the defined dark and elevation maps from before.
    var baseMaps = {
        "Terrain": elevLayer,
        "Dark": darkLayer
    };

    // create a layer control to toggle between basemaps and add it to the map
    var layerControl = L.control.layers(baseMaps).addTo(map);
};

// Import GeoJSON data layers
function getData(map) {
    //load the data
    //Load the background layer as visible in background style
    function getBasemap() {
        return $.ajax("data/poly_area.geojson", {
            dataType: "json",
            success: function (response) {
                studyArea_layer = L.geoJSON(response, { style: background_style })
                studyArea_layer.addTo(map)
            }
        });
    };

    //Load the geology layer as invisible in inactive style
    function getGeology() {
        return $.ajax("data/poly_geology.geojson", {
            dataType: "json",
            success: function (response) {
                geol_layer_main = L.geoJSON(response)
                for (var polygon in response.features) {
                    // create a var geology type that is equal to name of geology layer
                    var geologyType = (response.features[polygon].properties.NEW_LABEL)
                    // use name of geology type to select geology color with calcGeologyColor function
                    geology_style.fillColor = calcGeologyColor(geologyType)
                    // use specific geology style in createing a new var for that layer
                    var layer = L.geoJSON(response.features[polygon], { style: geology_style })
                    //push that layer to a list
                    geology_layers.push(layer)
                    //console.log(layer._layers[leafletID-1])
                }
                for (var layer in geology_layers) {
                    geology_layers[layer].addTo(map)
                }
            }
        });
    };

    //Load the elevation layer as invisible in inactive style
    function getHydro() {
        return $.ajax("data/poly_hydro.geojson", {
            dataType: "json",
            success: function (response) {
                hydro_layer_main = L.geoJSON(response)
                for (var polygon in response.features) {
                    // use specific geology style in createing a new var for that layer
                    var layer = L.geoJSON(response.features[polygon], { style: inactive_style })
                    //push that layer to a list
                    hydro_layers.push(layer)
                    //console.log(layer._layers[leafletID-1])
                }
                for (var layer in hydro_layers) {
                    hydro_layers[layer].addTo(map)
                }
            }
        });
    };

    //Load the elevation layer as invisible in inactive style
    function getElevation() {
        return $.ajax("data/poly_elev.geojson", {
            dataType: "json",
            success: function (response) {
                elev_layer_main = L.geoJSON(response)
                for (var polygon in response.features) {
                    // use specific geology style in createing a new var for that layer
                    var layer = L.geoJSON(response.features[polygon], { style: inactive_style })
                    //push that layer to a list
                    elev_layers.push(layer)
                    //console.log(layer._layers[leafletID-1])
                }
                for (var layer in elev_layers) {
                    elev_layers[layer].addTo(map)
                }
            }
        });
    };


    //Load the elevation layer as invisible in inactive style
    function getSlope() {
        return $.ajax("data/poly_slope.geojson", {
            dataType: "json",
            success: function (response) {
                slope_layer_main = L.geoJSON(response)
                for (var polygon in response.features) {
                    // use specific geology style in createing a new var for that layer
                    var layer = L.geoJSON(response.features[polygon], { style: inactive_style })
                    //push that layer to a list
                    slope_layers.push(layer)
                    //console.log(layer._layers[leafletID-1])
                }
                for (var layer in slope_layers) {
                    slope_layers[layer].addTo(map)
                }
            }
        });
    };


    // Funtion to get point data on springs
    function getSpringData(map) {

        $.ajax("data/point_springs.geojson", {
            dataType: "json",
            success: function (response) {
                // define springs layer as the leaflet geojson response
                springs_layer_main = L.geoJSON(response)

                /*
                // Check to see if the program to collect and output spring data should be produced
                if (gatherSpringData === true) {
                    collectSpringPointData(springs_layer_main)
                }; */

                // run function to create spring markers
                for (var feature in response.features) {
                    let point = L.geoJSON(response.features[feature])
                    let leafletID = point._leaflet_id - 1
                    let layer = pointToLayer(point._layers[leafletID]._latlng)
                    spring_layers.push(layer)
                }
                for (var layer in spring_layers) {
                    //spring_layers[layer].addTo(map)
                }
            }
        });

        //function to convert markers to circle markers
        function pointToLayer(latlng) {
            //create circle marker layer
            var layer = L.circleMarker(latlng, springs_style);
            //return the circle marker to the L.geoJson pointToLayer option
            return layer;
        };
    }

    //change this to a set of functions that specifically waits for one layer to load until loading the next
    async function asyncCall() {
        await getBasemap();
        await getSlope();
        await getElevation();
        await getHydro();
        await getGeology();
        getSpringData(map);
        createPCP();
    };

    asyncCall();

};

/*
// when gatherSpringData = true, it will print a string of info for each spring point
function collectSpringPointData(springs_layer) {
    var pointString = "permanent_ID, Lat, Lon, Geologic Layer, Geology Code, Drainage Class, Hydrologic Group, Available Water Storage (0-150cm), Elevation (m), Slope \n"
    for (var layer in springs_layer._layers) {
        var permanentID = springs_layer._layers[layer].feature.properties.permanent_
        var elevationVal = springs_layer._layers[layer].feature.properties.Elevation
        var slopeVal = springs_layer._layers[layer].feature.properties.Slope
        var drainageClass = springs_layer._layers[layer].feature.properties.drclassdcd
        var hydrologicGroup = springs_layer._layers[layer].feature.properties.hydgrpdcd
        var awsVal = springs_layer._layers[layer].feature.properties.aws0150wta
        var pointHolder = { coordinates: null, geol_layer: null, geol_code: null };
        var lat = springs_layer._layers[layer].feature.geometry.coordinates[1];
        var lon = springs_layer._layers[layer].feature.geometry.coordinates[0];
        assignPointProperties(lat, lon, pointHolder)
        pointString += permanentID + ", " + pointHolder.coordinates.lat + ", " + pointHolder.coordinates.long + ", " //add ID and coordinates to output
        pointString += pointHolder.geol_layer + ", " + pointHolder.geol_code + ", " //add  to output
        pointString += drainageClass + ", " //add drainage class to output
        pointString += hydrologicGroup + ", " //add hydrologic group to output
        pointString += awsVal + ", " //add available water storage to output
        pointString += elevationVal + ", " //add elevation s to output
        pointString += slopeVal + "\n" //add slope to output
    };

    console.log(pointString)
};*/

// given coordinates, get data to store in the pointObject
// this is used in the on click function and collectSpringPointData function
function assignPointProperties(latVal, lonVal, object) {
    var pointCoordinates = { lat: latVal, long: lonVal }
    object.coordinates = pointCoordinates

    // Get geology at point or return NA
    if (leafletPip.pointInLayer([lonVal, latVal], geol_layer_main)[0]) {
        var geolResults = leafletPip.pointInLayer([lonVal, latVal], geol_layer_main);
        object.geol_layer = geolResults[0].feature.properties.NEW_LABEL
    } else {
        object.geol_layer = "NA"
    }
    // Get elevation range at point or return NA
    if (leafletPip.pointInLayer([lonVal, latVal], elev_layer_main)[0]) {
        var elevResults = leafletPip.pointInLayer([lonVal, latVal], elev_layer_main);
        object.elev_layer = elevResults[0].feature.properties.elevRange
    } else {
        object.elev_layer = "NA"
    }
    // Get slope range at point or return NA
    if (leafletPip.pointInLayer([lonVal, latVal], slope_layer_main)[0]) {
        var slopeResults = leafletPip.pointInLayer([lonVal, latVal], slope_layer_main);
        object.slope_layer = slopeResults[0].feature.properties.slopeRange
    } else {
        object.slope_layer = "NA"
    }
    // Get slope range at point or return NA
    if (leafletPip.pointInLayer([lonVal, latVal], hydro_layer_main)[0]) {
        var hydroResults = leafletPip.pointInLayer([lonVal, latVal], hydro_layer_main);
        object.hydro_layer = hydroResults[0].feature.properties.hydgrpdcd
    } else {
        object.hydro_layer = "NA"
    }
};



// LAYER STYLES
// inactive, sets to be invisible
var inactive_style = {
    fillColor: "red",
    weight: 0,
    opacity: 0,
    color: 'red',
    fillOpacity: 0
}

// study area
var background_style = {
    fillColor: "white",
    weight: 5,
    opacity: 0,
    color: 'grey',
    fillOpacity: 1
}

// bedrock geology
var geology_style = {
    weight: 1,
    opacity: 0,
    color: 'grey',
    fillOpacity: .7
}

//create marker options
var springs_style = {
    fillColor: "navy",
    color: "white",
    weight: .5,
    opacity: 1,
    fillOpacity: 1,
    radius: 5
};

//create marker options
var marker_style = {
    fillColor: "navy",
    color: "white",
    weight: 1.5,
    opacity: 1,
    fillOpacity: 1,
    radius: 6
};


// Calculate layer colors
//calculate color of geologic layer
function calcGeologyColor(type) {
    if (type === "Pierre Shale") {
        return "#9A7F32"
    } else if (type === "Ogallala Group") {
        return "#466C39"
    } else if (type === "White River Group") {
        return "#C88344"
    } else if (type === "Niobrara Formation") {
        return "#F18666"
    } else if (type === "Arikaree Group") {
        return "#6E7831"
    } else {
        return "Black"
    }
}

//calculate color of geologic layer
function calcElevColor(type) {
    if (type === 1) {
        return "#ffffff"
    } else if (type === 2) {
        return "#dddddd"
    } else if (type === 3) {
        return "#b9b9b9"
    } else if (type === 4) {
        return "#989898"
    } else if (type === 5) {
        return "#777777"
    } else if (type === 6) {
        return "#595959"
    } else if (type === 7) {
        return "#3b3b3b"
    } else if (type === 8) {
        return "#222222"
    } else if (type === 9) {
        return "#000000"
    } else {
        return "Black"
    }
}

//calculate color of geologic layer
function calcSlopeColor(type) {
    if (type === 1) {
        return "#000000"
    } else if (type === 2) {
        return "#4e4e4e"
    } else if (type === 3) {
        return "#a3a3a3"
    } else if (type === 4) {
        return "#ffffff"
    } else {
        return "Red"
    }
}

//hydgrpdcd
//calculate color of geologic layer
function calcHydroColor(type) {
    if (type === "A") {
        return "#000000"
    } else if (type === "B") {
        return "#4e4e4e"
    } else if (type === "C") {
        return "#a3a3a3"
    } else if (type === "D") {
        return "#ffffff"
    } else {
        return "Red"
    }
}

// TOGGLE LAYERS
// shows/hides background layer based on checkbox
function background_toggle(cb) {
    //console.log("Clicked, new value = " + cb.checked);
    studyArea_layer.eachLayer(function (layer) {
        if (cb.checked === true) {
            layer.setStyle(background_style);
        } else if (cb.checked === false) {
            layer.setStyle(inactive_style);
        }
    });
};

// shows/hides geology layers based on checkbox
function geology_toggle(cb) {

    // if show geology is TRUE then...
    if (cb.checked === true) {
        geol_active = true;
        // itterate through geology layers...
        for (var layer in geology_layers) {
            // use leaflet ID to access layer data
            let leafletID = (geology_layers[layer]._leaflet_id - 1)
            let geologyType = (geology_layers[layer]._layers[leafletID].feature.properties.NEW_LABEL)
            // use layer data to assign color based on geology type
            geology_style.fillColor = calcGeologyColor(geologyType)
            // set each layer to geology style
            geology_layers[layer].setStyle(geology_style)
        }
        // if show geology is FALSE then...
    } else if (cb.checked === false) {
        geol_active = false;
        // itterate through geology layers...
        for (var layer in geology_layers) {
            // set each layer to inactive style
            geology_layers[layer].setStyle(inactive_style)
        }
    }
    legendDisplay();
};

// shows/hides geology layers based on checkbox
function elev_toggle(cb) {
    // if show geology is TRUE then...
    if (cb.checked === true) {
        elev_active = true;
        // itterate through geology layers...
        for (var layer in elev_layers) {
            // use leaflet ID to access layer data
            let leafletID = (elev_layers[layer]._leaflet_id - 1)
            let elevType = (elev_layers[layer]._layers[leafletID].feature.properties.Id)
            // use layer data to assign color based on geology type
            geology_style.fillColor = calcElevColor(elevType)
            // set each layer to geology style
            elev_layers[layer].setStyle(geology_style)
        }
        // if show geology is FALSE then...
    } else if (cb.checked === false) {
        elev_active = false;
        // itterate through geology layers...
        for (var layer in elev_layers) {
            // set each layer to inactive style
            elev_layers[layer].setStyle(inactive_style)
        }
    }
    legendDisplay();
};

// shows/hides geology layers based on checkbox
function slope_toggle(cb) {
    // if show geology is TRUE then...
    if (cb.checked === true) {
        slope_active = true;
        // itterate through geology layers...
        for (var layer in slope_layers) {
            // use leaflet ID to access layer data
            let leafletID = (slope_layers[layer]._leaflet_id - 1)
            let slopeType = (slope_layers[layer]._layers[leafletID].feature.properties.Id)
            // use layer data to assign color based on geology type
            geology_style.fillColor = calcSlopeColor(slopeType)
            // set each layer to geology style
            slope_layers[layer].setStyle(geology_style)
        }
        // if show geology is FALSE then...
    } else if (cb.checked === false) {
        slope_active = false;
        // itterate through geology layers...
        for (var layer in slope_layers) {
            // set each layer to inactive style
            slope_layers[layer].setStyle(inactive_style)
        }
    }
    legendDisplay();
};

// shows/hides hyrdo group layers based on checkbox
function hydro_toggle(cb) {
    // if show geology is TRUE then...
    if (cb.checked === true) {
        hydro_active = true;
        // itterate through geology layers...
        for (var layer in hydro_layers) {
            // use leaflet ID to access layer data
            let leafletID = (hydro_layers[layer]._leaflet_id - 1)
            let hydroType = (hydro_layers[layer]._layers[leafletID].feature.properties.hydgrpdcd)
            // use layer data to assign color based on geology type
            geology_style.fillColor = calcHydroColor(hydroType)
            // set each layer to geology style
            hydro_layers[layer].setStyle(geology_style)
        }
        // if show geology is FALSE then...
    } else if (cb.checked === false) {
        slope_active = false;
        // itterate through geology layers...
        for (var layer in hydro_layers) {
            // set each layer to inactive style
            hydro_layers[layer].setStyle(inactive_style)
        }
    }
    legendDisplay();
};

/*
// shows/hides spring layers based on checkbox
function springs_toggle(cb) {
    if (cb.checked === true) {
        for (var layer in spring_layers) {
            spring_layers[layer].setStyle(springs_style)
        }
    } else if (cb.checked === false) {
        for (var layer in spring_layers) {
            spring_layers[layer].setStyle(inactive_style)
        }
    }
};
*/

// assembles pointPropeties properties into a cohesive popup prompt called panelContents
// returns panelContents
function displayPointObject(pointProperties) {
    var panelContents = "";
    panelContents += "<p>Geology: <b>" + pointProperties.geol_layer + "</b></p>";
    panelContents += "<p>Slope:  <b>" + pointProperties.slope_layer + "°</b>, ";
    panelContents += "Elevation: <b>" + pointProperties.elev_layer + " meters</b></p>"
    panelContents += "<p>Lat: <b>" + pointProperties.coordinates.lat.toFixed(3) + "</b>, ";
    panelContents += "Long: <b>" + pointProperties.coordinates.long.toFixed(3) + "</b></p>";
    return panelContents;
};

// call main function
$(document).ready(main);


// On mouse over the legend or toggles, make it so you can't place a marker
// On mouse over legend, set the icon to reflect that
legend.addEventListener("mouseover", function () {
    canPlaceMarker = false;
    console.log
});

// On mouse out legend, set the icon back to normal
legend.addEventListener("mouseout", function () {
    canPlaceMarker = true;
});

// On mouse over toggles, set the icon to reflect that
toggles.addEventListener("mouseover", function () {
    canPlaceMarker = false;
});

// On mouse out toggles, set the icon back to normal
toggles.addEventListener("mouseout", function () {
    canPlaceMarker = true;
});

// Funtion to decide how to display the legend
function legendDisplay() {
    if (geol_active === true) {
        legendTitle.innerHTML = "Geology"
        let array = ["Ogallala Group", "Arikaree Group", "Pierre Shale", "White River Group", "Niobrara Formation"]
        legendLabels.innerHTML = ""
        array.forEach(item => createLabel(item));
        function createLabel(item) {
            legendLabels.innerHTML += "<li><span style=background:" + calcGeologyColor(item) + "></span>" + item + "</li>"
        };
        legend.style.zIndex = 999
    } else if (hydro_active === true) {
        legendTitle.innerHTML = "Hydrologic Group"
        let array = ["A", "B", "C", "D", "ABC/D"]
        legendLabels.innerHTML = ""
        array.forEach(item => createLabel(item));
        function createLabel(item) {
            legendLabels.innerHTML += "<li><span style=background:" + calcHydroColor(item) + "></span>" + item + "</li>"
        };
        legend.style.zIndex = 999
    } else if (elev_active === true) {
        legendTitle.innerHTML = "Elevation"
        let array = [1, 3, 5, 7, 9]
        let labelsArray = ["352 - 528 meters", "", "655 - 781 meters", "", "899 - 1013 meters", "", "1123 - 1237 meters", "", "1361 - 1602 meters"]
        legendLabels.innerHTML = ""
        array.forEach(item => createLabel(item));
        function createLabel(item) {
            legendLabels.innerHTML += "<li><span style=background:" + calcElevColor(item) + "></span>" + labelsArray[item - 1] + "</li>"
        };
        legend.style.zIndex = 999
    } else if (slope_active === true) {
        legendTitle.innerHTML = "Slope"
        let array = [1, 2, 3, 4]
        let labelsArray = ["0 - 3°", "3 - 8°", "8 - 16°", "16 - 73°"]
        legendLabels.innerHTML = ""
        array.forEach(item => createLabel(item));
        function createLabel(item) {
            legendLabels.innerHTML += "<li><span style=background:" + calcSlopeColor(item) + "></span>" + labelsArray[item - 1] + "</li>"
        };
        legend.style.zIndex = 999
    } else {
        legend.style.zIndex = -1
    }
};
//geology_style("Ogallala Group")