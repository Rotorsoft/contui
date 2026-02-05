import React from "react";
import { Box, Text, useInput } from "ink";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.ReactElement {
  useInput((input, key) => {
    if (input === "y" || input === "Y") {
      onConfirm();
    } else if (input === "n" || input === "N" || key.escape) {
      onCancel();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="red"
      paddingX={2}
      paddingY={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="red">
          Confirm Action
        </Text>
      </Box>

      <Box justifyContent="center">
        <Text>{message}</Text>
      </Box>

      <Box justifyContent="center" marginTop={1}>
        <Text>
          <Text color="green">[Y]</Text>es / <Text color="red">[N]</Text>o
        </Text>
      </Box>
    </Box>
  );
}
