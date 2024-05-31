console.log("Hello from renderer.js");

const minimizeButton = document.getElementById("minimize-button");
const maximizeButton = document.getElementById("maximize-button");
const closeButton = document.getElementById("close-button");
const getStartedButton = document.getElementById("get-started-button");

minimizeButton.addEventListener("click", () => {
    window.api.minimizeApp();
});

maximizeButton.addEventListener("click", () => {
    window.api.maximizeApp();
});

closeButton.addEventListener("click", () => {
    window.api.closeApp();
});

getStartedButton.addEventListener("click", () => {
    window.api.getStarted();
});