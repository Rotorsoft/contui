#!/usr/bin/env node
import { render, Box, Text } from "ink";
import { App } from "./components/App.js";
import { performHealthCheck } from "./services/health-check.js";
import { composeUp, composeDown } from "./services/compose.js";

async function main() {
  const command = process.argv[2];

  // Handle compose commands (non-interactive)
  if (command === "up" || command === "down") {
    const health = await performHealthCheck();
    if (!health.cliInstalled || !health.serviceRunning) {
      console.error(`Container CLI Error: ${health.error}`);
      process.exit(1);
    }

    try {
      if (command === "up") {
        await composeUp(process.cwd());
      } else {
        await composeDown(process.cwd());
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
    return;
  }

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
