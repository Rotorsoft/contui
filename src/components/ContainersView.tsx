import React from "react";
import { Box, Text } from "ink";
import { Table } from "./Table.js";
import type { Container, ContainerStatus } from "../types/index.js";

interface ContainersViewProps {
  containers: Container[];
  selectedIndex: number;
  searchQuery: string;
}

const STATUS_COLORS: Record<ContainerStatus, string> = {
  running: "green",
  stopped: "red",
  paused: "yellow",
  restarting: "cyan",
  created: "blue",
  dead: "gray",
};

function formatPorts(container: Container): string {
  if (container.ports.length === 0) return "-";
  return container.ports
    .map((p) => `${p.hostPort}:${p.containerPort}`)
    .join(", ");
}

function StatusBadge({ status }: { status: ContainerStatus }): React.ReactElement {
  return <Text color={STATUS_COLORS[status]}>{status}</Text>;
}

export function ContainersView({
  containers,
  selectedIndex,
  searchQuery,
}: ContainersViewProps): React.ReactElement {
  const filteredContainers = containers.filter(
    (c) =>
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.image.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: "name", header: "NAME", width: 25 },
    { key: "image", header: "IMAGE", width: 30 },
    {
      key: "status",
      header: "STATUS",
      width: 12,
      render: (c: Container) => <StatusBadge status={c.status} />,
    },
    {
      key: "ports",
      header: "PORTS",
      width: 20,
      render: (c: Container) => formatPorts(c),
    },
    { key: "created", header: "CREATED", width: 20 },
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
        data={filteredContainers}
        selectedIndex={selectedIndex}
        emptyMessage="No containers found"
      />
    </Box>
  );
}
