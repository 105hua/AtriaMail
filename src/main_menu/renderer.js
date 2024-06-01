console.log("Hello from renderer.js");

const minimizeButton = document.getElementById("minimize-button");
const maximizeButton = document.getElementById("maximize-button");
const closeButton = document.getElementById("close-button");

document.body.onload = () => {
    const authStatus = window.api.checkGoogleAuth();
    if(authStatus){
        console.log("User is authenticated");
    }else{
        console.log("User is not authenticated");
    }
};

minimizeButton.addEventListener("click", () => {
    window.api.minimizeApp();
});

maximizeButton.addEventListener("click", () => {
    window.api.maximizeApp();
});

closeButton.addEventListener("click", () => {
    window.api.closeApp();
});