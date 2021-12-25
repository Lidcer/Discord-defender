import { getInstalledDiscordAndCoreFiles, isSusDiscord, sanitizeDiscord, watchCoreFiles } from "./discordUtils";
import { countDown, delay } from "./utils";
import { EventEmitter } from "events";
import { Discord } from "../interfaces";
import { overrideConsole } from "./log";
import { BrowserWindow } from "@electron/remote/";
overrideConsole();
export const updateEmit = new EventEmitter();


const show = () => {
    const window = BrowserWindow.getAllWindows()[0];
    updateEmit.emit("attention");
    if (!window.isVisible()) {
        window.show();
    }
};


export let discords: Discord[] = [];
export async function perform() {
    try {
        discords = await getInstalledDiscordAndCoreFiles();
        for (const discord of discords) {
            const sus = await isSusDiscord(discord);
            if (sus) {
                try {
                    await sanitizeDiscord(discord);
                    console.info(`Sanitized discord ${discord.discord}`);
                } catch (error) {
                    console.error("Unable to sanitize discord", error);
                }
            }
        }
        watchCoreFiles(discords, async  (discord, file) => {
            const sus = await isSusDiscord(discord);
            if(sus) {
                show();
                console.warn(`===================================`);
                console.warn(`${discord.discord}: ${file}`);
                console.warn(`File has been temperate. Attempting to rollback`);
                try {
                    // Do not instantly attempt to instantly sanities!
                    await countDown(1000 * 5, (ms) => {
                        console.info(`Running cleaner in ${ms / 1000}`);
                    });
                    await sanitizeDiscord(discord).catch(() => {});
                    console.warn(`Discord has been cleaned but malware might still be running on your pc!`);
                } catch (error) {
                    console.error(`Failed!!! Do not attempt to run you discord for your own safety`);
                }
                await delay(1000 * 100);
                perform();
            }
        });
    } catch (error) {
        console.error(error);
    }
    updateEmit.emit("update", discords);
}
