import { BrowserWindow } from "@electron/remote/";

export function getFocusedWindow(cb: (win: Electron.BrowserWindow) => void) {

    const wnd = BrowserWindow.getFocusedWindow();
    if (wnd) {
        cb(wnd);
    }
}
