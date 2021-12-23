export interface Discord {
    path: string;
    discord: string;
    coreFiles: DiscordCoreFiles;
}

export interface DiscordCoreFiles {
    appVersion: string,
    core: string;
}

export interface Log {
    dateFormatted: string;
    message: string;
    type: "log" | "info" | "error" | "warn" | "debug";
}
