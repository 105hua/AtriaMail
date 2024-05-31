const { app, BrowserWindow, ipcMain, safeStorage } = require("electron");
const path = require("node:path");
const keytar = require("keytar");
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

// Close the app when all windows are closed.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

// IPC Minimize, Maximize and Close Events.
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

// Get Started Event
ipcMain.on("get-started", () => {
    window.loadFile("./src/get_started/index.html");
});

// Google Auth Event
ipcMain.on("google-auth", () => {
    const google_auth_url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.oauth_client_id}&redirect_uri=http://localhost/oauth&scope=https%3A%2F%2Fmail.google.com%2F&access_type=offline&prompt=consent`;
    const authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        titleBarStyle: "hidden"
    });
    authWindow.loadURL(google_auth_url);
    authWindow.show();
    authWindow.webContents.on("will-redirect", function(event, newUrl){
        try{
            if(newUrl.startsWith("http://localhost/oauth")){
                event.preventDefault();
                const url = new URL(newUrl);
                let code = url.searchParams.get("code");
                if(code == null){
                    console.log("Access Denied");
                    authWindow.loadFile("./src/denial/index.html");
                    setTimeout(() => {
                        authWindow.close();
                    }, 2000);
                    return false;
                }else{
                    keytar.setPassword("atriamail", "google-code", safeStorage.encryptString(code).toString());
                    code = null;
                    authWindow.loadFile("./src/thanks/index.html");
                    setTimeout(() => {
                        authWindow.close();
                    }, 2000);
                    return true;
                }
            }
        }catch(err){
            console.warn(err);
            return false;
        }
    });
});

// Check Google Auth Event
ipcMain.on("check-google-auth", () => {
    keytar.getPassword("atriamail", "google-code").then((code) => {
        if(code == null){
            window.loadFile("./src/get_started/index.html");
        }else{
            window.loadFile("./src/dashboard/index.html");
        }
    });
});