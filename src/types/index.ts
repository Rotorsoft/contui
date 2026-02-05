export interface Container {
  id: string;
  name: string;
  image: string;
  status: ContainerStatus;
  state: string;
  ports: PortMapping[];
  created: string;
  command?: string;
}

export type ContainerStatus = "running" | "stopped" | "paused" | "restarting" | "created" | "dead";

export interface PortMapping {
  hostPort: number;
  containerPort: number;
  protocol: "tcp" | "udp";
}

export interface Image {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
  reference: string; // Full reference for CLI commands
}

export interface Network {
  id: string;
  name: string;
  driver: string;
  scope: string;
  ipam?: {
    subnet?: string;
    gateway?: string;
  };
}

export interface Volume {
  name: string;
  driver: string;
  mountpoint: string;
  scope: string;
  created?: string;
}

export interface ContainerDetails extends Container {
  networkSettings?: {
    ipAddress?: string;
    gateway?: string;
    networks?: Record<string, { ipAddress?: string }>;
  };
  mounts?: Array<{
    type: string;
    source: string;
    destination: string;
  }>;
  config?: {
    env?: string[];
    workingDir?: string;
    entrypoint?: string[];
    cmd?: string[];
  };
}

export interface HealthStatus {
  cliInstalled: boolean;
  cliVersion?: string;
  serviceRunning: boolean;
  error?: string;
}

export type Tab = "containers" | "images" | "networks" | "volumes";

export interface AppState {
  activeTab: Tab;
  selectedIndex: number;
  searchQuery: string;
  showHelp: boolean;
  showLogs: boolean;
  showInspect: boolean;
  error?: string;
  loading: boolean;
}
