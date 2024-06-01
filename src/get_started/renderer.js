console.log("Hello from renderer.js");

const minimizeButton = document.getElementById("minimize-button");
const maximizeButton = document.getElementById("maximize-button");
const closeButton = document.getElementById("close-button");
const signInButton = document.getElementById("sign-in-button");
const checkAuthButton = document.getElementById("check-auth-button");

minimizeButton.addEventListener("click", () => {
    window.api.minimizeApp();
});

maximizeButton.addEventListener("click", () => {
    window.api.maximizeApp();
});

closeButton.addEventListener("click", () => {
    window.api.closeApp();
});

signInButton.addEventListener("click", () => {
    window.api.googleAuth();
});

checkAuthButton.addEventListener("click", () => {
    window.api.exchangeToken();
});