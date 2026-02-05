import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function SearchInput({ value, onChange, onSubmit }: SearchInputProps): React.ReactElement {
  return (
    <Box borderStyle="single" borderColor="yellow" paddingX={1}>
      <Text color="yellow">/</Text>
      <TextInput value={value} onChange={onChange} onSubmit={onSubmit} />
      <Text dimColor> (Enter to search, Esc to cancel)</Text>
    </Box>
  );
}
