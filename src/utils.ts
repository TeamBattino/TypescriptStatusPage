import { appendFile, readFile } from "node:fs/promises";

export const appendToLog = async (message: string) => {
    let logPath : string = process.env.LOG_FILE ?? "status.log";
    appendFile(logPath, `${message}\n`);
}
export const readFileAsJson = async (path: string) => {
    const data = await readFile(path, "utf-8");
    return JSON.parse(data);
}