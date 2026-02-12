import React, { useState, useCallback, useMemo } from "react";
import { Box, Text, useApp } from "ink";
import Spinner from "ink-spinner";
import { TabBar } from "./TabBar.js";
import { StatusBar } from "./StatusBar.js";
import { HelpOverlay } from "./HelpOverlay.js";
import { SearchInput } from "./SearchInput.js";
import { ContainersView } from "./ContainersView.js";
import { ImagesView } from "./ImagesView.js";
import { NetworksView } from "./NetworksView.js";
import { VolumesView } from "./VolumesView.js";
import { DetailView } from "./DetailView.js";
import { LogsView } from "./LogsView.js";
import { ConfirmDialog } from "./ConfirmDialog.js";
import { CreateDialog } from "./CreateDialog.js";
import { PullDialog } from "./PullDialog.js";
import { RunContainerDialog } from "./RunContainerDialog.js";
import { useContainerData } from "../hooks/useContainerData.js";
import { useKeyboard } from "../hooks/useKeyboard.js";
import { useReleaseCheck } from "../hooks/useReleaseCheck.js";
import { containerCli } from "../services/container-cli.js";
import { getAppVersion } from "../utils/app-version.js";
import type { RunContainerOptions, Tab } from "../types/index.js";

type DialogType = "confirm" | "create" | "pull" | "run" | "logs" | "inspect" | null;

const APP_VERSION = getAppVersion();

// Truncate large objects to prevent rendering performance issues
function truncateData(obj: unknown, maxDepth = 4, maxArrayLength = 20, maxStringLength = 200): unknown {
  if (maxDepth <= 0) return "[truncated]";

  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return obj.length > maxStringLength ? obj.substring(0, maxStringLength) + "..." : obj;
  }

  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    const truncated = obj.slice(0, maxArrayLength).map(item => truncateData(item, maxDepth - 1, maxArrayLength, maxStringLength));
    if (obj.length > maxArrayLength) {
      truncated.push(`[...${obj.length - maxArrayLength} more items]`);
    }
    return truncated;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = truncateData(value, maxDepth - 1, maxArrayLength, maxStringLength);
  }
  return result;
}

interface DialogState {
  type: DialogType;
  message?: string;
  action?: () => Promise<void>;
  data?: Record<string, unknown>;
  logs?: string;
  containerName?: string;
  createType?: "network" | "volume";
  initialValues?: { image?: string; name?: string; ports?: string; env?: string };
  editContainerId?: string;
}

