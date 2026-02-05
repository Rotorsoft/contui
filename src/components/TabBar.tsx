import React from "react";
import { Box, Text } from "ink";
import type { Tab } from "../types/index.js";

interface TabBarProps {
  activeTab: Tab;
}

const TABS: Array<{ key: Tab; label: string; shortcut: string }> = [
  { key: "containers", label: "Containers", shortcut: "1" },
  { key: "images", label: "Images", shortcut: "2" },
  { key: "networks", label: "Networks", shortcut: "3" },
  { key: "volumes", label: "Volumes", shortcut: "4" },
];

export function TabBar({ activeTab }: TabBarProps): React.ReactElement {
  return (
    <Box borderStyle="single" paddingX={1}>
      {TABS.map((tab, index) => (
        <React.Fragment key={tab.key}>
          {index > 0 && <Text> | </Text>}
          <Text
            color={activeTab === tab.key ? "cyan" : "white"}
            bold={activeTab === tab.key}
          >
            [{tab.shortcut}] {tab.label}
          </Text>
        </React.Fragment>
      ))}
    </Box>
  );
}
