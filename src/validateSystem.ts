export function validateSystem() {
    if (process.platform !== "win32") {
        console.error("This program is designed to run on Window operating system. Exiting!");
        process.exit(1);
    }
}
