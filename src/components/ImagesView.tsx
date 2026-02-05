import React from "react";
import { Box, Text } from "ink";
import { Table } from "./Table.js";
import type { Image } from "../types/index.js";

interface ImagesViewProps {
  images: Image[];
  selectedIndex: number;
  searchQuery: string;
}

export function ImagesView({
  images,
  selectedIndex,
  searchQuery,
}: ImagesViewProps): React.ReactElement {
  const filteredImages = images.filter(
    (img) =>
      !searchQuery ||
      img.repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: "repository", header: "REPOSITORY", width: 35 },
    { key: "tag", header: "TAG", width: 20 },
    { key: "id", header: "IMAGE ID", width: 15 },
    { key: "size", header: "SIZE", width: 12 },
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
        data={filteredImages}
        selectedIndex={selectedIndex}
        emptyMessage="No images found"
      />
    </Box>
  );
}
