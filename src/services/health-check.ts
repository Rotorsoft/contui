import { exec } from "child_process";
import { promisify } from "util";
import type { HealthStatus } from "../types/index.js";

const execAsync = promisify(exec);

const CLI_COMMAND = "container";

export async function checkCliInstalled(): Promise<{ installed: boolean; version?: string }> {
  try {
    const { stdout } = await execAsync(`which ${CLI_COMMAND}`);
    if (!stdout.trim()) {
      return { installed: false };
    }

    const { stdout: version } = await execAsync(`${CLI_COMMAND} --version`);
    return { installed: true, version: version.trim() };
  } catch {
    return { installed: false };
  }
}

export async function checkServiceRunning(): Promise<boolean> {
  try {
    await execAsync(`${CLI_COMMAND} info`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function performHealthCheck(): Promise<HealthStatus> {
  const cliCheck = await checkCliInstalled();

  if (!cliCheck.installed) {
    return {
      cliInstalled: false,
      serviceRunning: false,
      error:
        "The 'container' CLI is not installed. Please install it to use this application.\n\n" +
        "On macOS, you can use Homebrew:\n" +
        "  brew install container\n\n" +
        "Or download from the official website.",
    };
  }

  const serviceRunning = await checkServiceRunning();

  if (!serviceRunning) {
    return {
      cliInstalled: true,
      cliVersion: cliCheck.version,
      serviceRunning: false,
      error:
        "The container service is not running. Please start it to use this application.\n\n" +
        "You can start the service with:\n" +
        "  container system start\n\n" +
        "Or check if there are any issues with:\n" +
        "  container info",
    };
  }

  return {
    cliInstalled: true,
    cliVersion: cliCheck.version,
    serviceRunning: true,
  };
}
