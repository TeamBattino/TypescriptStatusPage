import { appendFile } from "node:fs/promises";

export const appendToLog = async (message: string) => {
    let logPath : string = process.env.LOG_FILE ?? "status.log";
    appendFile(logPath, `${message}\n`);
}