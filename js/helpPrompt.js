'use strict';

const helpIcon = document.getElementById("helpIcon");
const helpWindow = document.getElementById("helpWindow");
const helpWindowClose = document.getElementById("helpWindowClose");

let isOpen = false;

console.log("test that this file is loaded")

helpIcon.addEventListener("click", function () {
    //icon.innerHTML = "Hello World";
    if (isOpen === true) {
        helpIcon.innerHTML = "?"
        helpWindow.style.zIndex = (-1);
        isOpen = false;
    } else {
        helpIcon.innerHTML = "X"
        helpWindow.style.zIndex = (9999);
        isOpen = true;
    };
});

helpIcon.addEventListener("mouseover", function () {
    helpIcon.style.backgroundColor = "rgb(173, 201, 255)";
    helpIcon.style.color = "black";
    helpIcon.style.border = "medium solid rgba(0, 0, 0, 1)"

});

helpIcon.addEventListener("mouseout", function () {
    console.log("...and out!")
    helpIcon.style.backgroundColor = "rgb(0, 29, 86)";
    helpIcon.style.color = "white";
    helpIcon.style.border = "medium solid rgba(255, 255, 255, 0.693)"
});


helpWindow.innerHTML = "<b>This is an an app to help you find unmapped springs in Northern Nebraska.</b>"
helpWindow.innerHTML += "<br><br>Good Luck!"