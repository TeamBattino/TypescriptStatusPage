import * as ssh2 from "ssh2";

import { connect } from "bun";
import { appendFile, readFile, exists } from "node:fs/promises";
import nodemailer from "nodemailer";
import SFTPClient from "ssh2-sftp-client";
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

// ServiceWithStatus Type Definition
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

// Check the status of a service, do this by sending a request to the service URL and checking the response. if the fetch fails the service is considered down.
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

// Check the status of multiple services by calling checkService for each service
export async function checkServices(services: Service[]) {
  return Promise.all(services.map(checkService));
}

// Filter Services that are offline or have an error status
export function filterOfflineServices(servicesWithStatus: ServiceWithStatus[]) {
  let offlineServices = servicesWithStatus.filter(
    (service) => service.status !== "online"
  );
  return offlineServices;
}

/*
 * Mail Logic
 */

// Mail Content Type Definition
export type MailContent = {
  subject: string;
  text: string;
};

// Mail Transporter Object
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

// Send a Mail with the given content
export async function sendMail({ subject, text }: MailContent) {
  let info = await transporter.sendMail({
    from: `Status Notifier ${process.env.SMTP_SENDER}`, // sender address
    to: process.env.WARNING_EMAIL_RECIPIENT, // list of receivers
    subject: subject,
    text: text,
  });
  if (info.rejected.length) appendToLog("WARNING: Mail send Failed");
}

/*
 * SFTP Logic
 */

const sftpConfig: SFTPClient.ConnectOptions = {
  host: process.env.SFTP_HOST,
  port: Number(process.env.SFTP_PORT),
  username: process.env.SFTP_USERNAME,
  password: process.env.SFTP_PASSWORD,
};

type WriteFileOnRemoteServerProps = {
  content: string;
  remoteFilePath: string;
};

export async function createSFTPClient() {
  return new SFTPClient();
}

export async function connectSFTP(sftpClient: SFTPClient) {
  console.log(`Connecting to ${sftpConfig.host}:${sftpConfig.port}`);
  try {
    const sftpWrapper = await sftpClient.connect(sftpConfig);
    console.log("connected");
    return sftpWrapper;
  } catch (err) {
    console.log("Failed to connect:", err);
  }
}

export async function disconnectSFTP(sftpWrapper: ssh2.SFTPWrapper) {
  await sftpWrapper.end();
}

// Write a file on a remote server
export async function writeFileOnRemoteServer({
  content,
  remoteFilePath,
}: WriteFileOnRemoteServerProps) {
  sftpWrapper.writeFile(remoteFilePath, content, {
    flag: "w",
    encoding: "utf-8",
  });
}

/*
 * Pretty Representation of ServiceWithStatus Array Builders
 */

// Build a string representation of a ServiceWithStatus
export function servicesWithStatusToString(
  servicesWithStatus: ServiceWithStatus[]
) {
  return JSON.stringify(servicesWithStatus);
}

// Build an HTML representation of a ServiceWithStatus
export function servicesWithStatusToHTML(
  servicesWithStatus: ServiceWithStatus[]
) {
  const servicesAsList = servicesWithStatus
    .map((service) => {
      switch (service.status) {
        case "offline":
        case "online":
          return `<div>
                      <h2>${service.name}<h2>
                      <p>${service.status}</p>
                    </div>`;
        case "error":
          return `<div>
                      <h2>${service.name}<h2>
                      <p>${service.status} - Code: ${service.statusCode}</p>
                    </div>`;
      }
    })
    .join();

  return `<!DOCTYPE html> 
            <html>
              <body>
                <h1>Status Page</h1>
                ${servicesAsList}
              </body>
            </html>`;
}
