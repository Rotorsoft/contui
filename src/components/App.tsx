import React, { useState, useCallback } from "react";
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
import { useContainerData } from "../hooks/useContainerData.js";
import { useKeyboard } from "../hooks/useKeyboard.js";
import { containerCli } from "../services/container-cli.js";
import type { Tab } from "../types/index.js";

type DialogType = "confirm" | "create" | "pull" | "logs" | "inspect" | null;

interface DialogState {
  type: DialogType;
  message?: string;
  action?: () => Promise<void>;
  data?: Record<string, unknown>;
  logs?: string;
  containerName?: string;
  createType?: "network" | "volume";
}

export function App(): React.ReactElement {
  const { exit } = useApp();
  const { containers, images, networks, volumes, loading, error, refresh } = useContainerData();

  const [activeTab, setActiveTab] = useState<Tab>("containers");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ type: null });
  const [actionError, setActionError] = useState<string | null>(null);

  const getItemCount = useCallback((): number => {
    switch (activeTab) {
      case "containers":
        return containers.length;
      case "images":
        return images.length;
      case "networks":
        return networks.length;
      case "volumes":
        return volumes.length;
      default:
        return 0;
    }
  }, [activeTab, containers.length, images.length, networks.length, volumes.length]);

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
    try {
      let inspectData: Record<string, unknown> = {};

      switch (activeTab) {
        case "containers": {
          const container = containers[selectedIndex];
          if (!container) return;
          inspectData = (await containerCli.inspectContainer(
            container.id
          )) as unknown as Record<string, unknown>;
          break;
        }
        case "images": {
          const image = images[selectedIndex];
          if (!image) return;
          inspectData = await containerCli.inspectImage(image.reference);
          break;
        }
        case "networks": {
          const network = networks[selectedIndex];
          if (!network) return;
          inspectData = (await containerCli.inspectNetwork(
            network.id
          )) as unknown as Record<string, unknown>;
          break;
        }
        case "volumes": {
          const volume = volumes[selectedIndex];
          if (!volume) return;
          inspectData = (await containerCli.inspectVolume(
            volume.name
          )) as unknown as Record<string, unknown>;
          break;
        }
      }

      setDialog({ type: "inspect", data: inspectData });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to inspect");
    }
  }, [activeTab, selectedIndex, containers, images, networks, volumes]);

  const handleBack = useCallback(() => {
    if (searchMode) {
      setSearchMode(false);
      setSearchInput("");
    } else if (dialog.type) {
      setDialog({ type: null });
    } else if (showHelp) {
      setShowHelp(false);
    }
  }, [searchMode, dialog.type, showHelp]);

  const handleSearch = useCallback(() => {
    setSearchMode(true);
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = useCallback(() => {
    setSearchQuery(searchInput);
    setSearchMode(false);
    setSelectedIndex(0);
  }, [searchInput]);

  const handleHelp = useCallback(() => {
    setShowHelp((prev: boolean) => !prev);
  }, []);

  const handleRefresh = useCallback(async () => {
    setActionError(null);
    await refresh();
  }, [refresh]);

  const getItemIdentifiers = useCallback(() => {
    switch (activeTab) {
      case "containers": {
        const c = containers[selectedIndex];
        return c ? { id: c.id, name: c.name } : null;
      }
      case "images": {
        const i = images[selectedIndex];
        return i ? { id: i.reference, name: `${i.repository}:${i.tag}` } : null;
      }
      case "networks": {
        const n = networks[selectedIndex];
        return n ? { id: n.id, name: n.name } : null;
      }
      case "volumes": {
        const v = volumes[selectedIndex];
        return v ? { id: v.name, name: v.name } : null;
      }
      default:
        return null;
    }
  }, [activeTab, selectedIndex, containers, images, networks, volumes]);

  const handleAction = useCallback(
    async (action: string) => {
      setActionError(null);

      if (action === "pull" && activeTab === "images") {
        setDialog({ type: "pull" });
        return;
      }

      if (action === "create" && (activeTab === "networks" || activeTab === "volumes")) {
        setDialog({
          type: "create",
          createType: activeTab === "networks" ? "network" : "volume",
        });
        return;
      }

      const identifiers = getItemIdentifiers();
      if (!identifiers) return;

      const { id: itemId, name: itemName } = identifiers;

      try {
        switch (action) {
          case "start":
            if (activeTab === "containers") {
              await containerCli.startContainer(itemId);
              await refresh();
            }
            break;

          case "stop":
            if (activeTab === "containers") {
              await containerCli.stopContainer(itemId);
              await refresh();
            }
            break;

          case "restart":
            if (activeTab === "containers") {
              await containerCli.restartContainer(itemId);
              await refresh();
            }
            break;

          case "delete":
            setDialog({
              type: "confirm",
              message: `Are you sure you want to delete ${itemName}?`,
              action: async () => {
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
              },
            });
            break;

          case "logs":
            if (activeTab === "containers") {
              const logs = await containerCli.getContainerLogs(itemId);
              setDialog({ type: "logs", logs, containerName: itemName });
            }
            break;

          case "inspect":
            await handleSelect();
            break;
        }
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed");
      }
    },
    [getItemIdentifiers, activeTab, refresh, handleSelect]
  );

  const handleConfirm = useCallback(async () => {
    if (dialog.action) {
      try {
        await dialog.action();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed");
      }
    }
    setDialog({ type: null });
  }, [dialog]);

  const handlePullConfirm = useCallback(
    async (imageName: string) => {
      setDialog({ type: null });
      try {
        await containerCli.pullImage(imageName);
        await refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Failed to pull image");
      }
    },
    [refresh]
  );

  const handleCreateConfirm = useCallback(
    async (name: string) => {
      setDialog({ type: null });
      try {
        if (dialog.createType === "network") {
          await containerCli.createNetwork(name);
        } else {
          await containerCli.createVolume(name);
        }
        await refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Failed to create");
      }
    },
    [dialog.createType, refresh]
  );

  const handleCancel = useCallback(() => {
    setDialog({ type: null });
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
          contui
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
            containers={containers}
            selectedIndex={selectedIndex}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === "images" && (
          <ImagesView
            images={images}
            selectedIndex={selectedIndex}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === "networks" && (
          <NetworksView
            networks={networks}
            selectedIndex={selectedIndex}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === "volumes" && (
          <VolumesView
            volumes={volumes}
            selectedIndex={selectedIndex}
            searchQuery={searchQuery}
          />
        )}
      </Box>

      <StatusBar
        activeTab={activeTab}
        itemCount={getItemCount()}
        error={error || actionError}
      />
    </Box>
  );
}
