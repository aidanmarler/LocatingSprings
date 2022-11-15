'use strict';

// if true, will run the collectSpringPointData function.
// may take several minutes
const gatherSpringData = false;

//declare map variable globally so all functions have access
let map;
let pointObject = { coordinates: null, geol_layer: null };

// define layers
let pointClick_layer = L.circleMarker(); // svg point for where the user clicks
let studyArea_layer; // white background
let geol_layer_main; // used in the point click function
let springs_layer_main; // used for itterating though springs to retrive data about them
let geology_layers = []; // used for visualization of geology
let spring_layers = []; // used for visualization of springs
// let hydroGroup_layers = [];
// let probability_layers = [];

// MAIN - calls functions createMap and getData
function main() {
    createMap()
    getData(map)
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

    let canPlaceMarker = true;

    // create the map
    map = L.map('map', {
        center: [42.573288694114915, -100.70264421623715],
        zoom: 7.8,
        layers: [darkLayer, elevLayer]
    });

    //create the "on click" function to retrieve data for any point
    map.on('click', function (e) {

        assignPointProperties(e.latlng.lat, e.latlng.lng, pointObject);

        let latlng = L.latLng(e.latlng.lat, e.latlng.lng);

        let popupContent = displayPointObject(pointObject, pointClick_layer);

        setTimeout(() => placeMarker(), 0);
        function placeMarker() {
            if (canPlaceMarker === true) {
                if (pointClick_layer._latlng === undefined) {
                    // define pointClick_layer and add to map
                    pointClick_layer = L.circleMarker(latlng, marker_style);
                    pointClick_layer.addTo(map);
                } else {
                    // change point location with setLatLng
                    pointClick_layer.setLatLng(latlng);
                }
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


    function marker_clickOn(e) {
        pointClick_layer.remove(map)
        pointClick_layer = L.circleMarker();
        canPlaceMarker = true;

    }

    let isOverMarker = false;

    function marker_mouseOver(e) {
        canPlaceMarker = false;
        isOverMarker = true;
        setTimeout(() => showPopup(), 400);
        function showPopup() {
            if (isOverMarker === true) {
                pointClick_layer.openPopup();
            }
        }

    }

    function marker_mouseOut(e) {
        isOverMarker = false;
        canPlaceMarker = true;
    }

    function spring_clickOn(e) {
        if (e.target.isActive === true) {
            e.target.isActive = false;
            e.target.setStyle(springs_style);
            return false
        } else {
            e.target.isActive = true;
            e.target.setStyle(background_style);
            return true
        }

    }

    function spring_mouseOver(e) {
        canPlaceMarker = false;
    }

    function spring_mouseOut(e) {
        canPlaceMarker = true;
    }

    var baseMaps = {
        "Terrain": elevLayer,
        "Dark": darkLayer
    };

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


    // Funtion to get point data on springs
    function getSpringData(map) {

        $.ajax("data/point_springs.geojson", {
            dataType: "json",
            success: function (response) {
                // define springs layer as the leaflet geojson response
                springs_layer_main = L.geoJSON(response)

                // Check to see if the program to collect and output spring data should be produced
                if (gatherSpringData === true) {
                    collectSpringPointData(springs_layer_main)
                };

                // run function to create spring markers
                for (var feature in response.features) {
                    let point = L.geoJSON(response.features[feature])
                    let leafletID = point._leaflet_id - 1
                    let layer = pointToLayer(point._layers[leafletID]._latlng)
                    spring_layers.push(layer)
                }
                for (var layer in spring_layers) {
                    spring_layers[layer].addTo(map)
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
        await getGeology();
        getSpringData(map);
    };

    asyncCall();

};

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
};

// given coordinates, get data to store in the pointObject
// this is used in the on click function and collectSpringPointData function
function assignPointProperties(latVal, lonVal, object) {
    var pointCoordinates = { lat: latVal, long: lonVal }
    object.coordinates = pointCoordinates

    if (leafletPip.pointInLayer([lonVal, latVal], geol_layer_main)[0]) {
        var geolNEResults = leafletPip.pointInLayer([lonVal, latVal], geol_layer_main);
        object.geol_layer = geolNEResults[0].feature.properties.NEW_LABEL
        var code
        //Arikaree Group, Niobrara Formation, Ogallala Group, Pierre Shale, White River Group, and Other.
        if (object.geol_layer === "Arikaree Group") {
            code = 2
        } else if (object.geol_layer === "Niobrara Formation") {
            code = 3
        } else if (object.geol_layer === "Ogallala Group") {
            code = 4
        } else if (object.geol_layer === "Pierre Shale") {
            code = 5
        } else if (object.geol_layer === "White River Group") {
            code = 6
        } else (
            code = 1
        )
        object.geol_code = code
    } else {
        object.geol_layer = "NA"
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
    //fillColor: "green",
    //fillColor: geolgy_colorize,
    weight: 1,
    opacity: 0,
    color: 'grey',
    fillOpacity: .5
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
    fillColor: "cyan",
    color: "black",
    weight: 1,
    opacity: 1,
    fillOpacity: 1,
    radius: 6
};

//calculate color of geologic layer
function calcGeologyColor(type) {
    if (type === "Pierre Shale") {
        return "Green"
    } else if (type === "Ogallala Group") {
        return "Orange"
    } else if (type === "White River Group") {
        return "White"
    } else if (type === "Niobrara Formation") {
        return "Red"
    } else if (type === "Arikaree Group") {
        return "Brown"
    } else {
        return "Black"
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
        // itterate through geology layers...
        for (var layer in geology_layers) {
            // set each layer to inactive style
            geology_layers[layer].setStyle(inactive_style)
        }
    }


};

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

//  
function displayPointObject(pointProperties) {
    var panelContents = "";
    panelContents += "<p>Probability: <b>0.0%" + "" + "</b>, "
    panelContents += "Confidence:  <b>0.0%" + "</b></p>";
    panelContents += "<p>Geology: <b>" + pointProperties.geol_layer + "</b>, ";
    panelContents += "Hydrologic Group: <b>X" + "</b></p>";
    panelContents += "<p>Lat: <b>" + pointProperties.coordinates.lat.toFixed(3) + "</b>, ";
    panelContents += "Long: <b>" + pointProperties.coordinates.long.toFixed(3) + "</b></p>";
    return panelContents;
};

// call main function
$(document).ready(main);