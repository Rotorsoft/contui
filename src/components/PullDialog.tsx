import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

interface PullDialogProps {
  onConfirm: (imageName: string) => void;
  onCancel: () => void;
}

export function PullDialog({ onConfirm, onCancel }: PullDialogProps): React.ReactElement {
  const [imageName, setImageName] = useState("");

  useInput((_input, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  const handleSubmit = () => {
    if (imageName.trim()) {
      onConfirm(imageName.trim());
    }
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={2}
      paddingY={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="yellow">
          Pull Image
        </Text>
      </Box>

      <Box>
        <Text>Image name: </Text>
        <TextInput value={imageName} onChange={setImageName} onSubmit={handleSubmit} />
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Example: nginx:latest, ubuntu:22.04, alpine</Text>
      </Box>

      <Box justifyContent="center" marginTop={1}>
        <Text dimColor>Enter to confirm, Esc to cancel</Text>
      </Box>
    </Box>
  );
}