export function App(): React.ReactElement {
  const { exit } = useApp();
  const { containers, images, networks, volumes, loading, error, refresh } = useContainerData();
  const releaseStatus = useReleaseCheck({ packageName: "@rotorsoft/contui", currentVersion: APP_VERSION });

  const [activeTab, setActiveTab] = useState<Tab>("containers");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ type: null });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const sortedContainers = useMemo(
    () =>
      containers
        .filter(
          (c) =>
            !searchQuery ||
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.image.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.status.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [containers, searchQuery]
  );

  const sortedImages = useMemo(
    () =>
      images
        .filter(
          (img) =>
            !searchQuery ||
            img.repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
            img.tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => a.repository.localeCompare(b.repository)),
    [images, searchQuery]
  );

  const sortedNetworks = useMemo(
    () =>
      networks
        .filter(
          (net) =>
            !searchQuery ||
            net.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            net.driver.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [networks, searchQuery]
  );

  const sortedVolumes = useMemo(
    () =>
      volumes
        .filter(
          (vol) =>
            !searchQuery ||
            vol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vol.driver.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [volumes, searchQuery]
  );

  const getItemCount = useCallback((): number => {
    switch (activeTab) {
      case "containers":
        return sortedContainers.length;
      case "images":
        return sortedImages.length;
      case "networks":
        return sortedNetworks.length;
      case "volumes":
        return sortedVolumes.length;
      default:
        return 0;
    }
  }, [activeTab, sortedContainers.length, sortedImages.length, sortedNetworks.length, sortedVolumes.length]);

  const handleQuit = useCallback(() => {
    exit();
  }, [exit]);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setSelectedIndex(0);
    setSearchQuery("");
    setActionError(null);
  }, []);

  const handleNavigate = useCallback(
    (direction: "up" | "down") => {
      setActionError(null);
      const count = getItemCount();
      if (count === 0) return;

      setSelectedIndex((prev: number) => {
        if (direction === "up") {
          return prev > 0 ? prev - 1 : count - 1;
        } else {
          return prev < count - 1 ? prev + 1 : 0;
        }
      });
    },
    [getItemCount]
  );

  const handleSelect = useCallback(async () => {
    setActionError(null);
    try {
      let inspectData: Record<string, unknown> = {};

      switch (activeTab) {
        case "containers": {
          const container = sortedContainers[selectedIndex];
          if (!container) return;
          const details = await containerCli.inspectContainer(container.id);
          const curated: Record<string, unknown> = {
            id: details.id,
            image: details.image,
            status: details.state,
            created: details.created,
            command: details.command || undefined,
            entrypoint: details.config?.entrypoint || undefined,
            env: details.config?.env || undefined,
            ports: details.ports.length > 0
              ? details.ports.map(p => `${p.hostPort}:${p.containerPort}/${p.protocol}`)
              : undefined,
            network: details.networkSettings?.ipAddress
              ? { ip: details.networkSettings.ipAddress, gateway: details.networkSettings.gateway }
              : undefined,
            mounts: details.mounts?.length ? details.mounts : undefined,
          };
          inspectData = Object.fromEntries(Object.entries(curated).filter(([, v]) => v !== undefined));
          break;
        }
        case "images": {
          const image = sortedImages[selectedIndex];
          if (!image) return;
          inspectData = await containerCli.inspectImage(image.reference);
          break;
        }
        case "networks": {
          const network = sortedNetworks[selectedIndex];
          if (!network) return;
          inspectData = (await containerCli.inspectNetwork(
            network.id
          )) as unknown as Record<string, unknown>;
          break;
        }
        case "volumes": {
          const volume = sortedVolumes[selectedIndex];
          if (!volume) return;
          inspectData = (await containerCli.inspectVolume(
            volume.name
          )) as unknown as Record<string, unknown>;
          break;
        }
      }

      setDialog({
        type: "inspect",
        data: activeTab === "containers" ? inspectData : truncateData(inspectData) as Record<string, unknown>,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to inspect");
    }
  }, [activeTab, selectedIndex, sortedContainers, sortedImages, sortedNetworks, sortedVolumes]);

  const handleBack = useCallback(() => {
    setActionError(null);
    if (searchMode) {
      setSearchMode(false);
      setSearchInput("");
    } else if (dialog.type) {
      setDialog({ type: null, data: undefined, logs: undefined });
    } else if (showHelp) {
      setShowHelp(false);
    }
  }, [searchMode, dialog.type, showHelp]);

  const handleSearch = useCallback(() => {
    setActionError(null);
    setSearchMode(true);
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = useCallback(() => {
    setSearchQuery(searchInput);
    setSearchMode(false);
    setSelectedIndex(0);
  }, [searchInput]);

  const handleHelp = useCallback(() => {
    setActionError(null);
    setShowHelp((prev: boolean) => !prev);
  }, []);

  const handleRefresh = useCallback(async () => {
    setActionError(null);
    await refresh();
  }, [refresh]);

  const getItemIdentifiers = useCallback(() => {
    switch (activeTab) {
      case "containers": {
        const c = sortedContainers[selectedIndex];
        return c ? { id: c.id, name: c.name } : null;
      }
      case "images": {
        const i = sortedImages[selectedIndex];
        return i ? { id: i.reference, name: `${i.repository}:${i.tag}` } : null;
      }
      case "networks": {
        const n = sortedNetworks[selectedIndex];
        return n ? { id: n.id, name: n.name } : null;
      }
      case "volumes": {
        const v = sortedVolumes[selectedIndex];
        return v ? { id: v.name, name: v.name } : null;
      }
      default:
        return null;
    }
  }, [activeTab, selectedIndex, sortedContainers, sortedImages, sortedNetworks, sortedVolumes]);

  const handleAction = useCallback(
    async (action: string) => {
      setActionError(null);

      if (action === "pull" && activeTab === "images") {
        setDialog({ type: "pull" });
        return;
      }

      if (action === "create") {
        if (activeTab === "networks" || activeTab === "volumes") {
          setDialog({
            type: "create",
            createType: activeTab === "networks" ? "network" : "volume",
          });
        } else if (activeTab === "containers" || activeTab === "images") {
          const image =
            activeTab === "images" ? sortedImages[selectedIndex]?.reference : undefined;
          setDialog({ type: "run", initialValues: image ? { image } : undefined });
        }
        return;
      }

      if (action === "edit" && activeTab === "containers") {
        const container = sortedContainers[selectedIndex];
        if (!container) return;
        try {
          setActionInProgress("Loading container settings...");
          const details = await containerCli.inspectContainer(container.id);
          setActionInProgress(null);
          const ports = details.ports
            .map((p) => `${p.hostPort}:${p.containerPort}`)
            .join(", ");
          const env = details.config?.env?.join(", ") ?? "";
          setDialog({
            type: "run",
            initialValues: {
              image: details.image,
              name: details.name,
              ports,
              env,
            },
            editContainerId: container.id,
          });
        } catch (err) {
          setActionInProgress(null);
          setActionError(err instanceof Error ? err.message : "Failed to inspect container");
        }
        return;
      }

      const identifiers = getItemIdentifiers();
      if (!identifiers) return;

      const { id: itemId, name: itemName } = identifiers;

      try {
        switch (action) {
          case "start":
            if (activeTab === "containers") {
              setActionInProgress(`Starting ${itemName}...`);
              await containerCli.startContainer(itemId);
              await refresh();
              setActionInProgress(null);
            }
            break;

          case "stop":
            if (activeTab === "containers") {
              setActionInProgress(`Stopping ${itemName}...`);
              await containerCli.stopContainer(itemId);
              await refresh();
              setActionInProgress(null);
            }
            break;

          case "restart":
            if (activeTab === "containers") {
              setActionInProgress(`Restarting ${itemName}...`);
              await containerCli.restartContainer(itemId);
              await refresh();
              setActionInProgress(null);
            }
            break;

          case "delete":
            setDialog({
              type: "confirm",
              message: `Are you sure you want to delete ${itemName}?`,
              action: async () => {
                setActionInProgress(`Deleting ${itemName}...`);
                switch (activeTab) {
                  case "containers":
                    await containerCli.removeContainer(itemId, true);
                    break;
                  case "images":
                    await containerCli.removeImage(itemId, true);
                    break;
                  case "networks":
                    await containerCli.removeNetwork(itemId);
                    break;
                  case "volumes":
                    await containerCli.removeVolume(itemName, true);
                    break;
                }
                await refresh();
                setSelectedIndex((prev: number) => Math.max(0, prev - 1));
                setActionInProgress(null);
              },
            });
            break;

          case "logs":
            if (activeTab === "containers") {
              setActionInProgress(`Fetching logs...`);
              const logs = await containerCli.getContainerLogs(itemId);
              setActionInProgress(null);
              setDialog({ type: "logs", logs, containerName: itemName });
            }
            break;

          case "inspect":
            setActionInProgress(`Loading details...`);
            await handleSelect();
            setActionInProgress(null);
            break;
        }
      } catch (err) {
        setActionInProgress(null);
        setActionError(err instanceof Error ? err.message : "Action failed");
      }
    },
    [getItemIdentifiers, activeTab, refresh, handleSelect, sortedImages, selectedIndex, sortedContainers]
  );

  const handleConfirm = useCallback(async () => {
    if (dialog.action) {
      try {
        await dialog.action();
      } catch (err) {
        setActionInProgress(null);
        setActionError(err instanceof Error ? err.message : "Action failed");
      }
    }
    setDialog({ type: null, data: undefined, logs: undefined });
  }, [dialog]);

  const handlePullConfirm = useCallback(
    async (imageName: string) => {
      setDialog({ type: null, data: undefined, logs: undefined });
      setActionInProgress(`Pulling ${imageName}...`);
      try {
        await containerCli.pullImage(imageName);
        await refresh();
        setActionInProgress(null);
      } catch (err) {
        setActionInProgress(null);
        setActionError(err instanceof Error ? err.message : "Failed to pull image");
      }
    },
    [refresh]
  );

  const handleCreateConfirm = useCallback(
    async (name: string) => {
      setDialog({ type: null, data: undefined, logs: undefined });
      setActionInProgress(`Creating ${name}...`);
      try {
        if (dialog.createType === "network") {
          await containerCli.createNetwork(name);
        } else {
          await containerCli.createVolume(name);
        }
        await refresh();
        setActionInProgress(null);
      } catch (err) {
        setActionInProgress(null);
        setActionError(err instanceof Error ? err.message : "Failed to create");
      }
    },
    [dialog.createType, refresh]
  );

  const handleRunConfirm = useCallback(
    async (options: RunContainerOptions) => {
      const editId = dialog.editContainerId;
      setDialog({ type: null, data: undefined, logs: undefined });
      try {
        if (editId) {
          setActionInProgress("Recreating container...");
          await containerCli.stopContainer(editId).catch(() => {});
          await containerCli.removeContainer(editId);
        } else {
          setActionInProgress(`Running ${options.image}...`);
        }
        await containerCli.runContainer(options);
        await refresh();
        setActionInProgress(null);
      } catch (err) {
        setActionInProgress(null);
        setActionError(err instanceof Error ? err.message : "Failed to run container");
      }
    },
    [dialog.editContainerId, refresh]
  );

  const handleCancel = useCallback(() => {
    setDialog({ type: null, data: undefined, logs: undefined });
  }, []);

  useKeyboard({
    onQuit: handleQuit,
    onTabChange: handleTabChange,
    onNavigate: handleNavigate,
    onSelect: handleSelect,
    onBack: handleBack,
    onSearch: handleSearch,
    onHelp: handleHelp,
    onRefresh: handleRefresh,
    onAction: handleAction,
    isSearchMode: searchMode,
    isDetailView: dialog.type === "logs" || dialog.type === "inspect",
    isDialogOpen: dialog.type === "confirm" || dialog.type === "create" || dialog.type === "pull" || dialog.type === "run",
    activeTab,
  });

  if (loading && containers.length === 0) {
    return (
      <Box padding={1}>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Loading container data...</Text>
      </Box>
    );
  }

  if (showHelp) {
    return <HelpOverlay onClose={() => setShowHelp(false)} />;
  }

  if (dialog.type === "confirm" && dialog.message) {
    return (
      <ConfirmDialog
        message={dialog.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }

  if (dialog.type === "pull") {
    return <PullDialog onConfirm={handlePullConfirm} onCancel={handleCancel} />;
  }

  if (dialog.type === "create" && dialog.createType) {
    return (
      <CreateDialog
        type={dialog.createType}
        onConfirm={handleCreateConfirm}
        onCancel={handleCancel}
      />
    );
  }

  if (dialog.type === "run") {
    return (
      <RunContainerDialog
        initialValues={dialog.initialValues}
        isEdit={!!dialog.editContainerId}
        onConfirm={handleRunConfirm}
        onCancel={handleCancel}
      />
    );
  }

  if (dialog.type === "logs" && dialog.logs !== undefined) {
    return (
      <LogsView
        containerName={dialog.containerName || ""}
        logs={dialog.logs}
        onClose={handleCancel}
      />
    );
  }

  if (dialog.type === "inspect" && dialog.data) {
    const identifiers = getItemIdentifiers();
    const title = `Inspect: ${identifiers?.name || "Unknown"}`;
    return <DetailView title={title} data={dialog.data} onClose={handleCancel} />;
  }

  return (
      <Box flexDirection="column" height="100%">
      <Box marginBottom={0}>
        <Text bold color="cyan">
          contui v{APP_VERSION}
        </Text>
        <Text dimColor> - Container Management TUI</Text>
      </Box>

      <TabBar activeTab={activeTab} />

      {searchMode && (
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={handleSearchSubmit}
        />
      )}

      <Box flexDirection="column" flexGrow={1}>
        {activeTab === "containers" && (
          <ContainersView
            containers={sortedContainers}
            selectedIndex={selectedIndex}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === "images" && (
          <ImagesView
            images={sortedImages}
            selectedIndex={selectedIndex}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === "networks" && (
          <NetworksView
            networks={sortedNetworks}
            selectedIndex={selectedIndex}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === "volumes" && (
          <VolumesView
            volumes={sortedVolumes}
            selectedIndex={selectedIndex}
            searchQuery={searchQuery}
          />
        )}
      </Box>

      <StatusBar
        activeTab={activeTab}
        itemCount={getItemCount()}
        error={error || actionError}
        actionInProgress={actionInProgress}
        releaseStatus={releaseStatus}
      />
    </Box>
  );
}
