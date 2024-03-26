import {
  appendToLog,
  checkServices,
  filterOfflineServices,
  readFileAsJson,
  sendMail,
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

const main = async () => {
  const services: Service[] = await readFileAsJson(
    process.env.SERICES_CONFIG_PATH ?? "services.json"
  );
  const servicesWithStatus = await checkServices(services);
  await appendToLog(JSON.stringify(servicesWithStatus));
  let offlineServices = filterOfflineServices(servicesWithStatus);
  if (offlineServices.length)
    await sendMail({
      subject: `Error with: ${offlineServices
        .map((service) => service.name)
        .join(", ")}`,
      text: `The status of following isn't as expected: ${JSON.stringify(
        offlineServices
      )}`,
    });
};

// Handles Errors throughout the application
try {
  await main();
  await appendToLog("Service ran successfully");
  console.info("Service ran successfully");
} catch (error) {
  await appendToLog(String(error));
  console.error(error);
}
