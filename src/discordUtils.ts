import { Discord, DiscordCoreFiles } from "./interfaces";
import { readdir, stat, readFile, writeFile, watchFile, unwatchFile } from "fs";
import { join } from "path";
import { getLocalFolder } from "./utils";
import { exec } from "child_process";

const EXPECTED_STRING = "module.exports = require('./core.asar');";


export async function getInstalledDiscordAndCoreFiles() {
    const installed = await getInstalledDiscords();

    const target = getLocalFolder();
    const discords: Discord[] = [];

    for (const discordFolder of installed) {

        const path = join(target, discordFolder);
        try {
            const coreFiles =  await getCoreFiles(path);
            discords.push({
                discord: discordFolder,
                path,
                coreFiles,
            });
        } catch (error) {
            console.error(`Unable to obtain ${discordFolder}`, error);
        }
    }
    return discords;
}
function getInstalledDiscords() {
    return new Promise<string[]>((resolve,reject) => {
        const target = getLocalFolder();
        readdir(target, (err, files) => {
            if (err)  return reject(err);
            const discordFolders = files.filter(f => f.includes("iscord") && !f.includes("defender"));
            resolve(discordFolders);
        });
    });
}

function getAppVersionFolder(discordPath: string) {
    return new Promise<string>((resolve,reject) => {
        readdir(discordPath, (err, files) => {
            if (err) return reject(err);

            const appFolder = files.find(f => f.match(/^app-\d+\.\d+\.\d+/));
            resolve(join(discordPath, appFolder));
        });
    });
}

function getCoreFiles(discordPath: string) {
    return new Promise<DiscordCoreFiles>((resolve,reject) => {
        getAppVersionFolder(discordPath).then(result => {
            const core = join(result, "modules");
            readdir(core, (err, files) => {
                if (err) {
                    return reject(err);
                }
                const coreFolder  = files.find(f => f.match(/^discord_desktop_core-\d+/));
                if (!coreFolder) {
                    return reject("Core file was not found");
                }
                const actualCoreFile = join(core, coreFolder, "discord_desktop_core");
                stat(actualCoreFile, (err) => {
                    if (err) return reject(err);
                    resolve({
                        appVersion: result,
                        core: actualCoreFile,
                    });
                });
            });
        }).catch(reject);
    });
}

export function isSusDiscord(discord: Discord) {
    return new Promise((resolve, reject) => {
        readFile(join(discord.coreFiles.core, "index.js"), "utf8", (err, content) => {
            if (err) return reject();
            const BREATHING_CLEARANCE = 5;
            const sus = content.length > EXPECTED_STRING.length + BREATHING_CLEARANCE;
            resolve(sus);
        });
    });
}

export function sanitizeDiscord(discord: Discord) {
    return new Promise<void>((resolve, reject) => {
        writeFile(join(discord.coreFiles.core, "index.js"), EXPECTED_STRING, (err) => {
            if (err) return reject(err);
            exec("tasklist", async (err, stdout) => {
                if (err) return reject(new Error("Discord directory cleaned but unable to kill discord"));
                const split = stdout.split("\n");
                const target = `${discord.discord.toLowerCase()}.exe`;
                const runningDiscords = split.filter(e => e.toLowerCase().includes(target));
                const matches= runningDiscords.map(e=> e.match(/(\d+) +(Console|Services)/));
                for (const match of matches) {
                    if (match) {
                        const pid = match[1];
                        try {
                            await execPromise(`taskkill /F /PID ${pid}`);
                        } catch (error) {
                            //console.error(error);
                        }
                    }
                }
                resolve();
            });
        });
    });
}

function execPromise(cmd: string) {
    return new Promise<string>((resolve,reject) => {
        exec(cmd, (err, stdout) => {
            if(err) return reject(err);
            resolve(stdout);
        });
    });
}
const mapListeners = new Map<string, () => void>();
export function watchCoreFiles(discords: Discord[], onFileChange: (discord: Discord, file: string) => void) {
    for (const discord of discords) {
        const indexJS = join(discord.coreFiles.core, "index.js");
        const exist = mapListeners.get(indexJS);
        unwatchFile(indexJS, exist);
        const fn = () => {
            onFileChange(discord, indexJS);
        };
        mapListeners.set(indexJS, fn);
        watchFile(indexJS, fn);
    }
}
