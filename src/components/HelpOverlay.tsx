import React from "react";
import { Box, Text } from "ink";

interface HelpOverlayProps {
  onClose: () => void;
}

const HELP_SECTIONS = [
  {
    title: "Navigation",
    items: [
      { key: "h / l", desc: "Previous / Next tab" },
      { key: "j / k", desc: "Move down / up" },
      { key: "Enter", desc: "Select / Expand" },
      { key: "Esc", desc: "Go back / Close" },
      { key: "1-4", desc: "Switch to tab directly" },
    ],
  },
  {
    title: "Container Actions",
    items: [
      { key: "n", desc: "Run new container" },
      { key: "s", desc: "Start container" },
      { key: "x", desc: "Stop container" },
      { key: "R", desc: "Restart container" },
      { key: "d", desc: "Delete (remove)" },
      { key: "L", desc: "View logs" },
      { key: "i", desc: "Inspect details" },
    ],
  },
  {
    title: "Image Actions",
    items: [
      { key: "n", desc: "Run container from image" },
      { key: "p", desc: "Pull image" },
      { key: "d", desc: "Delete image" },
      { key: "i", desc: "Inspect image" },
    ],
  },
  {
    title: "Network / Volume Actions",
    items: [
      { key: "c", desc: "Create new" },
      { key: "d", desc: "Delete" },
      { key: "i", desc: "Inspect" },
    ],
  },
  {
    title: "General",
    items: [
      { key: "/", desc: "Search / Filter" },
      { key: "r", desc: "Refresh data" },
      { key: "?", desc: "Toggle help" },
      { key: "q", desc: "Quit application" },
    ],
  },
];

export function HelpOverlay({ onClose: _ }: HelpOverlayProps): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="cyan">
          Keyboard Shortcuts
        </Text>
      </Box>

      {HELP_SECTIONS.map((section) => (
        <Box key={section.title} flexDirection="column" marginBottom={1}>
          <Text bold underline>
            {section.title}
          </Text>
          {section.items.map((item) => (
            <Box key={item.key}>
              <Box width={15}>
                <Text color="yellow">{item.key}</Text>
              </Box>
              <Text>{item.desc}</Text>
            </Box>
          ))}
        </Box>
      ))}

      <Box justifyContent="center" marginTop={1}>
        <Text dimColor>Press ? or Esc to close</Text>
      </Box>
    </Box>
  );
}
