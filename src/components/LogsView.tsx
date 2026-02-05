import React from "react";
import { Box, Text } from "ink";

interface LogsViewProps {
  containerName: string;
  logs: string;
  onClose: () => void;
}

export function LogsView({ containerName, logs }: LogsViewProps): React.ReactElement {
  const logLines = logs.split("\n").slice(-30);

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="green"
      paddingX={2}
      paddingY={1}
      flexGrow={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="green">
          Logs: {containerName}
        </Text>
      </Box>

      <Box flexDirection="column" flexGrow={1} overflowY="hidden">
        {logLines.map((line, index) => (
          <Text key={index} wrap="truncate">
            {line}
          </Text>
        ))}
        {logLines.length === 0 && <Text dimColor>No logs available</Text>}
      </Box>

      <Box justifyContent="center" marginTop={1}>
        <Text dimColor>Press Esc or q to close</Text>
      </Box>
    </Box>
  );
}
