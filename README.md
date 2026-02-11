# @rotorsoft/contui

[![npm version](https://img.shields.io/npm/v/@rotorsoft/contui.svg)](https://www.npmjs.com/package/@rotorsoft/contui)
[![CI](https://github.com/Rotorsoft/contui/actions/workflows/ci.yml/badge.svg)](https://github.com/Rotorsoft/contui/actions/workflows/ci.yml)
[![Release](https://github.com/Rotorsoft/contui/actions/workflows/release.yml/badge.svg)](https://github.com/Rotorsoft/contui/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

A terminal UI for managing containers on macOS using the native `container` CLI.

## Features

- **Container Management**: List, start, stop, restart, and remove containers
- **Image Management**: List, pull, inspect, and remove images
- **Network Management**: List, create, inspect, and remove networks
- **Volume Management**: List, create, inspect, and remove volumes
- **Vim-style Navigation**: Use `j`/`k` or arrow keys for navigation
- **Search/Filter**: Quickly filter resources with `/`
- **Real-time Refresh**: Auto-refresh data with `r` key
- **Detailed Inspection**: View full resource details with `Enter` or `i`
- **Container Logs**: View container logs with `L`

## Prerequisites

- macOS with native container support
- Node.js >= 18.0.0
- The `container` CLI must be installed and the container service running

## Installation

### Download and Run (npm)

```bash
# Install globally
npm install -g @rotorsoft/contui

# Run the CLI
contui
```

```bash
# Or run without installing
npx @rotorsoft/contui
```

### From Source (pnpm)

```bash
# Clone the repository
git clone https://github.com/Rotorsoft/contui.git
cd contui

# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run the application
pnpm start
```

### Global Installation

```bash
# Link for global usage
pnpm link --global

# Run from anywhere
contui
```

## Usage

### Keyboard Shortcuts

#### Navigation
| Key | Action |
|-----|--------|
| `1-4` | Switch tabs (Containers, Images, Networks, Volumes) |
| `h` / `l` | Previous/Next tab |
| `j` / `k` or `↓` / `↑` | Navigate list |
| `Enter` | Inspect selected item |
| `Esc` | Go back / Cancel |
| `q` | Quit |

#### Actions
| Key | Action |
|-----|--------|
| `n` | Run new container (Containers/Images tab) |
| `s` | Start container |
| `x` | Stop container |
| `R` | Restart container |
| `d` | Delete (with confirmation) |
| `L` | View container logs |
| `i` | Inspect details |
| `p` | Pull image (Images tab) |
| `c` | Create network/volume |

#### Other
| Key | Action |
|-----|--------|
| `/` | Search/Filter |
| `r` | Refresh data |
| `?` | Show help |

## Development

```bash
# Run in development mode with hot reload
pnpm dev

# Type check
pnpm run typecheck

# Lint
pnpm run lint

# Run tests
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Format code
pnpm run format
```

## Architecture

The application is built with:

- **[Ink](https://github.com/vadimdemedes/ink)**: React for CLI applications
- **TypeScript**: Type-safe development
- **React Hooks**: State management with `useState`, `useCallback`, `useEffect`

### Project Structure

```
src/
├── components/      # React components (views, dialogs, UI elements)
├── hooks/           # Custom React hooks
├── services/        # Container CLI wrapper and utilities
├── types/           # TypeScript type definitions
└── index.tsx        # Application entry point
```

### Key Files

| File | Description |
|------|-------------|
| `src/index.tsx` | Entry point with health check |
| `src/components/App.tsx` | Main application component |
| `src/services/container-cli.ts` | macOS container CLI wrapper |
| `src/hooks/useContainerData.ts` | Data fetching and state |
| `src/hooks/useKeyboard.ts` | Centralized keyboard handling |
| `src/types/index.ts` | TypeScript interfaces |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Run validation:
   ```bash
   pnpm run typecheck
   pnpm run lint
   pnpm test
   ```
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add amazing feature"
   ```
6. Push and open a Pull Request

### Commit Message Format

This project uses [conventional commits](https://www.conventionalcommits.org/) enforced by commitlint:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test additions or corrections
- `build:` Build system changes
- `ci:` CI configuration changes
- `chore:` Maintenance tasks

## License

MIT
