import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

interface CreateDialogProps {
  type: "network" | "volume";
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function CreateDialog({
  type,
  onConfirm,
  onCancel,
}: CreateDialogProps): React.ReactElement {
  const [name, setName] = useState("");

  useInput((_input, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm(name.trim());
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
          Create New {type === "network" ? "Network" : "Volume"}
        </Text>
      </Box>

      <Box>
        <Text>Name: </Text>
        <TextInput value={name} onChange={setName} onSubmit={handleSubmit} />
      </Box>

      <Box justifyContent="center" marginTop={1}>
        <Text dimColor>Enter to confirm, Esc to cancel</Text>
      </Box>
    </Box>
  );
}
