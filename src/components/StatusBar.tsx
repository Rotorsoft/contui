import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type { Tab } from "../types/index.js";

interface StatusBarProps {
  activeTab: Tab;
  itemCount: number;
  error?: string | null;
  actionInProgress?: string | null;
}

const TAB_ACTIONS: Record<Tab, string> = {
  containers: "s:start x:stop R:restart d:delete L:logs i:inspect",
  images: "p:pull d:delete i:inspect",
  networks: "c:create d:delete i:inspect",
  volumes: "c:create d:delete i:inspect",
};

export function StatusBar({ activeTab, itemCount, error, actionInProgress }: StatusBarProps): React.ReactElement {
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

  return (
    <Box borderStyle="single" paddingX={1} justifyContent="space-between">
      <Text>
        <Text color="cyan">{itemCount}</Text> {activeTab} | {TAB_ACTIONS[activeTab]}
      </Text>
      <Text dimColor>
        h/l:tabs j/k:navigate /:search r:refresh ?:help q:quit
      </Text>
    </Box>
  );
}
