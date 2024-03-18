import { appendToLog } from "./utils";

try {
    console.log("Hello, world!");
    //throw an error to test the catch block
    throw new Error("This is an error");
} catch (error) {
    console.log(error);
    //append to log file "error.log"
    await appendToLog(String(error));
    process.exit(1);
}