const { ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
    console.log("Preload Script Loaded");
    // Define replacetext, which replaces the text of an element with the given selector.
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    }
    // Replace the versions of the dependencies in the preload window.
    for (const dependency of ["chrome", "node", "electron"]) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
    // Minimize, Maximize and Close buttons.
    const minimizeButton = document.getElementById("minimize-button");
    const maximizeButton = document.getElementById("maximize-button");
    const closeButton = document.getElementById("close-button");
    // Add event listeners to the buttons.
    minimizeButton.addEventListener("click", () => {
        ipcRenderer.send("minimize-application");
    });
    maximizeButton.addEventListener("click", () => {
        ipcRenderer.send("maximize-application");
    });
    closeButton.addEventListener("click", () => {
        ipcRenderer.send("close-application");
    });
    // Get Started Page Listeners.
    const getStartedSignInButton = document.getElementById("get-started-sign-in-button");
    if(getStartedSignInButton != null || getStartedSignInButton != undefined){
        console.log("Get Started Sign In Button Found");
        getStartedSignInButton.addEventListener("click", () => {
            ipcRenderer.send("google-auth")
        });
    }else{
        console.log("Get Started Sign In Button Not Found");
    }
    const getStartedCheckAuthButton = document.getElementById("get-started-check-auth-button");
    if(getStartedCheckAuthButton != null || getStartedCheckAuthButton != undefined){
        console.log("Get Started Check Auth Button Found");
        getStartedCheckAuthButton.addEventListener("click", () => {
            ipcRenderer.send("exchange-token");
        });
    }else{
        console.log("Get Started Check Auth Button Not Found");
    }
    // Index Page Listeners.
    const indexSignInButton = document.getElementById("index-get-started-button");
    if(indexSignInButton != null || indexSignInButton != undefined){
        console.log("Index Sign In Button Found");
        indexSignInButton.addEventListener("click", () => {
            ipcRenderer.send("get-started");
        });
    }else{
        console.log("Index Sign In Button Not Found");
    }
});