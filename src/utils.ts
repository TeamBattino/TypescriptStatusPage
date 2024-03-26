import { appendFile, readFile, exists } from "node:fs/promises";
import nodemailer from "nodemailer";
/*
 * Title: Utils for the Status Page Application
 * Description: This file contains utility functions for the application.
 * Author: Florian Löw
 * Version: 1.0.0
 * Date: 8. April 2024
 */

/*
 * File Handling Logic
 */

// Append a message to a log file
export const appendToLog = async (message: string) => {
  let logPath: string = process.env.LOG_FILE ?? "status.log";
  await appendFile(logPath, `${message}\n`);
};

// Read a file and parse it as JSON
export const readFileAsJson = async (path: string) => {
  if (!(await exists(path))) throw new Error("File does not Exist");
  const data = await readFile(path, "utf-8");
  return JSON.parse(data);
};

/*
 * Service Status Logic
 */

// Service Type Definition
export type Service = {
  name: string;
  url: string;
};

export type ServiceWithStatus = Service &
  (
    | {
        status: "online" | "offline";
      }
    | {
        status: "error";
        statusCode: number;
      }
  );

async function checkService(service: Service): Promise<ServiceWithStatus> {
  try {
    const response = await fetch(service.url);
    if (response.ok)
      return {
        ...service,
        status: "online",
      };
    return {
      ...service,
      status: "error",
      statusCode: response.status,
    };
  } catch (error) {
    return {
      ...service,
      status: "offline",
    };
  }
}

// Check the status of a service, do this by sending a request to the service URL and checking the response. if the fetch fails the service is considered down.
export async function checkServices(services: Service[]) {
  return Promise.all(services.map(checkService));
}

export function filterOfflineServices(servicesWithStatus: ServiceWithStatus[]) {
  let offlineServices = servicesWithStatus.filter(
    (service) => service.status !== "online"
  );
  return offlineServices;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  logger: true,
});

export type MailContent = {
  subject: string;
  text: string;
};

export async function sendMail({ subject, text }: MailContent) {
  let info = await transporter.sendMail({
    from: `Status Notifier ${process.env.SMTP_SENDER}`, // sender address
    to: process.env.WARNING_EMAIL_RECIPIENT, // list of receivers
    subject: subject,
    text: text,
  });
  if (info.rejected.length) appendToLog("ERROR: Mail send Failed");
}
