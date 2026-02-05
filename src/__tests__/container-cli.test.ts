// Test the type parsing functions by recreating them for macOS container CLI
describe("ContainerCliService parsing (macOS)", () => {
  const parseStatus = (state: string) => {
    const lower = state.toLowerCase();
    if (lower === "running") return "running";
    if (lower === "paused") return "paused";
    if (lower === "restarting") return "restarting";
    if (lower === "dead") return "dead";
    if (lower === "created") return "created";
    return "stopped";
  };

  const parsePublishedPorts = (
    ports: Array<{ hostPort: number; containerPort: number; proto: string }>
  ) => {
    return ports.map((p) => ({
      hostPort: p.hostPort,
      containerPort: p.containerPort,
      protocol: (p.proto || "tcp") as "tcp" | "udp",
    }));
  };

  const formatDate = (timestamp: number): string => {
    // macOS container uses Core Foundation absolute time (seconds since Jan 1, 2001)
    const cfEpoch = new Date("2001-01-01T00:00:00Z").getTime();
    const date = new Date(cfEpoch + timestamp * 1000);
    return date.toISOString();
  };

  const parseImageReference = (reference: string): [string, string] => {
    const lastColon = reference.lastIndexOf(":");
    if (lastColon === -1 || reference.includes("/", lastColon)) {
      return [reference, "latest"];
    }
    return [reference.substring(0, lastColon), reference.substring(lastColon + 1)];
  };

  describe("parseStatus", () => {
    it("should detect running status", () => {
      expect(parseStatus("running")).toBe("running");
      expect(parseStatus("Running")).toBe("running");
    });

    it("should detect paused status", () => {
      expect(parseStatus("paused")).toBe("paused");
      expect(parseStatus("Paused")).toBe("paused");
    });

    it("should detect stopped status", () => {
      expect(parseStatus("stopped")).toBe("stopped");
      expect(parseStatus("exited")).toBe("stopped");
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

  describe("parsePublishedPorts", () => {
    it("should parse empty ports array", () => {
      expect(parsePublishedPorts([])).toEqual([]);
    });

    it("should parse single port mapping", () => {
      expect(
        parsePublishedPorts([{ hostPort: 8080, containerPort: 80, proto: "tcp" }])
      ).toEqual([{ hostPort: 8080, containerPort: 80, protocol: "tcp" }]);
    });

    it("should parse multiple port mappings", () => {
      expect(
        parsePublishedPorts([
          { hostPort: 8080, containerPort: 80, proto: "tcp" },
          { hostPort: 443, containerPort: 443, proto: "tcp" },
        ])
      ).toEqual([
        { hostPort: 8080, containerPort: 80, protocol: "tcp" },
        { hostPort: 443, containerPort: 443, protocol: "tcp" },
      ]);
    });

    it("should parse UDP ports", () => {
      expect(
        parsePublishedPorts([{ hostPort: 53, containerPort: 53, proto: "udp" }])
      ).toEqual([{ hostPort: 53, containerPort: 53, protocol: "udp" }]);
    });
  });

  describe("formatDate", () => {
    it("should convert Core Foundation timestamp to ISO string", () => {
      // Example: 791908133.39752 should be around Feb 4, 2026
      const result = formatDate(791908133.39752);
      expect(result).toContain("2026");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should handle zero timestamp", () => {
      const result = formatDate(0);
      expect(result).toBe("2001-01-01T00:00:00.000Z");
    });
  });

  describe("parseImageReference", () => {
    it("should parse simple image:tag", () => {
      expect(parseImageReference("nginx:latest")).toEqual(["nginx", "latest"]);
      expect(parseImageReference("redis:7.0")).toEqual(["redis", "7.0"]);
    });

    it("should parse registry/image:tag", () => {
      expect(parseImageReference("docker.io/library/nginx:latest")).toEqual([
        "docker.io/library/nginx",
        "latest",
      ]);
    });

    it("should handle image without tag", () => {
      expect(parseImageReference("nginx")).toEqual(["nginx", "latest"]);
    });

    it("should handle complex references with port numbers", () => {
      expect(parseImageReference("localhost:5000/myimage:v1")).toEqual([
        "localhost:5000/myimage",
        "v1",
      ]);
    });
  });

  describe("parseContainer (macOS format)", () => {
    const parseContainer = (data: {
      configuration: {
        id: string;
        image: { reference: string };
        publishedPorts?: Array<{ hostPort: number; containerPort: number; proto: string }>;
        initProcess?: { arguments?: string[]; executable?: string };
      };
      status: string;
      startedDate?: number;
    }) => {
      const config = data.configuration;
      return {
        id: config.id,
        name: config.id,
        image: config.image.reference,
        status: parseStatus(data.status),
        state: data.status,
        ports: parsePublishedPorts(config.publishedPorts || []),
        created: data.startedDate ? formatDate(data.startedDate) : "",
        command:
          config.initProcess?.arguments?.join(" ") || config.initProcess?.executable || "",
      };
    };

    it("should parse macOS container JSON", () => {
      const result = parseContainer({
        configuration: {
          id: "cw-pg",
          image: { reference: "cw-postgres:latest" },
          publishedPorts: [{ hostPort: 5432, containerPort: 5432, proto: "tcp" }],
          initProcess: { executable: "docker-entrypoint.sh", arguments: ["postgres"] },
        },
        status: "running",
        startedDate: 791908133.39752,
      });

      expect(result.id).toBe("cw-pg");
      expect(result.name).toBe("cw-pg");
      expect(result.image).toBe("cw-postgres:latest");
      expect(result.status).toBe("running");
      expect(result.ports).toHaveLength(1);
      expect(result.ports[0]).toEqual({ hostPort: 5432, containerPort: 5432, protocol: "tcp" });
      expect(result.command).toBe("postgres");
    });

    it("should handle stopped container without startedDate", () => {
      const result = parseContainer({
        configuration: {
          id: "stopped-container",
          image: { reference: "nginx:latest" },
        },
        status: "stopped",
      });

      expect(result.id).toBe("stopped-container");
      expect(result.status).toBe("stopped");
      expect(result.created).toBe("");
      expect(result.ports).toEqual([]);
    });
  });

  describe("parseImage (macOS format)", () => {
    const parseImage = (data: {
      reference: string;
      fullSize: string;
      descriptor: {
        digest: string;
        annotations?: { "org.opencontainers.image.created"?: string };
      };
    }) => {
      const [repository, tag] = parseImageReference(data.reference);
      return {
        id: data.descriptor.digest.substring(7, 19),
        repository,
        tag,
        size: data.fullSize,
        created: data.descriptor.annotations?.["org.opencontainers.image.created"] || "",
      };
    };

    it("should parse macOS image JSON", () => {
      const result = parseImage({
        reference: "docker.io/library/nginx:latest",
        fullSize: "142.5 MB",
        descriptor: {
          digest: "sha256:abc123def456789xyz",
          annotations: { "org.opencontainers.image.created": "2024-01-01T00:00:00Z" },
        },
      });

      expect(result.id).toBe("abc123def456");
      expect(result.repository).toBe("docker.io/library/nginx");
      expect(result.tag).toBe("latest");
      expect(result.size).toBe("142.5 MB");
      expect(result.created).toBe("2024-01-01T00:00:00Z");
    });
  });

  describe("parseNetwork (macOS format)", () => {
    it("should parse macOS network JSON", () => {
      const data = {
        id: "cw-net",
        state: "running",
        config: { mode: "nat" },
        status: { ipv4Gateway: "192.168.65.1", ipv4Subnet: "192.168.65.0/24" },
      };

      const result = {
        id: data.id,
        name: data.id,
        driver: data.config.mode,
        scope: "local",
        ipam: {
          subnet: data.status?.ipv4Subnet,
          gateway: data.status?.ipv4Gateway,
        },
      };

      expect(result.id).toBe("cw-net");
      expect(result.name).toBe("cw-net");
      expect(result.driver).toBe("nat");
      expect(result.ipam?.subnet).toBe("192.168.65.0/24");
      expect(result.ipam?.gateway).toBe("192.168.65.1");
    });
  });

  describe("parseVolume (macOS format)", () => {
    it("should parse macOS volume JSON", () => {
      const data = {
        name: "cw-pg-data",
        driver: "local",
        source: "/Users/roger/Library/Application Support/com.apple.container/volumes/cw-pg-data/volume.img",
        sizeInBytes: 549755813888,
        createdAt: 791908128.263286,
        format: "ext4",
      };

      const result = {
        name: data.name,
        driver: data.driver,
        mountpoint: data.source,
        scope: "local",
        created: data.createdAt ? formatDate(data.createdAt) : undefined,
      };

      expect(result.name).toBe("cw-pg-data");
      expect(result.driver).toBe("local");
      expect(result.mountpoint).toContain("cw-pg-data");
      expect(result.created).toContain("2026");
    });
  });
});
