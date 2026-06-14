Shared utilities for cascivo example dashboards. Not a user-facing package.

## What's inside

- `seededRandom(seed)` — deterministic PRNG
- `createMockApi(seed, config?)` — async mock API with latency simulation
- `createSimulation({ tickMs, seed, onTick })` — pausable, seeded simulation engine
- `useSimulation(sim)` — React hook (useSignalEffect-based) to start/stop a simulation
- `AppShell` — shared app shell layout with theme persistence

## Usage

Import from `@cascivo/example-kit` in example apps.
