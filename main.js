const { app, BrowserWindow, ipcMain, safeStorage } = require("electron");
const path = require("node:path");
const keytar = require("keytar");
const crypto = require("crypto");
require("dotenv").config();

const createWindow = () => {
    window = new BrowserWindow({
        width: 1400,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
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

const codeVerifier = crypto.randomBytes(32).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest().toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
let authorisationCode = null;

ipcMain.on("google-auth", async () => {
    const google_auth_url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.oauth_client_id}&redirect_uri=http://localhost/oauth&scope=https%3A%2F%2Fmail.google.com%2F&access_type=offline&prompt=consent&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    const authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        titleBarStyle: "hidden",
        webPreferences: {
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, "preload.js")
        }
    });
    authWindow.loadURL(google_auth_url);
    authWindow.show();
    authWindow.on("closed", () => {
        console.log("Closed.");
    });
    authWindow.webContents.on("will-redirect", async function(event, newUrl){
        try{
            if(newUrl.startsWith("http://localhost/oauth")){
                event.preventDefault();
                const url = new URL(newUrl);
                authorisationCode = url.searchParams.get("code");
                if(authorisationCode == null){
                    authWindow.loadFile("./src/denial/index.html");
                    setTimeout(() => {
                        authWindow.close();
                    }, 2000);
                    return false;
                }else{
                    keytar.setPassword("atriamail", "google-code", safeStorage.encryptString(authorisationCode).toString("base64"));
                    authorisationCode = null;
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
ipcMain.on("exchange-token", async () => {
    try{
        const tokenEndpoint = "https://oauth2.googleapis.com/token";
        const data = new URLSearchParams();
        data.append("grant_type", "authorization_code");
        const encryptedPassword = await keytar.getPassword("atriamail", "google-code");
        const encryptedBuffer = Buffer.from(encryptedPassword, "base64");
        authorisationCode = safeStorage.decryptString(encryptedBuffer);
        if(authorisationCode == null){
            console.log("No Authorisation Code");
            return;
        }
        data.append("code", authorisationCode);
        data.append("redirect_uri", "http://localhost/oauth");
        data.append("client_id", process.env.oauth_client_id);
        data.append("code_verifier", codeVerifier);
        data.append("client_secret", process.env.oauth_client_secret);
        fetch(tokenEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: data.toString()
        })
        .then(response => response.json())
        .then(data => {
            if(data.access_token != null && data.refresh_token != null){
                keytar.setPassword("atriamail", "google-access-token", safeStorage.encryptString(data.access_token).toString("base64"));
                keytar.setPassword("atriamail", "google-refresh-token", safeStorage.encryptString(data.refresh_token).toString("base64"));
                console.log("Access and Refresh Tokens have been saved securely.");
            }else{
                console.warn("Access and Refresh Tokens are null.");
            }
        })
        .catch(err => console.warn("ERROR: ", err));
    }catch(err){
        console.warn(err);
    }
});