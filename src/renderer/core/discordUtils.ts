import { Discord, DiscordCoreFiles } from "../interfaces";
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

            const appFolder = files.find(f => f.match(/^app-\d+\.\d+\.\d+/))!;
            resolve(join(discordPath, appFolder));
        });
    });
}

function getCoreFiles(discordPath: string) {
    return new Promise<DiscordCoreFiles[]>((resolve,reject) => {
        getAppVersionFolder(discordPath).then(result => {
            const core = join(result, "modules");
            readdir(core, async (err, files) => {
                if (err) {
                    return reject(err);
                }
                const coreFolders  = files.filter(f => f.match(/^discord_desktop_core-\d+/));
                if (!coreFolders.length) {
                    return reject("Core file was not found");
                }
                const coreFiles: DiscordCoreFiles [] = [];
                for (const coreFolder of coreFolders) {
                    const actualCoreFile = join(core, coreFolder, "discord_desktop_core");
                    try {
                        await stats(actualCoreFile);
                        coreFiles.push({
                            appVersion: result,
                            core: actualCoreFile,
                        });
                    } catch (error) {
                        console.error(error);
                    }
                }
                resolve(coreFiles);
            });
        }).catch(reject);
    });
}

function stats(path: string) {
    return new Promise<any>((resolve,reject) => {
        stat(path, (err, stats) => {
            if (err) return reject(err);
            resolve(stats);
        });
    });
}

export async function isSusDiscord(discord: Discord) {
    for (const coreFile of discord.coreFiles) {
        let content = "";
        try {
            const ctn = await readFileP(join(coreFile.core, "index.js"));
            content = ctn;
        } catch (error) {
            // Missing file;
        }
        const BREATHING_CLEARANCE = 5;
        if (content.length > EXPECTED_STRING.length + BREATHING_CLEARANCE) {
            return true;
        }
    }
    return false;
}

export function readFileP(path: string) {
    return new Promise<string>((resolve, reject) => {
        readFile(path, "utf8", (err, content) => {
            if (err) return reject(err);
            return resolve(content);
        });
    });
}

export function sanitizeDiscord(discord: Discord) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve, reject) => {
        for (const coreFile of discord.coreFiles) {
            try {
                await writeFileP(join(coreFile.core, "index.js"), EXPECTED_STRING);
            } catch (error) {
                console.error(error);
            }
        }
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
}

function writeFileP(path:string, data: string) {
    return new Promise<void>((resolve,reject)=> {
        writeFile(path, data, (err) => {
            if (err) return reject(err);
        });
        resolve();
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
        for (const coreFile of discord.coreFiles) {
            const indexJS = join(coreFile.core, "index.js");
            const exist = mapListeners.get(indexJS);
            unwatchFile(indexJS, exist);
            const fn = () => {
                onFileChange(discord, indexJS);
            };
            mapListeners.set(indexJS, fn);
            watchFile(indexJS, fn);
        }
    }
}
