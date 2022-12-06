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
helpWindow.innerHTML = "<b>This is an an app to help you find unmapped springs in Northern Nebraska.</b>"
// PCP Instructions
helpWindow.innerHTML += "<br><br>Good Luck!"
// Map Instructions

// Matrix Instructions

// Further help, link the video

// Data Used and further resources, link the data used (geology, topography, soils)