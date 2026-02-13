import React from "react";
import { Box, Text } from "ink";
import { formatRelativeDate } from "../utils/format-date.js";

interface DetailViewProps {
  title: string;
  data: Record<string, unknown>;
  onClose: () => void;
}

export function DetailView({ title, data }: DetailViewProps): React.ReactElement {
  const renderValue = (value: unknown, indent = 0): React.ReactNode => {
    const padding = "  ".repeat(indent);

    if (value === null || value === undefined) {
      return <Text dimColor>null</Text>;
    }

    if (typeof value === "boolean") {
      return <Text color={value ? "green" : "red"}>{String(value)}</Text>;
    }

    if (typeof value === "number") {
      return <Text color="yellow">{value}</Text>;
    }

    if (typeof value === "string") {
      const display = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
        ? formatRelativeDate(value)
        : value;
      if (display.length > 50) {
        return <Text color="green">"{display.substring(0, 50)}..."</Text>;
      }
      return <Text color="green">"{display}"</Text>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <Text dimColor>[]</Text>;
      }
      return (
        <Box flexDirection="column">
          {value.map((item, index) => (
            <Box key={index}>
              <Text>{padding}  - </Text>
              {renderValue(item, indent + 1)}
            </Box>
          ))}
        </Box>
      );
    }

    if (typeof value === "object") {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <Text dimColor>{"{}"}</Text>;
      }
      return (
        <Box flexDirection="column">
          {entries.map(([key, val]) => (
            <Box key={key}>
              <Text>{padding}  </Text>
              <Text color="cyan">{key}</Text>
              <Text>: </Text>
              {renderValue(val, indent + 1)}
            </Box>
          ))}
        </Box>
      );
    }

    return <Text>{String(value)}</Text>;
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      flexGrow={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>

      <Box flexDirection="column" flexGrow={1} overflowY="hidden">
        {Object.entries(data).map(([key, value]) => (
          <Box key={key} marginBottom={0}>
            <Text bold color="yellow">
              {key}:
            </Text>
            <Text> </Text>
            {renderValue(value)}
          </Box>
        ))}
      </Box>

      <Box justifyContent="center" marginTop={1}>
        <Text dimColor>Press Esc or q to close</Text>
      </Box>
    </Box>
  );
}
