'use strict';

// define a the legend as a constant variable
const legend = document.getElementById("mapLegend");

// create booleans to store whether boxes are checked
let geol_open = true;
let elev_open = false;
let slope_open = false;
let isMinimized = false;

legend.innerHTML = "<b></b>"
helpWindow.innerHTML += "<br><br>Good Luck!"

function ageology_toggle(cb) {

};
function aelev_toggle(cb) {

};
function aslope_toggle(cb) {

};



legend.addEventListener("click", function () {
    //icon.innerHTML = "Hello World";
    if (isMinimized === true) {
        legend.innerHTML = "?"
        isMinimized = false;
    } else {
        legend.innerHTML = "X"
        isMinimized = true;
    };
});