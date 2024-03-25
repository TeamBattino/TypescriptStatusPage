import {
  appendToLog,
  checkAllServices,
  checkServices,
  readFileAsJson,
  type Service,
} from "./utils";

// Javadoc style File Header
/*
 * Title: Typescript Status Page Application Entry Point
 * Description: This is the main entry point for the application.
 * Author: Florian Löw
 * Version: 1.0.0
 * Date: 8. April 2024
 */

// Handles Errors throughout the application

const main = async () => {
  const services: Service[] = await readFileAsJson(
    process.env.SERICES_CONFIG_PATH ?? "services.json"
  );
  const status = await checkServices(services);
  await appendToLog(JSON.stringify(status));
};

try {
  await main();
  await appendToLog("Service ran successfully");
  console.info("Service ran successfully");
} catch (error) {
  await appendToLog(String(error));
  console.error(error);
}
