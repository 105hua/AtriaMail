const { ipcRenderer, contextBridge } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    }
    for (const dependency of ["chrome", "node", "electron"]) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
});

contextBridge.exposeInMainWorld("api", {
    minimizeApp: () => ipcRenderer.send("minimize-application"),
    maximizeApp: () => ipcRenderer.send("maximize-application"),
    closeApp: () => ipcRenderer.send("close-application")
});