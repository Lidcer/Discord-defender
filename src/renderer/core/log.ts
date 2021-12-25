import { EventEmitter } from "events";
import { Log } from "../interfaces";
import moment from "moment";

export const updateEmitLog = new EventEmitter();


export const ORIGINAL_METHODS = {
    log: console.log,
    info: console.info,
    error: console.error,
    warn: console.warn,
    debug: console.debug,
};

export const messages: Log[] = [];
const cap = 100;
export function log(message: string, type: Log["type"]) {
    const msg: Log = {
        dateFormatted: getFormattedDate(),
        message,type
    };
    while(messages.length > cap) {
        messages.shift();
    }
    messages.push(msg);

    const showMessage = `${msg.dateFormatted} ${msg.message}`;
    switch (type) {
        case "debug":
            ORIGINAL_METHODS.debug(showMessage);
            break;
        case "error":
            ORIGINAL_METHODS.error(showMessage);
            break;
        case "info":
            ORIGINAL_METHODS.info(showMessage);
            break;
        case "log":
            ORIGINAL_METHODS.log(showMessage);
            break;
        case "warn":
            ORIGINAL_METHODS.warn(showMessage);
            break;
        default:
            ORIGINAL_METHODS.log(showMessage);
            break;
    }

    updateEmitLog.emit("update", messages, msg);
}
function getFormattedDate() {
    return moment().format("YYYY-MM-DD HH:mm:ss");
}

export function overrideConsole() {
    for (const type of ["debug", "error", "info", "log", "warn"] as Log["type"][]) {
        console[type] = (...args: any[]) => {
            if (args.length === 1 && typeof args[0] === "string") {
                log(args[0], type);
            } else {
                ORIGINAL_METHODS[type](...[getFormattedDate(), ...args]);
            }
        };
    }
}
