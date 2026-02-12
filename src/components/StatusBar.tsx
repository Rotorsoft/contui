import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type { Tab } from "../types/index.js";
import type { ReleaseCheckState } from "../hooks/useReleaseCheck.js";

interface StatusBarProps {
  activeTab: Tab;
  itemCount: number;
  error?: string | null;
  actionInProgress?: string | null;
  releaseStatus?: ReleaseCheckState | null;
}

interface Action {
  key: string;
  label: string;
}

const TAB_ACTIONS: Record<Tab, Action[]> = {
  containers: [
    { key: "c", label: "create" },
    { key: "e", label: "edit" },
    { key: "s", label: "start" },
    { key: "o", label: "stop" },
    { key: "R", label: "Restart" },
    { key: "d", label: "delete" },
    { key: "L", label: "Logs" },
    { key: "i", label: "inspect" },
  ],
  images: [
    { key: "c", label: "create" },
    { key: "p", label: "pull" },
    { key: "d", label: "delete" },
    { key: "i", label: "inspect" },
  ],
  networks: [
    { key: "c", label: "create" },
    { key: "d", label: "delete" },
    { key: "i", label: "inspect" },
  ],
  volumes: [
    { key: "c", label: "create" },
    { key: "d", label: "delete" },
    { key: "i", label: "inspect" },
  ],
};

export function renderAction({ key, label }: Action, dim = false): React.ReactElement {
  const idx = label.indexOf(key);
  if (idx === -1) {
    return <Text dimColor={dim}><Text color="yellow" underline>{key}</Text>:{label}</Text>;
  }
  const before = label.slice(0, idx);
  const after = label.slice(idx + 1);
  return (
    <Text dimColor={dim}>
      {before}<Text color="yellow" underline>{label[idx]}</Text>{after}
    </Text>
  );
}

function renderActions(actions: Action[]): React.ReactElement {
  return (
    <Text>
      {actions.map((action, i) => (
        <Text key={action.key}>
          {i > 0 ? " " : ""}{renderAction(action)}
        </Text>
      ))}
    </Text>
  );
}

const GLOBAL_ACTIONS: Action[] = [
  { key: "/", label: "/search" },
  { key: "r", label: "refresh" },
  { key: "?", label: "?help" },
  { key: "q", label: "quit" },
];

function renderGlobalActions(): React.ReactElement {
  return (
    <Text>
      <Text dimColor>hjkl:nav</Text>
      {GLOBAL_ACTIONS.map((action) => (
        <Text key={action.key}>
          {" "}{renderAction(action, true)}
        </Text>
      ))}
    </Text>
  );
}

function renderReleaseStatus(releaseStatus?: ReleaseCheckState | null): React.ReactNode {
  if (!releaseStatus) return null;

  if (releaseStatus.status === "update-available" && releaseStatus.latestVersion) {
    return <Text color="yellow">Update available: v{releaseStatus.latestVersion}</Text>;
  }

  if (releaseStatus.status === "checking") {
    return <Text dimColor>Checking for updates...</Text>;
  }

  return null;
}

export function StatusBar({
  activeTab,
  itemCount,
  error,
  actionInProgress,
  releaseStatus,
}: StatusBarProps): React.ReactElement {
  if (error) {
    return (
      <Box borderStyle="single" borderColor="red" paddingX={1}>
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  if (actionInProgress) {
    return (
      <Box borderStyle="single" borderColor="yellow" paddingX={1}>
        <Text color="yellow">
          <Spinner type="dots" />
        </Text>
        <Text color="yellow"> {actionInProgress}</Text>
      </Box>
    );
  }

  const releaseContent = renderReleaseStatus(releaseStatus);

  return (
    <Box borderStyle="single" paddingX={1} justifyContent="space-between">
      <Text>
        <Text color="cyan">{itemCount}</Text> {activeTab} | {renderActions(TAB_ACTIONS[activeTab])}
      </Text>
      {releaseContent ?? renderGlobalActions()}
    </Box>
  );
}
