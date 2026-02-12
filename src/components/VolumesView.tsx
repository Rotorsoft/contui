import React from "react";
import { Box, Text } from "ink";
import { Table } from "./Table.js";
import type { Volume } from "../types/index.js";

interface VolumesViewProps {
  volumes: Volume[];
  selectedIndex: number;
  searchQuery: string;
}

export function VolumesView({
  volumes,
  selectedIndex,
  searchQuery,
}: VolumesViewProps): React.ReactElement {
  const filteredVolumes = volumes
    .filter(
      (vol) =>
        !searchQuery ||
        vol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vol.driver.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const columns = [
    { key: "name", header: "VOLUME NAME", width: 35 },
    { key: "driver", header: "DRIVER", width: 15 },
    { key: "scope", header: "SCOPE", width: 10 },
    { key: "mountpoint", header: "MOUNTPOINT", width: 40 },
  ];

  return (
    <Box flexDirection="column" flexGrow={1}>
      {searchQuery && (
        <Box paddingX={1}>
          <Text dimColor>Filtered by: "{searchQuery}"</Text>
        </Box>
      )}
      <Table
        columns={columns}
        data={filteredVolumes}
        selectedIndex={selectedIndex}
        emptyMessage="No volumes found"
      />
    </Box>
  );
}
