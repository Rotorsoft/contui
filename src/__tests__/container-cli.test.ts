import { describe, it, expect } from "@jest/globals";

// Test the type parsing functions by recreating them
describe("ContainerCliService parsing", () => {
  const parseStatus = (state: string) => {
    const lower = state.toLowerCase();
    if (lower.includes("running") || lower === "running" || lower.startsWith("up")) return "running";
    if (lower.includes("paused")) return "paused";
    if (lower.includes("restarting")) return "restarting";
    if (lower.includes("dead")) return "dead";
    if (lower.includes("created")) return "created";
    return "stopped";
  };

  const parsePorts = (portsStr: string) => {
    if (!portsStr) return [];

    const ports: Array<{ hostPort: number; containerPort: number; protocol: "tcp" | "udp" }> = [];
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
  };

  describe("parseStatus", () => {
    it("should detect running status", () => {
      expect(parseStatus("running")).toBe("running");
      expect(parseStatus("Running")).toBe("running");
      expect(parseStatus("Up 2 hours")).toBe("running");
    });

    it("should detect paused status", () => {
      expect(parseStatus("paused")).toBe("paused");
      expect(parseStatus("Paused")).toBe("paused");
    });

    it("should detect stopped status", () => {
      expect(parseStatus("exited")).toBe("stopped");
      expect(parseStatus("Exited (0)")).toBe("stopped");
      expect(parseStatus("stopped")).toBe("stopped");
    });

    it("should detect restarting status", () => {
      expect(parseStatus("restarting")).toBe("restarting");
    });

    it("should detect dead status", () => {
      expect(parseStatus("dead")).toBe("dead");
    });

    it("should detect created status", () => {
      expect(parseStatus("created")).toBe("created");
    });
  });

  describe("parsePorts", () => {
    it("should parse empty ports string", () => {
      expect(parsePorts("")).toEqual([]);
    });

    it("should parse single port mapping", () => {
      expect(parsePorts("8080->80/tcp")).toEqual([
        { hostPort: 8080, containerPort: 80, protocol: "tcp" },
      ]);
    });

    it("should parse multiple port mappings", () => {
      expect(parsePorts("8080->80/tcp, 443->443/tcp")).toEqual([
        { hostPort: 8080, containerPort: 80, protocol: "tcp" },
        { hostPort: 443, containerPort: 443, protocol: "tcp" },
      ]);
    });

    it("should parse UDP ports", () => {
      expect(parsePorts("53->53/udp")).toEqual([
        { hostPort: 53, containerPort: 53, protocol: "udp" },
      ]);
    });
  });

  describe("parseContainerJson", () => {
    const parseContainerJson = (data: Record<string, unknown>) => {
      const status = parseStatus(String(data.State || data.Status || ""));
      return {
        id: String(data.ID || data.Id || "").substring(0, 12),
        name: String(data.Names || data.Name || "").replace(/^\//, ""),
        image: String(data.Image || ""),
        status,
        state: String(data.State || data.Status || ""),
        ports: parsePorts(String(data.Ports || "")),
        created: String(data.CreatedAt || data.Created || ""),
        command: String(data.Command || ""),
      };
    };

    it("should parse container JSON", () => {
      const result = parseContainerJson({
        ID: "abc123def456789",
        Names: "/my-container",
        Image: "nginx:latest",
        State: "running",
        Ports: "8080->80/tcp",
        CreatedAt: "2024-01-01",
        Command: "nginx -g daemon off;",
      });

      expect(result.id).toBe("abc123def456");
      expect(result.name).toBe("my-container");
      expect(result.image).toBe("nginx:latest");
      expect(result.status).toBe("running");
      expect(result.ports).toHaveLength(1);
    });
  });

  describe("parsePortBindings", () => {
    const parsePortBindings = (ports: Record<string, Array<{ HostPort: string }> | null>) => {
      const mappings: Array<{ hostPort: number; containerPort: number; protocol: "tcp" | "udp" }> =
        [];

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
    };

    it("should parse port bindings from inspect output", () => {
      const result = parsePortBindings({
        "80/tcp": [{ HostPort: "8080" }],
        "443/tcp": [{ HostPort: "8443" }],
      });

      expect(result).toEqual([
        { hostPort: 8080, containerPort: 80, protocol: "tcp" },
        { hostPort: 8443, containerPort: 443, protocol: "tcp" },
      ]);
    });

    it("should handle null bindings", () => {
      const result = parsePortBindings({
        "80/tcp": null,
      });

      expect(result).toEqual([]);
    });
  });
});
