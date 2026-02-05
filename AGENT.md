# AI Agent Instructions

This file contains instructions for AI agents working on this repository.

## Project Overview

**contui** is a Terminal UI for managing containers on macOS using the native `container` CLI. Built with Ink (React for CLI) and TypeScript, it provides vim-style keyboard navigation for container, image, network, and volume management.

### Key Technologies
- **Ink v5** - React-based terminal UI framework
- **TypeScript** - Strict type checking enabled
- **Jest** - Testing framework with ESM support
- **ESLint** - Flat config format (eslint.config.js)
- **pnpm** - Package manager

## Code Patterns

### Architecture

The application follows a **component-based architecture** with separation of concerns:

1. **Components** (`src/components/`): React components for UI rendering
2. **Hooks** (`src/hooks/`): Custom hooks for state and behavior
3. **Services** (`src/services/`): External integrations (container CLI wrapper)
4. **Types** (`src/types/`): Shared TypeScript interfaces

### Naming Conventions

- **Files**: `kebab-case.ts` for utilities, `PascalCase.tsx` for React components
- **Components**: PascalCase (e.g., `ContainersView`, `StatusBar`)
- **Hooks**: camelCase with `use` prefix (e.g., `useKeyboard`, `useContainerData`)
- **Types**: PascalCase (e.g., `Container`, `ContainerStatus`)
- **Functions**: camelCase (e.g., `handleAction`, `getItemCount`)

### Component Structure

```typescript
// Standard component pattern
import React from "react";
import { Box, Text } from "ink";
import type { SomeType } from "../types/index.js";

interface Props {
  data: SomeType;
  selectedIndex: number;
}

export function ComponentName({ data, selectedIndex }: Props): React.ReactElement {
  // Component logic
  return <Box>...</Box>;
}
```

### Important Patterns

1. **ESM Imports**: Always use `.js` extension for local imports
   ```typescript
   import { Container } from "../types/index.js";  // Correct
   import { Container } from "../types/index";     // Wrong
   ```

2. **Keyboard Handling**: Centralized in `useKeyboard` hook - add new keybindings there

3. **CLI Commands**: All container operations go through `src/services/container-cli.ts`

4. **State Management**: Uses React's built-in `useState` and `useCallback`

5. **Selection Highlighting**: Uses Ink's inverse text (`<Text inverse>`) for selection

## Testing Requirements

### Unit Tests
- All new service functions should have corresponding unit tests
- Use Jest with ESM support (`NODE_OPTIONS='--experimental-vm-modules'`)
- Tests located in `src/__tests__/`
- Aim for coverage on critical paths (CLI parsing, data transformation)

### Test Patterns
```typescript
import { describe, it, expect, jest } from "@jest/globals";

describe("ModuleName", () => {
  it("should do something specific", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Running Tests
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report
```

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature (triggers minor version bump)
- `fix:` Bug fix (triggers patch version bump)
- `refactor:` Code improvement without behavior change
- `test:` Test additions
- `chore:` Maintenance/dependencies
- `docs:` Documentation
- `perf:` Performance improvement
- `ci:` CI changes
- `build:` Build system changes

Breaking changes: Add `!` after type (e.g., `feat!:`) or include `BREAKING CHANGE:` in footer.

AI commits must include:
```
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Important Files

| File | Purpose |
|------|---------|
| `src/index.tsx` | Entry point with health check |
| `src/components/App.tsx` | Main app component, state management |
| `src/services/container-cli.ts` | Container CLI wrapper (critical) |
| `src/hooks/useKeyboard.ts` | Keyboard handler (add shortcuts here) |
| `src/hooks/useContainerData.ts` | Data fetching logic |
| `src/types/index.ts` | All TypeScript interfaces |

## Constraints

- **Do not use npm or yarn** - This project uses pnpm
- **Always use async/await** - No callbacks for async operations
- **No Docker dependency** - Uses macOS native `container` CLI only
- **Preserve vim-style navigation** - j/k, h/l patterns are intentional
- **ESM only** - Project uses `"type": "module"`
- **Do not modify** `.github/workflows/` without explicit request
- **Keep Ink v5 compatibility** - Don't introduce v4 patterns

## Validation Before Commits

Always run before committing:
```bash
pnpm run typecheck
pnpm run lint
pnpm test
```

## Common Tasks

### Adding a New Keyboard Shortcut
1. Edit `src/hooks/useKeyboard.ts`
2. Add the key handler in the `handleInput` function
3. Update `src/components/HelpOverlay.tsx` to document it
4. Update README.md keyboard shortcuts table

### Adding a New Container Operation
1. Add method to `src/services/container-cli.ts`
2. Add corresponding test in `src/__tests__/container-cli.test.ts`
3. Wire up in `src/components/App.tsx` via `handleAction`

### Adding a New Tab/View
1. Add type to `Tab` union in `src/types/index.ts`
2. Create component in `src/components/`
3. Add to tab switching in `useKeyboard.ts`
4. Add rendering case in `App.tsx`
