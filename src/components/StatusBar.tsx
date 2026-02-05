import React from "react";
import { Box, Text } from "ink";
import type { Tab } from "../types/index.js";

interface StatusBarProps {
  activeTab: Tab;
  itemCount: number;
  error?: string | null;
}

const TAB_ACTIONS: Record<Tab, string> = {
  containers: "s:start x:stop R:restart d:delete l:logs i:inspect",
  images: "p:pull d:delete i:inspect",
  networks: "c:create d:delete i:inspect",
  volumes: "c:create d:delete i:inspect",
};

export function StatusBar({ activeTab, itemCount, error }: StatusBarProps): React.ReactElement {
  if (error) {
    return (
      <Box borderStyle="single" borderColor="red" paddingX={1}>
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="single" paddingX={1} justifyContent="space-between">
      <Text>
        <Text color="cyan">{itemCount}</Text> {activeTab} | {TAB_ACTIONS[activeTab]}
      </Text>
      <Text dimColor>
        j/k:navigate /:search r:refresh ?:help q:quit
      </Text>
    </Box>
  );
}
