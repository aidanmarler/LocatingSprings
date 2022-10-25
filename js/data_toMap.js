'use strict';

//declare map variable globally so all functions have access
var map;
var drainage_layer;
var pointObject = { coordinates: null, drainage_name: null, geol_layer: null };
// define layers
var studyArea_layer;
var drainage_layer;
var geol_NE_layer;
var geol_SD_layer;
var springs_NE_layer;
var springs_SD_layer;
// arrays to store spring data in
var springs_NE_data = [];
var springs_SD_data = [];


// LAYER STYLES
// inactive
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

// water drainages
var drainage_style = {
    fillColor: "grey",
    weight: 1,
    opacity: 1,
    color: 'grey',
    fillOpacity: 0
}

// bedrock geology
var geology_style = {
    fillColor: "green",
    weight: 1,
    opacity: 1,
    color: 'green',
    fillOpacity: .2
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


// BASE FUNCTIONS
// Create map
function createMap() {

    //create the map
    map = L.map('map', {
        center: [43.400882994726, -99.4020641736508],
        zoom: 7
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        minZoom: 2
    }).addTo(map);

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
    $.ajax("data/studyArea_poly.geojson", {
        dataType: "json",
        success: function (response) {
            studyArea_layer = L.geoJSON(response, { style: background_style })
            studyArea_layer.addTo(map)
        }
    });
    $.ajax("data/drainage_poly.geojson", {
        dataType: "json",
        success: function (response) {
            drainage_layer = L.geoJSON(response, { style: drainage_style })
            drainage_layer.addTo(map)
        }
    });
    $.ajax("data/geol_NE_poly.geojson", {
        dataType: "json",
        success: function (response) {
            geol_NE_layer = L.geoJSON(response, { style: inactive_style })
            geol_NE_layer.addTo(map)
        }
    });
    $.ajax("data/geol_SD_poly.geojson", {
        dataType: "json",
        success: function (response) {
            geol_SD_layer = L.geoJSON(response, { style: inactive_style })
            geol_SD_layer.addTo(map)
        }
    });
    //change this to a set of functions that specifically waits for one layer to load until loading the next
    setTimeout(() => { getSpringData(map); }, 500);

};

function getSpringData(map) {
    $.ajax("data/springs_NE_point.geojson", {
        dataType: "json",
        success: function (response) {
            springs_NE_layer = L.geoJSON(response)
            
            for (var layer in springs_NE_layer._layers) {
                var pointHolder = { coordinates: null, drainage_name: null, geol_layer: null };
                var lat = springs_NE_layer._layers[layer].feature.geometry.coordinates[1];
                var lon = springs_NE_layer._layers[layer].feature.geometry.coordinates[0];
                assignPointProperties(lat, lon, pointHolder)
                springs_NE_data.push(pointHolder)
              }
              
            console.log(springs_NE_data)

            createSpringSymbols(response);
            //springs_NE_layer.addTo(map)
            //
            //springs_NE_layer.addTo(map)
        }
    });
    $.ajax("data/springs_SD_point.geojson", {
        dataType: "json",
        success: function (response) {
            springs_SD_layer = L.geoJSON(response)
            
            for (var layer in springs_SD_layer._layers) {
                var pointHolder = { coordinates: null, drainage_name: null, geol_layer: null };
                var lat = springs_SD_layer._layers[layer].feature.geometry.coordinates[1];
                var lon = springs_SD_layer._layers[layer].feature.geometry.coordinates[0];
                assignPointProperties(lat, lon, pointHolder)
                springs_SD_data.push(pointHolder)
              }
              
            console.log(springs_SD_data)
            createSpringSymbols(response);
            //springs_SD_layer = L.geoJSON(response, { style: springs_style })
            //springs_SD_layer.addTo(map)
        }
    });
}

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
    var polygon = L.polygon([
        [44.60, -102.45],
        [42.20, -102.45],
        [42.20, -96.445],
        [44.60, -96.445]
    ])
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

function drainage_toggle(cb) {
    //console.log("Clicked, new value = " + cb.checked);
    drainage_layer.eachLayer(function (layer) {
        if (cb.checked === true) {
            layer.setStyle(drainage_style);
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
    //console.log("Clicked, new value = " + cb.checked);
    geol_SD_layer.eachLayer(function (layer) {
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

// given coordinates, get data to store in the pointObject
function assignPointProperties(latVal, lonVal, object) {
    var pointCoordinates = { lat: latVal, long: lonVal }
    object.coordinates = pointCoordinates

    if (leafletPip.pointInLayer([lonVal, latVal], drainage_layer)[0]) {
        var drainageResults = leafletPip.pointInLayer([lonVal, latVal], drainage_layer);
        object.drainage_name = drainageResults[0].feature.properties.name
    } else {
        object.drainage_name = "NA"
    };
    if (leafletPip.pointInLayer([lonVal, latVal], geol_NE_layer)[0]) {
        var geolNEResults = leafletPip.pointInLayer([lonVal, latVal], geol_NE_layer);
        object.geol_layer = geolNEResults[0].feature.properties.ORIG_LABEL
    } else if (leafletPip.pointInLayer([lonVal, latVal], geol_SD_layer)[0]) {
        var geolSDResults = leafletPip.pointInLayer([lonVal, latVal], geol_SD_layer);
        object.geol_layer = geolSDResults[0].feature.properties.NAME
    }
    else {
        object.geol_layer = "NA"
    }
};

//  
function displayPointObject(pointProperties) {
    var panelContents = "<p>Point Clicked:</p>";
    panelContents += "<p>Geology: <b>" + pointProperties.geol_layer + "</b></p>";
    panelContents += "<p>Water Drainage: <b>" + pointProperties.drainage_name + "</b></p>";
    panelContents += "<p>Latitude: <b>" + pointProperties.coordinates.lat + "</b></p>";
    panelContents += "<p>Longitude: <b>" + pointProperties.coordinates.long + "</b></p>";
    document.getElementById("pointPanel").innerHTML = panelContents;
};


// OLD CODE to call function on the click of layer, so may still be useful. 
/* 
// on click, get drainage info
function onEachDrainage(feature, layer) {
    layer.on({
        click: getDrainageInfo
    });
}

//
function getDrainageInfo(e) {
    var layer = e.target;
    pointObject.drainage_name = layer.feature.properties.name
}

*/


// call main function
$(document).ready(main);