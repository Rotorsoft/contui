import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function readVersionFromPackageJson(): string | null {
  try {
    const packagePath = resolve(dirname(fileURLToPath(import.meta.url)), "../../package.json");
    const contents = readFileSync(packagePath, "utf8");
    const parsed = JSON.parse(contents) as { version?: string };
    return parsed.version ?? null;
  } catch {
    return null;
  }
}

export function getAppVersion(): string {
  return process.env.npm_package_version ?? readVersionFromPackageJson() ?? "unknown";
}
