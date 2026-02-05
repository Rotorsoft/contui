import React from "react";
import { Box, Text } from "ink";

interface Column<T> {
  key: string;
  header: string;
  width: number;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  selectedIndex: number;
  emptyMessage?: string;
}

export function Table<T extends object>({
  columns,
  data,
  selectedIndex,
  emptyMessage = "No items found",
}: TableProps<T>): React.ReactElement {
  if (data.length === 0) {
    return (
      <Box paddingX={1} paddingY={1}>
        <Text dimColor>{emptyMessage}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box>
        {columns.map((col) => (
          <Box key={col.key as string} width={col.width}>
            <Text bold color="cyan">
              {col.header}
            </Text>
          </Box>
        ))}
      </Box>

      <Box borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} />

      {data.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Box key={index}>
            {columns.map((col) => (
              <Box key={col.key} width={col.width}>
                <Text inverse={isSelected} color={isSelected ? "blue" : undefined}>
                  {col.render
                    ? col.render(item)
                    : truncate(String((item as Record<string, unknown>)[col.key] ?? ""), col.width - 1)}
                </Text>
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 1) + "…";
}
