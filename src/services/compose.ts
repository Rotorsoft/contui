import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { resolve } from "path";
import { parse as parseYaml } from "yaml";
import { containerCli } from "./container-cli.js";

interface ComposePort {
  target: number;
  published: number;
  protocol?: string;
}

interface ComposeService {
  image?: string;
  container_name?: string;
  ports?: (string | ComposePort)[];
  environment?: string[] | Record<string, string | number | boolean>;
  volumes?: string[];
  networks?: string[] | Record<string, unknown>;
  depends_on?: string[] | Record<string, unknown>;
  command?: string | string[];
  entrypoint?: string | string[];
  working_dir?: string;
  labels?: string[] | Record<string, string>;
  env_file?: string | string[];
  restart?: string;
}

interface ComposeConfig {
  services: Record<string, ComposeService>;
  networks?: Record<string, unknown>;
  volumes?: Record<string, unknown>;
}

const COMPOSE_FILES = ["compose.yml", "compose.yaml", "docker-compose.yml", "docker-compose.yaml"];

function findComposeFile(dir: string): string | null {
  for (const file of COMPOSE_FILES) {
    const path = resolve(dir, file);
    if (existsSync(path)) return path;
  }
  return null;
}

async function loadComposeFile(dir: string): Promise<{ config: ComposeConfig; file: string }> {
  const file = findComposeFile(dir);
  if (!file) {
    throw new Error(
      `No compose file found. Looked for: ${COMPOSE_FILES.join(", ")}`
    );
  }
  const content = await readFile(file, "utf-8");
  let config: ComposeConfig;
  try {
    config = parseYaml(content) as ComposeConfig;
  } catch (err) {
    throw new Error(`Invalid YAML in ${file}: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!config || typeof config !== "object") {
    throw new Error(`Invalid compose file: ${file} is not a valid YAML document`);
  }
  if (!config.services || typeof config.services !== "object" || Object.keys(config.services).length === 0) {
    throw new Error("No services defined in compose file");
  }
  for (const [name, svc] of Object.entries(config.services)) {
    if (!svc.image) {
      throw new Error(`Service "${name}" has no image specified (build is not supported)`);
    }
  }
  return { config, file };
}

function projectName(dir: string): string {
  return dir.split("/").pop() || "project";
}

function containerName(project: string, service: string, svc: ComposeService): string {
  return svc.container_name || `${project}-${service}`;
}

function networkName(project: string, name: string): string {
  return `${project}-${name}`;
}

function normalizeEnv(env?: string[] | Record<string, string | number | boolean>): string[] {
  if (!env) return [];
  if (Array.isArray(env)) return env;
  return Object.entries(env).map(([k, v]) => `${k}=${v}`);
}

function normalizePorts(ports?: (string | ComposePort)[]): string[] {
  if (!ports) return [];
  return ports.map((p) => {
    if (typeof p === "string") return p;
    const proto = p.protocol ? `/${p.protocol}` : "";
    return `${p.published}:${p.target}${proto}`;
  });
}

function getServiceNetworks(svc: ComposeService): string[] {
  if (!svc.networks) return [];
  if (Array.isArray(svc.networks)) return svc.networks;
  return Object.keys(svc.networks);
}

function getDependencies(svc: ComposeService): string[] {
  if (!svc.depends_on) return [];
  if (Array.isArray(svc.depends_on)) return svc.depends_on;
  return Object.keys(svc.depends_on);
}

function topologicalSort(
  services: Record<string, ComposeService>
): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(name: string, stack: Set<string>) {
    if (visited.has(name)) return;
    if (stack.has(name)) {
      throw new Error(`Circular dependency detected involving service: ${name}`);
    }
    const svc = services[name];
    if (!svc) {
      throw new Error(`Unknown service: ${name}`);
    }
    stack.add(name);
    for (const dep of getDependencies(svc)) {
      if (!(dep in services)) {
        throw new Error(`Service "${name}" depends on unknown service "${dep}"`);
      }
      visit(dep, stack);
    }
    stack.delete(name);
    visited.add(name);
    result.push(name);
  }

  for (const name of Object.keys(services)) {
    visit(name, new Set());
  }
  return result;
}

function buildRunCommand(
  name: string,
  svc: ComposeService,
  project: string,
  composeNetworks: Record<string, unknown> | undefined
): string[] {
  const args = ["run", "--detach", "--name", name];

  // Environment variables
  for (const env of normalizeEnv(svc.environment)) {
    args.push("--env", env);
  }

  // Ports
  for (const port of normalizePorts(svc.ports)) {
    args.push("--publish", port);
  }

  // Volumes
  if (svc.volumes) {
    for (const vol of svc.volumes) {
      args.push("--volume", vol);
    }
  }

  // Networks
  const nets = getServiceNetworks(svc);
  if (nets.length > 0 && composeNetworks) {
    // Attach to the first network (container CLI supports one --network flag)
    const firstNet = nets[0];
    if (firstNet) {
      const netName = networkName(project, firstNet);
      args.push("--network", netName);
    }
  }

  // Working directory
  if (svc.working_dir) {
    args.push("--workdir", svc.working_dir);
  }

  // Entrypoint
  if (svc.entrypoint) {
    const ep = Array.isArray(svc.entrypoint) ? svc.entrypoint.join(" ") : svc.entrypoint;
    args.push("--entrypoint", ep);
  }

  // Labels
  if (svc.labels) {
    const labels = Array.isArray(svc.labels)
      ? svc.labels
      : Object.entries(svc.labels).map(([k, v]) => `${k}=${v}`);
    for (const label of labels) {
      args.push("--label", label);
    }
  }

  // Add compose tracking label
  args.push("--label", `com.contui.project=${project}`);

  // Image (validated in loadComposeFile)
  args.push(svc.image!);

  // Command
  if (svc.command) {
    const cmd = Array.isArray(svc.command) ? svc.command : svc.command.split(" ");
    args.push(...cmd);
  }

  return args;
}

export async function composeUp(dir: string): Promise<void> {
  const { config, file } = await loadComposeFile(dir);
  const project = projectName(dir);

  console.log(`Using ${file}`);
  console.log(`Project: ${project}\n`);

  // 1. Create networks
  if (config.networks) {
    for (const name of Object.keys(config.networks)) {
      const fullName = networkName(project, name);
      try {
        console.log(`Creating network ${fullName}...`);
        await containerCli.createNetwork(fullName);
        console.log(`  Network ${fullName} created`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("already exists") || msg.includes("duplicate")) {
          console.log(`  Network ${fullName} already exists`);
        } else {
          throw err;
        }
      }
    }
  }

  // 2. Create named volumes
  if (config.volumes) {
    for (const name of Object.keys(config.volumes)) {
      try {
        console.log(`Creating volume ${name}...`);
        await containerCli.createVolume(name);
        console.log(`  Volume ${name} created`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("already exists") || msg.includes("duplicate")) {
          console.log(`  Volume ${name} already exists`);
        } else {
          throw err;
        }
      }
    }
  }

  // 3. Start services in dependency order
  const order = topologicalSort(config.services);

  for (const svcName of order) {
    const svc = config.services[svcName]!;
    const cName = containerName(project, svcName, svc);

    // Pull image first
    if (svc.image) {
      try {
        console.log(`Pulling ${svc.image}...`);
        await containerCli.pullImage(svc.image);
        console.log(`  Image ${svc.image} ready`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Image might already exist locally
        if (msg.includes("already") || msg.includes("up to date")) {
          console.log(`  Image ${svc.image} already available`);
        } else {
          console.log(`  Warning: could not pull ${svc.image}: ${msg}`);
        }
      }
    }

    // Check if container already exists
    try {
      const existing = await containerCli.listContainers(true);
      const found = existing.find((c) => c.name === cName);
      if (found) {
        if (found.status === "running") {
          console.log(`Container ${cName} is already running`);
          continue;
        }
        // Remove stopped container to recreate
        console.log(`Removing existing container ${cName}...`);
        await containerCli.removeContainer(cName);
      }
    } catch {
      // listing might fail, continue anyway
    }

    // Run container
    const args = buildRunCommand(cName, svc, project, config.networks);
    console.log(`Starting ${cName}...`);
    try {
      await containerCli.execCommandPublic(args.join(" "));
      console.log(`  Container ${cName} started`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  Failed to start ${cName}: ${msg}`);
      throw err;
    }
  }

  console.log("\nAll services started.");
}

export async function composeDown(dir: string): Promise<void> {
  const { config, file } = await loadComposeFile(dir);
  const project = projectName(dir);

  console.log(`Using ${file}`);
  console.log(`Project: ${project}\n`);

  // Stop and remove containers in reverse dependency order
  const order = topologicalSort(config.services).reverse();

  for (const svcName of order) {
    const svc = config.services[svcName]!;
    const cName = containerName(project, svcName, svc);

    try {
      console.log(`Stopping ${cName}...`);
      await containerCli.stopContainer(cName);
      console.log(`  Container ${cName} stopped`);
    } catch {
      console.log(`  Container ${cName} not running`);
    }

    try {
      await containerCli.removeContainer(cName);
      console.log(`  Container ${cName} removed`);
    } catch {
      console.log(`  Container ${cName} not found`);
    }
  }

  // Remove networks
  if (config.networks) {
    for (const name of Object.keys(config.networks)) {
      const fullName = networkName(project, name);
      try {
        console.log(`Removing network ${fullName}...`);
        await containerCli.removeNetwork(fullName);
        console.log(`  Network ${fullName} removed`);
      } catch {
        console.log(`  Network ${fullName} not found`);
      }
    }
  }

  console.log("\nAll services stopped.");
}
