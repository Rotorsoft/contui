import { exec } from "child_process";
import { promisify } from "util";
import type {
  Container,
  ContainerDetails,
  ContainerStatus,
  Image,
  Network,
  PortMapping,
  Volume,
} from "../types/index.js";

const execAsync = promisify(exec);

const CLI_COMMAND = "container";

export class ContainerCliService {
  private async execCommand(args: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`${CLI_COMMAND} ${args}`, {
        timeout: 30000,
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
    const args = all ? "ps -a --format json" : "ps --format json";
    const output = await this.execCommand(args);

    if (!output) return [];

    return output
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => this.parseContainerJson(JSON.parse(line)));
  }

  private parseContainerJson(data: Record<string, unknown>): Container {
    const status = this.parseStatus(String(data.State || data.Status || ""));
    return {
      id: String(data.ID || data.Id || "").substring(0, 12),
      name: String(data.Names || data.Name || "").replace(/^\//, ""),
      image: String(data.Image || ""),
      status,
      state: String(data.State || data.Status || ""),
      ports: this.parsePorts(String(data.Ports || "")),
      created: String(data.CreatedAt || data.Created || ""),
      command: String(data.Command || ""),
    };
  }

  private parseStatus(state: string): ContainerStatus {
    const lower = state.toLowerCase();
    if (lower.includes("running") || lower === "running" || lower.startsWith("up")) return "running";
    if (lower.includes("paused")) return "paused";
    if (lower.includes("restarting")) return "restarting";
    if (lower.includes("dead")) return "dead";
    if (lower.includes("created")) return "created";
    return "stopped";
  }

  private parsePorts(portsStr: string): PortMapping[] {
    if (!portsStr) return [];

    const ports: PortMapping[] = [];
    const portMatches = portsStr.matchAll(/(\d+)->(\d+)\/(tcp|udp)/g);

    for (const match of portMatches) {
      const hostPort = match[1];
      const containerPort = match[2];
      const protocol = match[3];
      if (hostPort && containerPort && protocol) {
        ports.push({
          hostPort: parseInt(hostPort, 10),
          containerPort: parseInt(containerPort, 10),
          protocol: protocol as "tcp" | "udp",
        });
      }
    }

    return ports;
  }

  async startContainer(idOrName: string): Promise<void> {
    await this.execCommand(`start ${idOrName}`);
  }

  async stopContainer(idOrName: string): Promise<void> {
    await this.execCommand(`stop ${idOrName}`);
  }

  async restartContainer(idOrName: string): Promise<void> {
    await this.execCommand(`restart ${idOrName}`);
  }

  async removeContainer(idOrName: string, force = false): Promise<void> {
    const args = force ? `rm -f ${idOrName}` : `rm ${idOrName}`;
    await this.execCommand(args);
  }

  async getContainerLogs(idOrName: string, tail = 100): Promise<string> {
    return this.execCommand(`logs --tail ${tail} ${idOrName}`);
  }

  async inspectContainer(idOrName: string): Promise<ContainerDetails> {
    const output = await this.execCommand(`inspect ${idOrName}`);
    const data = JSON.parse(output);
    const containerData = Array.isArray(data) ? data[0] : data;

    return {
      id: String(containerData.Id || "").substring(0, 12),
      name: String(containerData.Name || "").replace(/^\//, ""),
      image: String(containerData.Config?.Image || containerData.Image || ""),
      status: this.parseStatus(String(containerData.State?.Status || "")),
      state: String(containerData.State?.Status || ""),
      ports: this.parsePortBindings(containerData.NetworkSettings?.Ports || {}),
      created: String(containerData.Created || ""),
      command: Array.isArray(containerData.Config?.Cmd)
        ? containerData.Config.Cmd.join(" ")
        : String(containerData.Config?.Cmd || ""),
      networkSettings: {
        ipAddress: containerData.NetworkSettings?.IPAddress,
        gateway: containerData.NetworkSettings?.Gateway,
        networks: containerData.NetworkSettings?.Networks,
      },
      mounts: containerData.Mounts,
      config: {
        env: containerData.Config?.Env,
        workingDir: containerData.Config?.WorkingDir,
        entrypoint: containerData.Config?.Entrypoint,
        cmd: containerData.Config?.Cmd,
      },
    };
  }

  private parsePortBindings(ports: Record<string, Array<{ HostPort: string }> | null>): PortMapping[] {
    const mappings: PortMapping[] = [];

    for (const [containerPort, hostBindings] of Object.entries(ports)) {
      if (!hostBindings) continue;

      const [port, protocol] = containerPort.split("/");
      for (const binding of hostBindings) {
        if (port && binding.HostPort) {
          mappings.push({
            hostPort: parseInt(binding.HostPort, 10),
            containerPort: parseInt(port, 10),
            protocol: (protocol || "tcp") as "tcp" | "udp",
          });
        }
      }
    }

    return mappings;
  }

  async listImages(): Promise<Image[]> {
    const output = await this.execCommand("images --format json");

    if (!output) return [];

    return output
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const data = JSON.parse(line);
        return {
          id: String(data.ID || data.Id || "").substring(0, 12),
          repository: String(data.Repository || "<none>"),
          tag: String(data.Tag || "<none>"),
          size: String(data.Size || ""),
          created: String(data.CreatedAt || data.CreatedSince || ""),
        };
      });
  }

