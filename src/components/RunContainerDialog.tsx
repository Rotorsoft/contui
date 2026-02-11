import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type { RunContainerOptions } from "../types/index.js";

interface RunContainerDialogProps {
  initialImage?: string;
  onConfirm: (options: RunContainerOptions) => void;
  onCancel: () => void;
}

const FIELDS = ["image", "name", "ports", "env"] as const;
type Field = (typeof FIELDS)[number];

const FIELD_LABELS: Record<Field, string> = {
  image: "Image",
  name: "Name",
  ports: "Ports",
  env: "Env vars",
};

const FIELD_HINTS: Record<Field, string> = {
  image: "e.g. nginx:latest, postgres:16",
  name: "optional container name",
  ports: "HOST:CONTAINER, e.g. 8080:80, 5433:5432",
  env: "KEY=VALUE, e.g. POSTGRES_PASSWORD=secret",
};

export function RunContainerDialog({
  initialImage = "",
  onConfirm,
  onCancel,
}: RunContainerDialogProps): React.ReactElement {
  const [activeField, setActiveField] = useState<number>(initialImage ? 1 : 0);
  const [values, setValues] = useState<Record<Field, string>>({
    image: initialImage,
    name: "",
    ports: "",
    env: "",
  });

  useInput((_input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.tab) {
      setActiveField((prev) => (prev + 1) % FIELDS.length);
    }
  });

  const handleChange = (field: Field) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const image = values.image.trim();
    if (!image) return;

    const ports = values.ports
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const env = values.env
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    onConfirm({
      image,
      name: values.name.trim() || undefined,
      ports: ports.length > 0 ? ports : undefined,
      env: env.length > 0 ? env : undefined,
    });
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
          Run Container
        </Text>
      </Box>

      {FIELDS.map((field, index) => (
        <Box key={field} marginBottom={index < FIELDS.length - 1 ? 0 : 0}>
          <Box width={12}>
            <Text color={activeField === index ? "yellow" : undefined} bold={activeField === index}>
              {activeField === index ? "▸ " : "  "}
              {FIELD_LABELS[field]}:
            </Text>
          </Box>
          <Box flexGrow={1}>
            {activeField === index ? (
              <TextInput
                value={values[field]}
                onChange={handleChange(field)}
                onSubmit={handleSubmit}
              />
            ) : (
              <Text dimColor={!values[field]}>{values[field] || FIELD_HINTS[field]}</Text>
            )}
          </Box>
        </Box>
      ))}

      <Box marginTop={1}>
        <Text dimColor>Tab: next field · Enter: run · Esc: cancel</Text>
      </Box>
    </Box>
  );
}
