import React from "react";
import { Box, Text } from "ink";
import { Table } from "./Table.js";
import type { Network } from "../types/index.js";

interface NetworksViewProps {
  networks: Network[];
  selectedIndex: number;
  searchQuery: string;
}

export function NetworksView({
  networks,
  selectedIndex,
  searchQuery,
}: NetworksViewProps): React.ReactElement {
  const filteredNetworks = networks.filter(
    (net) =>
      !searchQuery ||
      net.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      net.driver.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: "id", header: "NETWORK ID", width: 15 },
    { key: "name", header: "NAME", width: 30 },
    { key: "driver", header: "DRIVER", width: 15 },
    { key: "scope", header: "SCOPE", width: 15 },
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
        data={filteredNetworks}
        selectedIndex={selectedIndex}
        emptyMessage="No networks found"
      />
    </Box>
  );
}
