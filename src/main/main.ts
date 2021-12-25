import "core-js/stable";
import "regenerator-runtime/runtime";
import path from "path";
import { app, BrowserWindow, shell, Tray, Menu, ipcMain } from "electron";
import { resolveHtmlPath } from "./util";
require("@electron/remote/main").initialize();

//console.log(remoteMain)

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === "production") {
    const sourceMapSupport = require("source-map-support");
    sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true";

if (isDevelopment) {
    require("electron-debug")();
}

const installExtensions = async () => {
    const installer = require("electron-devtools-installer");
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ["REACT_DEVELOPER_TOOLS"];

    return installer
        .default(
            extensions.map((name) => installer[name]),
            forceDownload
        )
        .catch(console.log);
};

const RESOURCES_PATH = app.isPackaged
? path.join(process.resourcesPath, "assets")
: path.join(__dirname, "../../assets");

const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
};


const createWindow = async () => {
    if (isDevelopment) {
        await installExtensions();
    }
    mainWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 720,
        autoHideMenuBar: true,
        frame: false,

        icon: getAssetPath("icon.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    const settings = app.getLoginItemSettings();

    require("@electron/remote/main").enable(mainWindow.webContents);
    mainWindow.loadURL(`${resolveHtmlPath("index.html")}?s=${settings.openAtLogin}`);

    mainWindow.on("ready-to-show", () => {
        if (!mainWindow) {
            throw new Error("\"mainWindow\" is not defined");
        }

        if (settings.openAtLogin) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    mainWindow.webContents.on("new-window", (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });
    return mainWindow;
};

/**
 * Add event listeners...
 */

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app
    .whenReady()
    .then(async () => {
        const win = await createWindow();
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

        let tray: Tray;
        win.on("hide", () => {
            tray = new Tray(getAssetPath("icon.png"));
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
            const value = msg.value as boolean;
            const settings = app.getLoginItemSettings();
            const enabled = settings.openAtLogin;
            if (value !== enabled) {
                if (value) {
                    app.setLoginItemSettings({openAtLogin: true});
                } else {
                    app.setLoginItemSettings({openAtLogin: false});
                }
            }
        });
    })
    .catch(console.log);