  async pullImage(name: string): Promise<void> {
    await this.execCommand(`pull ${name}`);
  }

  async removeImage(idOrName: string, force = false): Promise<void> {
    const args = force ? `rmi -f ${idOrName}` : `rmi ${idOrName}`;
    await this.execCommand(args);
  }

  async inspectImage(idOrName: string): Promise<Record<string, unknown>> {
    const output = await this.execCommand(`image inspect ${idOrName}`);
    const data = JSON.parse(output);
    return Array.isArray(data) ? data[0] : data;
  }

  async listNetworks(): Promise<Network[]> {
    const output = await this.execCommand("network ls --format json");

    if (!output) return [];

    return output
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const data = JSON.parse(line);
        return {
          id: String(data.ID || data.Id || "").substring(0, 12),
          name: String(data.Name || ""),
          driver: String(data.Driver || ""),
          scope: String(data.Scope || ""),
        };
      });
  }

  async createNetwork(name: string, driver = "bridge"): Promise<void> {
    await this.execCommand(`network create --driver ${driver} ${name}`);
  }

  async removeNetwork(idOrName: string): Promise<void> {
    await this.execCommand(`network rm ${idOrName}`);
  }

  async inspectNetwork(idOrName: string): Promise<Network> {
    const output = await this.execCommand(`network inspect ${idOrName}`);
    const data = JSON.parse(output);
    const networkData = Array.isArray(data) ? data[0] : data;

    return {
      id: String(networkData.Id || "").substring(0, 12),
      name: String(networkData.Name || ""),
      driver: String(networkData.Driver || ""),
      scope: String(networkData.Scope || ""),
      ipam: {
        subnet: networkData.IPAM?.Config?.[0]?.Subnet,
        gateway: networkData.IPAM?.Config?.[0]?.Gateway,
      },
    };
  }

  async listVolumes(): Promise<Volume[]> {
    const output = await this.execCommand("volume ls --format json");

    if (!output) return [];

    return output
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const data = JSON.parse(line);
        return {
          name: String(data.Name || ""),
          driver: String(data.Driver || ""),
          mountpoint: String(data.Mountpoint || ""),
          scope: String(data.Scope || "local"),
        };
      });
  }

  async createVolume(name: string): Promise<void> {
    await this.execCommand(`volume create ${name}`);
  }

  async removeVolume(name: string, force = false): Promise<void> {
    const args = force ? `volume rm -f ${name}` : `volume rm ${name}`;
    await this.execCommand(args);
  }

  async inspectVolume(name: string): Promise<Volume> {
    const output = await this.execCommand(`volume inspect ${name}`);
    const data = JSON.parse(output);
    const volumeData = Array.isArray(data) ? data[0] : data;

    return {
      name: String(volumeData.Name || ""),
      driver: String(volumeData.Driver || ""),
      mountpoint: String(volumeData.Mountpoint || ""),
      scope: String(volumeData.Scope || "local"),
      created: String(volumeData.CreatedAt || ""),
    };
  }

  async getVersion(): Promise<string> {
    return this.execCommand("--version");
  }

  async ping(): Promise<boolean> {
    try {
      await this.execCommand("info");
      return true;
    } catch {
      return false;
    }
  }
}

export const containerCli = new ContainerCliService();
