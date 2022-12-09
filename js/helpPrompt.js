'use strict';

// Define our 3 elements as contant variables
const helpIcon = document.getElementById("helpIcon");
const helpWindow = document.getElementById("helpWindow");
const helpWindowClose = document.getElementById("helpWindowClose");

// Create bool to store if the help prompt is open, and set it to false
let isOpen = false;

// Create an event listener to check if the user has clicked on the help prompt icon
helpIcon.addEventListener("click", function () {
    // If the prompt was open, close it by changing the icon, 
    //      moving the promp below the background, and setting isOpen as false
    if (isOpen === true) {
        helpIcon.innerHTML = "?"
        helpWindow.style.zIndex = (-1);
        isOpen = false;
    // If the prompt was closed, open it by changing the icon, 
    //      moving the promp above the rest of the site, and setting isOpen as true
    } else {
        helpIcon.innerHTML = "X"
        helpWindow.style.zIndex = (9999);
        isOpen = true;
    };
});

// On mouse over, set the icon to reflect that
helpIcon.addEventListener("mouseover", function () {
    helpIcon.style.backgroundColor = "rgb(173, 201, 255)";
    helpIcon.style.color = "black";
    helpIcon.style.border = "medium solid rgba(0, 0, 0, 1)"

});

// On mouse out, set the icon back to normal
helpIcon.addEventListener("mouseout", function () {
    helpIcon.style.backgroundColor = "rgb(0, 29, 86)";
    helpIcon.style.color = "white";
    helpIcon.style.border = "medium solid rgba(255, 255, 255, 0.693)"
});


// Add text to fill the help prompt here!
// Title
helpWindow.innerHTML = "<font size='+3'><b>Exploring the springs of Northern Nebraska</b></font>"

helpWindow.innerHTML += "<br><br>Jay Kong and Aidan Marler, Final Project for Dr. Karimzadeh's Geog 4043"

// PCP Instructions
helpWindow.innerHTML += "<br><br><font size='+2'><b>Parallel Coordinate Plot</b></font"
helpWindow.innerHTML += "<br>The large lined graph is a <b>Parallel Coordinate Plot.</b>  Colors on this graph represent Hydrolic Groups."
helpWindow.innerHTML += "It can be interacted with in a few ways"
helpWindow.innerHTML += "<br> - To filter, click and drag on any of the verical axes.  To remove a filter, click anywhere else on that axis."
helpWindow.innerHTML += "<br> - To reorder the axes, click and drag their label."
helpWindow.innerHTML += "<br> - Hovering over any spring point on the map will display just that line.  "

// Map Instructions
helpWindow.innerHTML += "<br><br><font size='+2'><b>Map</b></font"
helpWindow.innerHTML += "<br> "
helpWindow.innerHTML += "It can be interacted with in a few ways"
helpWindow.innerHTML += "<br> - By clicking on the map, a marker will be placed.  Information about this point can be querried by hoving over the marker."
helpWindow.innerHTML += "<br> - The checkboxes allow you to set a layer on the map to be active or not.  They are transparent, allowing the visualization of multiple layers at once."
// Matrix Instructions

// Further help, link the video

// Data Used and further resources, link the data used (geology, topography, soils)