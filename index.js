const { app, BrowserWindow, Tray, Menu, ipcMain } = require("electron");
const remoteMain = require("@electron/remote/main");
const AutoLaunch = require("auto-launch");
const icon = "./icon.png";

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
}

const autoLaunch = new AutoLaunch({
    name: "Discord defender",
    path: app.getPath("exe"),
});

remoteMain.initialize();
function createWindow() {
    const win = new BrowserWindow({
        icon,
        autoHideMenuBar: true,
        frame: false,
        width: 800,
        height: 600,

        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: true,
        }
    });
    remoteMain.enable(win.webContents);
    win.loadFile("./index.html");
    win.webContents.on("dom-ready", async () => {
        const enabled = autoLaunch.isEnabled();

        win.webContents.executeJavaScript(`window.autoLaunch = ${enabled ? "true" : "false"};`);
        win.webContents.executeJavaScript("require('./dist/frontend/index')");
    });
    return win;
}

app.whenReady().then(() => {
    const win = createWindow();
    const context = Menu.buildFromTemplate([
        {
            label: "Show Defender", click: () => {
                win.show();
            }
        },
        {
            label: "Quit", click: () => {
                app.quit();
            }
        }
    ]);

    let tray;
    win.on("hide", () => {
        tray = new Tray("./icon.png");
        tray.setTitle("Discord defender");
        tray.setToolTip("Discord defender");
        tray.setContextMenu(context);
    });
    win.on("show", () => {
        if (tray) {
            tray.destroy();
        }
    });

    ipcMain.on("autoLaunch", (_,msg) => {
        const value = msg.value;
        const enabled = autoLaunch.isEnabled();
        if (value !== enabled) {
            if (value) {
                autoLaunch.enable();
            } else {
                autoLaunch.disable();
            }
        }
    });

});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit(); // apple duh
});
