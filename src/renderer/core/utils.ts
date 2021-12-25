import { userInfo } from "os";
import { join } from "path";

export function username() {
    return userInfo().username;
}

export function getLocalFolder() {
    const homedir =  userInfo().homedir;
    return join(homedir, "AppData", "Local");
}

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function countDown(ms: number, onSecond: (ms: number) => void) {
    while(ms >> 0) {
        ms -= 1000;
        onSecond(ms);
        await delay(1000);
    }
}

