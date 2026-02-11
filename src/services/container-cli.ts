import { exec } from "child_process";
import { promisify } from "util";
import type {
  Container,
  ContainerDetails,
  ContainerStatus,
  Image,
  Network,
  PortMapping,
  RunContainerOptions,
  Volume,
} from "../types/index.js";

const execAsync = promisify(exec);

const CLI_COMMAND = "container";

interface MacOSContainerJson {
  configuration: {
    id: string;
    image: {
      reference: string;
      descriptor?: { digest?: string };
    };
    publishedPorts?: Array<{
      hostPort: number;
      containerPort: number;
      proto: string;
    }>;
    initProcess?: {
      arguments?: string[];
      executable?: string;
      environment?: string[];
    };
    env?: string[];
    mounts?: Array<{
      type?: Record<string, unknown>;
      source: string;
      destination: string;
    }>;
  };
  status: string;
  startedDate?: number;
  networks?: Array<{
    ipv4Address?: string;
    ipv4Gateway?: string;
    hostname?: string;
    network?: string;
  }>;
}

interface MacOSImageJson {
  reference: string;
  fullSize: string;
  descriptor: {
    digest: string;
    annotations?: {
      "org.opencontainers.image.created"?: string;
    };
  };
}

interface MacOSNetworkJson {
  id: string;
  state: string;
  config: {
    mode: string;
    creationDate?: number;
  };
  status?: {
    ipv4Gateway?: string;
    ipv4Subnet?: string;
  };
}

interface MacOSVolumeJson {
  name: string;
  driver: string;
  source: string;
  sizeInBytes?: number;
  createdAt?: number | string; // number from ls, string from inspect
  format?: string;
}

export function buildRunArgs(options: RunContainerOptions): string {
  const args = ["run", "--detach"];

  if (options.name?.trim()) {
    args.push("--name", options.name.trim());
  }

  if (options.ports) {
    for (const port of options.ports) {
      const trimmed = port.trim();
      if (trimmed) {
        args.push("--publish", trimmed);
      }
    }
  }

  if (options.env) {
    for (const envVar of options.env) {
      const trimmed = envVar.trim();
      if (trimmed) {
        args.push("--env", trimmed);
      }
    }
  }

  args.push(options.image.trim());
  return args.join(" ");
}

export class ContainerCliService {
  private async execCommand(args: string, maxBuffer = 10 * 1024 * 1024): Promise<string> {
    try {
      const { stdout } = await execAsync(`${CLI_COMMAND} ${args}`, {
        timeout: 30000,
        maxBuffer,
      });
      return stdout.trim();
    } catch (error) {
      if (error instanceof Error) {
        const execError = error as Error & { stderr?: string; code?: number };
        throw new Error(execError.stderr || execError.message);
      }
      throw error;
    }
  }

  async listContainers(all = true): Promise<Container[]> {
    const args = all ? "ls --all --format json" : "ls --format json";
    const output = await this.execCommand(args);

    if (!output) return [];

    const containers: MacOSContainerJson[] = JSON.parse(output);
    return containers.map((c) => this.parseContainer(c));
  }

  private parseContainer(data: MacOSContainerJson): Container {
    const config = data.configuration;
    return {
      id: config.id,
      name: config.id,
      image: config.image.reference,
      status: this.parseStatus(data.status),
      state: data.status,
      ports: this.parsePublishedPorts(config.publishedPorts || []),
      created: data.startedDate ? this.formatDate(data.startedDate) : "",
      command: config.initProcess?.arguments?.join(" ") || config.initProcess?.executable || "",
    };
  }

  private parseStatus(state: string): ContainerStatus {
    const lower = state.toLowerCase();
    if (lower === "running") return "running";
    if (lower === "paused") return "paused";
    if (lower === "restarting") return "restarting";
    if (lower === "dead") return "dead";
    if (lower === "created") return "created";
    return "stopped";
  }

  private parsePublishedPorts(
    ports: Array<{ hostPort: number; containerPort: number; proto: string }>
  ): PortMapping[] {
    return ports.map((p) => ({
      hostPort: p.hostPort,
      containerPort: p.containerPort,
      protocol: (p.proto || "tcp") as "tcp" | "udp",
    }));
  }

  private formatDate(timestamp: number | string): string {
    // If it's already a string (ISO date), return it
    if (typeof timestamp === "string") {
      return timestamp;
    }
    // macOS container uses Core Foundation absolute time (seconds since Jan 1, 2001)
    const cfEpoch = new Date("2001-01-01T00:00:00Z").getTime();
    const date = new Date(cfEpoch + timestamp * 1000);
    return date.toISOString();
  }

  async runContainer(options: RunContainerOptions): Promise<void> {
    await this.execCommand(buildRunArgs(options));
  }

  async startContainer(idOrName: string): Promise<void> {
    await this.execCommand(`start ${idOrName}`);
  }

  async stopContainer(idOrName: string): Promise<void> {
    await this.execCommand(`stop ${idOrName}`);
  }

  async restartContainer(idOrName: string): Promise<void> {
    await this.execCommand(`stop ${idOrName}`);
    await this.execCommand(`start ${idOrName}`);
  }

  async removeContainer(idOrName: string, _force = false): Promise<void> {
    // macOS container CLI uses 'delete' or 'rm'
    await this.execCommand(`delete ${idOrName}`);
  }

