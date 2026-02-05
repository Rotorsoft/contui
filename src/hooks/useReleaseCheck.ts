import { useEffect, useState } from "react";

export type ReleaseStatus = "checking" | "update-available" | "up-to-date" | "error";

export interface ReleaseCheckState {
  status: ReleaseStatus;
  latestVersion?: string;
  error?: string;
}

interface ReleaseCheckOptions {
  packageName: string;
  currentVersion: string;
}

export function isNewerVersion(currentVersion: string, latestVersion: string): boolean {
  const currentParts = currentVersion.split(".").map(Number);
  const latestParts = latestVersion.split(".").map(Number);

  if (currentParts.some((value) => Number.isNaN(value)) || latestParts.some((value) => Number.isNaN(value))) {
    return false;
  }

  const length = Math.max(currentParts.length, latestParts.length);
  for (let index = 0; index < length; index += 1) {
    const current = currentParts[index] ?? 0;
    const latest = latestParts[index] ?? 0;
    if (latest > current) return true;
    if (latest < current) return false;
  }

  return false;
}

export async function fetchLatestVersion(packageName: string): Promise<string> {
  const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
  if (!response.ok) {
    throw new Error(`Failed to fetch latest version (${response.status})`);
  }
  const payload = (await response.json()) as { version?: string };
  if (!payload.version) {
    throw new Error("Latest version not found");
  }
  return payload.version;
}

export function useReleaseCheck({ packageName, currentVersion }: ReleaseCheckOptions): ReleaseCheckState {
  const [state, setState] = useState<ReleaseCheckState>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;

    async function checkForUpdate() {
      try {
        setState({ status: "checking" });
        const latestVersion = await fetchLatestVersion(packageName);
        if (cancelled) return;

        if (currentVersion !== "unknown" && isNewerVersion(currentVersion, latestVersion)) {
          setState({ status: "update-available", latestVersion });
        } else {
          setState({ status: "up-to-date", latestVersion });
        }
      } catch (error) {
        if (cancelled) return;
        setState({ status: "error", error: error instanceof Error ? error.message : "Release check failed" });
      }
    }

    void checkForUpdate();

    return () => {
      cancelled = true;
    };
  }, [packageName, currentVersion]);

  return state;
}
