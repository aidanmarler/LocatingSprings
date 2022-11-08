'use strict';

// if true, will run the collectSpringPointData function.
// may take several minutes
const gatherSpringData = false;

//declare map variable globally so all functions have access
var map;
var pointObject = { coordinates: null, geol_layer: null };

// define layers
var studyArea_layer;
var geol_NE_layer;
var springs_NE_layer;


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
    opacity: 1,
    color: 'grey',
    fillOpacity: 1
}

// bedrock geology
var geology_style = {
    //fillColor: "green",
    //fillColor: geolgy_colorize,
    weight: 1,
    opacity: 1,
    color: 'grey',
    fillOpacity: .5
}

//create marker options
var springs_style = {
    fillColor: "yellow",
    color: "black",
    weight: 1,
    opacity: 1,
    fillOpacity: 1,
    radius: 5
};

//calculate color of geologic layer
function calcGeologyColor(type) {
    if (type === "Pierre Shale") {
        return "Orange"
    } else if (type === "Ogallala Group") {
        return "Blue"
    } else if (type === "White River Group") {
        return "White"
    } else if (type === "Niobrara Formation") {
        return "Yellow"
    } else if (type === "Arikaree Group") {
        return "Red"
    } else {
        return "Black"
    }
}

// BASE FUNCTIONS
// Create map
function createMap() {

    //create the map
    map = L.map('map', {
        center: [42.755, -99.7],
        zoom: 10
    });

    //add the leaflet tilelayer to the map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        minZoom: 2
    }).addTo(map);

    //create the "on click" function to retrieve data for any point
    map.on('click', function (e) {
        assignPointProperties(e.latlng.lat, e.latlng.lng, pointObject)
        // call display function to print pointObject contents in the pointPanel
        displayPointObject(pointObject)
        //console.log(pointObject)
    });
};

// Import GeoJSON data layers
function getData(map) {
    //load the data
    //Load the background layer as visible in background style
    $.ajax("data/poly_area.geojson", {
        dataType: "json",
        success: function (response) {
            studyArea_layer = L.geoJSON(response, { style: background_style })
            studyArea_layer.addTo(map)
        }
    });
    //Load the geology layer as invisible in inactive style
    $.ajax("data/poly_geology.geojson", {
        dataType: "json",
        success: function (response) {
            geol_NE_layer = L.geoJSON(response)
            for (var polygon in response.features) {
                var geologyType = (response.features[polygon].properties.NEW_LABEL)
                geology_style.fillColor = calcGeologyColor(geologyType)
                var layer = L.geoJSON(response.features[polygon], { style: geology_style })
                layer.addTo(map)
            }
            //geology_style.fillColor = "green"//calcGeologyColor(response)
            //geol_NE_layer = L.geoJSON(response, { style: geology_style })
            //geol_NE_layer.addTo(map)
        }
    });
    //change this to a set of functions that specifically waits for one layer to load until loading the next
    setTimeout(() => { getSpringData(map); }, 500);

};

// Funtion to get point data on springs
function getSpringData(map) {

    $.ajax("data/point_springs.geojson", {
        dataType: "json",
        success: function (response) {

            springs_NE_layer = L.geoJSON(response)

            if (gatherSpringData === true) {
                collectSpringPointData(springs_NE_layer)
            };


            createSpringSymbols(response);
        }
    });
}

// when gatherSpringData = true, it will print a string of info for each spring point
function collectSpringPointData(springs_layer) {
    var pointString = "permanent_ID, Lat, Lon, Geologic Layer, Elevation, Slope \n"
    for (var layer in springs_layer._layers) {
        var permanentID = springs_layer._layers[layer].feature.properties.permanent_
        var elevationVal = springs_layer._layers[layer].feature.properties.Elevation
        var slopeVal = springs_layer._layers[layer].feature.properties.Slope
        var pointHolder = { coordinates: null, geol_layer: null };
        var lat = springs_layer._layers[layer].feature.geometry.coordinates[1];
        var lon = springs_layer._layers[layer].feature.geometry.coordinates[0];
        assignPointProperties(lat, lon, pointHolder)
        pointString += permanentID + ", " + pointHolder.coordinates.lat + ", " + pointHolder.coordinates.long + ", " + pointHolder.geol_layer + ", " + elevationVal + ", "+ slopeVal +"\n"
    };

    console.log(pointString)
};

// given coordinates, get data to store in the pointObject
function assignPointProperties(latVal, lonVal, object) {
    var pointCoordinates = { lat: latVal, long: lonVal }
    object.coordinates = pointCoordinates

    if (leafletPip.pointInLayer([lonVal, latVal], geol_NE_layer)[0]) {
        var geolNEResults = leafletPip.pointInLayer([lonVal, latVal], geol_NE_layer);
        object.geol_layer = geolNEResults[0].feature.properties.NEW_LABEL
    } else {
        object.geol_layer = "NA"
    }
};

//Add circle markers for point features to the map
function createSpringSymbols(data) {
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            return pointToLayer(feature, latlng);
        }
    }).addTo(map)
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng) {

    //create circle marker layer
    var layer = L.circleMarker(latlng, springs_style);

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

// MAIN - calls functions
function main() {
    createMap()
    getData(map)
};


// TOGGLE LAYERS
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

function geology_toggle(cb) {
    //console.log("Clicked, new value = " + cb.checked);
    geol_NE_layer.eachLayer(function (layer) {
        if (cb.checked === true) {
            layer.setStyle(geology_style);
        } else if (cb.checked === false) {
            layer.setStyle(inactive_style);
        }
    });
};

function springs_toggle(cb) {
    /*
    map.eachLayer(function (layer) {
        //Example 3.18 line 4
        if (layer.feature.geometry.type === "Point") {
            console.log(layer.feature.geometry.type)
            layer.setStyle({inactive_style});
        };
    });
    /*
    //console.log("Clicked, new value = " + cb.checked);
    springs_NE_layer.eachLayer(function (layer) {
        if (cb.checked === true) {
            layer.setStyle(geology_style);
        } else if (cb.checked === false) {
            layer.setStyle(inactive_style);
        }
    });
    /*
    //console.log("Clicked, new value = " + cb.checked);
    springs_SD_layer.eachLayer(function (layer) {
        if (cb.checked === true) {
            layer.setStyle(geology_style);
        } else if (cb.checked === false) {
            layer.setStyle(inactive_style);
        }
    });*/
};

//  
function displayPointObject(pointProperties) {
    var panelContents = "<p>Point Clicked:</p>";
    panelContents += "<p>Geology: <b>" + pointProperties.geol_layer + "</b></p>";
    panelContents += "<p>Latitude: <b>" + pointProperties.coordinates.lat + "</b></p>";
    panelContents += "<p>Longitude: <b>" + pointProperties.coordinates.long + "</b></p>";
    document.getElementById("pointPanel").innerHTML = panelContents;
};



// call main function
$(document).ready(main);