  async getContainerLogs(idOrName: string, tail = 100): Promise<string> {
    try {
      return await this.execCommand(`logs --tail ${tail} ${idOrName}`);
    } catch {
      // logs command might not support --tail
      return await this.execCommand(`logs ${idOrName}`);
    }
  }

  async inspectContainer(idOrName: string): Promise<ContainerDetails> {
    const output = await this.execCommand(`inspect ${idOrName}`);
    const parsed = JSON.parse(output);
    // inspect returns an array
    const data: MacOSContainerJson = Array.isArray(parsed) ? parsed[0] : parsed;

    const container = this.parseContainer(data);
    return {
      ...container,
      networkSettings: {
        ipAddress: data.networks?.[0]?.ipv4Address?.split("/")[0],
        gateway: data.networks?.[0]?.ipv4Gateway,
        networks: data.networks?.reduce(
          (acc, n) => {
            if (n.network) {
              acc[n.network] = { ipAddress: n.ipv4Address?.split("/")[0] };
            }
            return acc;
          },
          {} as Record<string, { ipAddress?: string }>
        ),
      },
      config: {
        cmd: data.configuration.initProcess?.arguments,
        entrypoint: data.configuration.initProcess?.executable
          ? [data.configuration.initProcess.executable]
          : undefined,
        env: data.configuration.initProcess?.environment || data.configuration.env,
      },
      mounts: data.configuration.mounts?.map(m => ({
        type: m.type ? Object.keys(m.type)[0] || "unknown" : "unknown",
        source: m.source,
        destination: m.destination,
      })),
    };
  }

  async listImages(): Promise<Image[]> {
    const output = await this.execCommand("image ls --format json");

    if (!output) return [];

    const images: MacOSImageJson[] = JSON.parse(output);
    return images.map((img) => this.parseImage(img));
  }

  private parseImage(data: MacOSImageJson): Image {
    const [repository, tag] = this.parseImageReference(data.reference);
    return {
      id: data.descriptor.digest.substring(7, 19),
      repository,
      tag,
      size: data.fullSize,
      created: data.descriptor.annotations?.["org.opencontainers.image.created"] || "",
      reference: data.reference,
    };
  }

  private parseImageReference(reference: string): [string, string] {
    const lastColon = reference.lastIndexOf(":");
    if (lastColon === -1 || reference.includes("/", lastColon)) {
      return [reference, "latest"];
    }
    return [reference.substring(0, lastColon), reference.substring(lastColon + 1)];
  }

  async pullImage(name: string): Promise<void> {
    await this.execCommand(`image pull ${name}`);
  }

  async removeImage(idOrName: string, _force = false): Promise<void> {
    await this.execCommand(`image delete ${idOrName}`);
  }

  async inspectImage(idOrName: string): Promise<Record<string, unknown>> {
    const output = await this.execCommand(`image inspect ${idOrName}`);
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  }

  async listNetworks(): Promise<Network[]> {
    const output = await this.execCommand("network ls --format json");

    if (!output) return [];

    const networks: MacOSNetworkJson[] = JSON.parse(output);
    return networks.map((net) => ({
      id: net.id,
      name: net.id,
      driver: net.config.mode,
      scope: "local",
      ipam: {
        subnet: net.status?.ipv4Subnet,
        gateway: net.status?.ipv4Gateway,
      },
    }));
  }

  async createNetwork(name: string, _driver = "nat"): Promise<void> {
    await this.execCommand(`network create ${name}`);
  }

  async removeNetwork(idOrName: string): Promise<void> {
    await this.execCommand(`network delete ${idOrName}`);
  }

  async inspectNetwork(idOrName: string): Promise<Network> {
    const output = await this.execCommand(`network inspect ${idOrName}`);
    const parsed = JSON.parse(output);
    const data: MacOSNetworkJson = Array.isArray(parsed) ? parsed[0] : parsed;

    return {
      id: data.id,
      name: data.id,
      driver: data.config.mode,
      scope: "local",
      ipam: {
        subnet: data.status?.ipv4Subnet,
        gateway: data.status?.ipv4Gateway,
      },
    };
  }

  async listVolumes(): Promise<Volume[]> {
    const output = await this.execCommand("volume ls --format json");

    if (!output) return [];

    const volumes: MacOSVolumeJson[] = JSON.parse(output);
    return volumes.map((vol) => ({
      name: vol.name,
      driver: vol.driver,
      mountpoint: vol.source,
      scope: "local",
      created: vol.createdAt ? this.formatDate(vol.createdAt) : undefined,
    }));
  }

  async createVolume(name: string): Promise<void> {
    await this.execCommand(`volume create ${name}`);
  }

  async removeVolume(name: string, _force = false): Promise<void> {
    await this.execCommand(`volume delete ${name}`);
  }

  async inspectVolume(name: string): Promise<Volume> {
    const output = await this.execCommand(`volume inspect ${name}`);
    const parsed = JSON.parse(output);
    const data: MacOSVolumeJson = Array.isArray(parsed) ? parsed[0] : parsed;

    return {
      name: data.name,
      driver: data.driver,
      mountpoint: data.source,
      scope: "local",
      created: data.createdAt ? this.formatDate(data.createdAt) : undefined,
    };
  }

  async getVersion(): Promise<string> {
    return this.execCommand("--version");
  }

  async ping(): Promise<boolean> {
    try {
      await this.execCommand("ls");
      return true;
    } catch {
      return false;
    }
  }
}

export const containerCli = new ContainerCliService();
