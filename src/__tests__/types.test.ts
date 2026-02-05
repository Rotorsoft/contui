import type {
  Container,
  ContainerStatus,
  Image,
  Network,
  Volume,
  PortMapping,
} from "../types/index.js";

describe("Type definitions", () => {
  describe("Container type", () => {
    it("should have correct structure", () => {
      const container: Container = {
        id: "abc123",
        name: "test-container",
        image: "nginx:latest",
        status: "running",
        state: "running",
        ports: [{ hostPort: 8080, containerPort: 80, protocol: "tcp" }],
        created: "2024-01-01T00:00:00Z",
      };

      expect(container.id).toBe("abc123");
      expect(container.name).toBe("test-container");
      expect(container.status).toBe("running");
      expect(container.ports).toHaveLength(1);
    });

    it("should accept all valid container statuses", () => {
      const statuses: ContainerStatus[] = [
        "running",
        "stopped",
        "paused",
        "restarting",
        "created",
        "dead",
      ];

      statuses.forEach((status) => {
        const container: Container = {
          id: "test",
          name: "test",
          image: "test",
          status,
          state: status,
          ports: [],
          created: "",
        };
        expect(container.status).toBe(status);
      });
    });
  });

  describe("PortMapping type", () => {
    it("should have correct structure", () => {
      const portMapping: PortMapping = {
        hostPort: 8080,
        containerPort: 80,
        protocol: "tcp",
      };

      expect(portMapping.hostPort).toBe(8080);
      expect(portMapping.containerPort).toBe(80);
      expect(portMapping.protocol).toBe("tcp");
    });

    it("should accept both tcp and udp protocols", () => {
      const tcpPort: PortMapping = {
        hostPort: 80,
        containerPort: 80,
        protocol: "tcp",
      };
      const udpPort: PortMapping = {
        hostPort: 53,
        containerPort: 53,
        protocol: "udp",
      };

      expect(tcpPort.protocol).toBe("tcp");
      expect(udpPort.protocol).toBe("udp");
    });
  });

  describe("Image type", () => {
    it("should have correct structure", () => {
      const image: Image = {
        id: "sha256:abc123",
        repository: "nginx",
        tag: "latest",
        size: "142MB",
        created: "2024-01-01",
      };

      expect(image.repository).toBe("nginx");
      expect(image.tag).toBe("latest");
    });
  });

  describe("Network type", () => {
    it("should have correct structure", () => {
      const network: Network = {
        id: "net123",
        name: "my-network",
        driver: "bridge",
        scope: "local",
      };

      expect(network.name).toBe("my-network");
      expect(network.driver).toBe("bridge");
    });

    it("should allow optional ipam config", () => {
      const network: Network = {
        id: "net123",
        name: "my-network",
        driver: "bridge",
        scope: "local",
        ipam: {
          subnet: "172.17.0.0/16",
          gateway: "172.17.0.1",
        },
      };

      expect(network.ipam?.subnet).toBe("172.17.0.0/16");
    });
  });

  describe("Volume type", () => {
    it("should have correct structure", () => {
      const volume: Volume = {
        name: "my-volume",
        driver: "local",
        mountpoint: "/var/lib/volumes/my-volume",
        scope: "local",
      };

      expect(volume.name).toBe("my-volume");
      expect(volume.mountpoint).toContain("my-volume");
    });
  });
});
