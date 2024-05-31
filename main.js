const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
require("dotenv").config();

let window = null;

const createWindow = () => {
    window = new BrowserWindow({
        width: 1400,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: true
        },
        titleBarStyle: "hidden",
        minWidth: 1400,
        minHeight: 700
    });
    window.loadFile('./src/index/index.html');
};

app.whenReady().then(() => {
    // Create the window when app is ready.
    createWindow();
    // Create a new window when the app is activated.
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit the app when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

ipcMain.on("minimize-application", () => {
    window.minimize();
});

ipcMain.on("maximize-application", () => {
    if (window.isMaximized()) {
        window.unmaximize();
    } else {
        window.maximize();
    }
});

ipcMain.on("close-application", () => {
    window.close();
});

ipcMain.on("get-started", () => {
    window.loadFile("./src/get_started/index.html");
});

ipcMain.on("google-authenticate", (event, arg) => {
    passport.use(new GoogleStrategy({
        clientID: process.env.oauth_client_id,
        clientSecret: process.env.oauth_client_secret
    }, (accessToken, refreshToken, profile, done) => {
        console.log("Profile: ", profile);
        return done(null, profile);
    }));
});