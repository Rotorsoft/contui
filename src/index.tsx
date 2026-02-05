#!/usr/bin/env node
import { render, Box, Text } from "ink";
import { App } from "./components/App.js";
import { performHealthCheck } from "./services/health-check.js";

async function main() {
  const health = await performHealthCheck();

  if (!health.cliInstalled || !health.serviceRunning) {
    render(
      <Box flexDirection="column" padding={1}>
        <Text bold color="red">
          Container CLI Error
        </Text>
        <Text>{health.error}</Text>
      </Box>
    );
    process.exit(1);
  }

  render(<App />);
}

main().catch((err) => {
  console.error("Failed to start contui:", err);
  process.exit(1);
});
