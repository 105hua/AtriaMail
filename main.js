const { app, BrowserWindow, ipcMain, safeStorage } = require("electron");
const path = require("node:path");
const keytar = require("keytar");
const crypto = require("crypto");
const winston = require("winston");
require("dotenv").config();

const logger = winston.createLogger({
    level: "info",
    transports: [
        new winston.transports.Console({
            format: winston.format.printf(({ timestamp, level, message }) => {
                    return `[MAIN] [${level.toUpperCase()}]: ${message}`;
            })
        })
    ]
});

const preloadLogger = winston.createLogger({
    level: "info",
    transports: [
        new winston.transports.Console({
            format: winston.format.printf(({ timestamp, level, message }) => {
                    return `[PRELOAD] [${level.toUpperCase()}]: ${message}`;
            })
        })
    ]
});

logger.info("MAIN SCRIPT");

const createWindow = () => {
    logger.info("Creating main window...");
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
    logger.info("Main window created.");
};

app.whenReady().then(() => {
    createWindow();
    logger.info("Registering active event for main window...");
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    logger.info("Active event registered.");
});

// Close the app when all windows are closed.
app.on("window-all-closed", () => {
    logger.info("All windows closed, quitting application.");
    if (process.platform !== "darwin") app.quit();
});

// IPC Minimize, Maximize and Close Events.
ipcMain.on("minimize-application", () => {
    logger.info("Minimizing application...");
    window.minimize();
    logger.info("Application minimized.");
});

ipcMain.on("maximize-application", () => {
    logger.info("Maximizing application...");
    if (window.isMaximized()) {
        logger.info("Window already maximized, unmaximizing window...");
        window.unmaximize();
    } else {
        window.maximize();
    }
    logger.info("Application (un)maximized.");
});

ipcMain.on("close-application", () => {
    logger.info("Closing application...");
    window.close();
});

// Get Started Event
ipcMain.on("get-started", () => {
    logger.info("Loading get started page into main window...");
    window.loadFile("./src/get_started/index.html");
    logger.info("Get started page loaded.");
});

// Google Auth Event

const codeVerifier = crypto.randomBytes(32).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest().toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
let authorisationCode = null;

ipcMain.on("google-auth", async () => {
    logger.info("Constructing Google Auth URL...");
    const google_auth_url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.oauth_client_id}&redirect_uri=http://localhost/oauth&scope=https%3A%2F%2Fmail.google.com%2F&access_type=offline&prompt=consent&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    logger.info("Google Auth URL constructed.");
    logger.info("Creating Google Auth Window...");
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
    logger.info("Google Auth Window created.");
    logger.info("Loading constructed auth url into Google Auth Window...");
    authWindow.loadURL(google_auth_url);
    logger.info("URL Loaded. Showing window...");
    authWindow.show();
    logger.info("Auth Window Shown.");
    logger.info("Registering close event for Google Auth Window...");
    authWindow.on("closed", () => {
        logger.info("Closed.");
    });
    logger.info("Close event registered.");
    logger.info("Registering will-redirect event for Google Auth Window...");
    authWindow.webContents.on("will-redirect", async function(event, newUrl){
        try{
            logger.info("Checking URL for Callback...")
            if(newUrl.startsWith("http://localhost/oauth")){
                logger.info("Detected Callback URL. Preventing Default Action...");
                event.preventDefault();
                logger.info("Prevented.")
                logger.info("Extracting authorisation code from callback URL...");
                const url = new URL(newUrl);
                authorisationCode = url.searchParams.get("code");
                logger.info("Extracted.");
                logger.info("Checking if authorisation code is null...");
                if(authorisationCode == null){
                    logger.warn("Authorisation Code is null.");
                    authWindow.loadFile("./src/denial/index.html");
                    setTimeout(() => {
                        authWindow.close();
                    }, 2000);
                    return false;
                }else{
                    logger.info("Authorisation Code is not null.");
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
            logger.warn(err);
            return false;
        }
    });
    logger.info("Will-redirect event registered.");
});

// Check Google Auth Event
ipcMain.on("exchange-token", async () => {
    try{
        logger.info("Preparing data for authorisation code exchange...");
        const tokenEndpoint = "https://oauth2.googleapis.com/token";
        const data = new URLSearchParams();
        data.append("grant_type", "authorization_code");
        const encryptedPassword = await keytar.getPassword("atriamail", "google-code");
        const encryptedBuffer = Buffer.from(encryptedPassword, "base64");
        authorisationCode = safeStorage.decryptString(encryptedBuffer);
        if(authorisationCode == null){
            logger.info("No Authorisation Code");
            return;
        }
        data.append("code", authorisationCode);
        data.append("redirect_uri", "http://localhost/oauth");
        data.append("client_id", process.env.oauth_client_id);
        data.append("code_verifier", codeVerifier);
        data.append("client_secret", process.env.oauth_client_secret);
        logger.info("Data prepared.");
        logger.info("Exchanging authorisation code for access and refresh tokens...");
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
                logger.info("Access and Refresh Tokens stored.");
            }else{
                logger.warn("Access and Refresh Tokens are null.");
            }
        })
        .catch(err => logger.warn("ERROR: ", err));
    }catch(err){
        logger.warn(err);
    }
});

// Preload logger event.
ipcMain.on("preload-log", (event, level, message) => {
    switch(level){
        case "info":
            preloadLogger.info(message);
            break;
        case "warn":
            preloadLogger.warn(message);
            break;
        case "error":
            preloadLogger.error(message);
            break;
        default:
            preloadLogger.info(message);
            break;
    }
});