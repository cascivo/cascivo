# cascivo

## 0.1.6

### Patch Changes

- f0b5654: Fixes
- Updated dependencies [f0b5654]
  - @cascivo/registry@0.1.4

## 0.1.5

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements
- Updated dependencies [2458391]
- Updated dependencies [52c08b6]
  - @cascivo/registry@0.1.3

## 0.1.4

### Patch Changes

- fa55081: SideNav improvements
- Updated dependencies [fa55081]
  - @cascivo/registry@0.1.2

## 0.1.3

### Patch Changes

- 5e58e32: Component eject

## 0.1.2

### Patch Changes

- 30b0f20: Fix `cascivo list`/`add` 404s: the default registry index now points at the
  canonical hosted URL `https://cascivo.com/registry.json` instead of a branch's
  GitHub raw URL (which 404s for unauthenticated/private-repo requests). Matches
  the registry URL already documented in `llms.txt`. Override with the
  `registry` field in `cascivo.config.*` or `CASCIVO_REGISTRY` as before.
- 72d0086: New location
- Updated dependencies [72d0086]
  - @cascivo/registry@0.1.1

## 0.1.1

### Patch Changes

- 0903bd6: Cyperpunk theme

## 0.1.0

### Minor Changes

- b23575c: Initial public release of the cascivo design system. Includes:
  - `@cascivo/core` — signal/FSM runtime (Preact Signals integration)
  - `@cascivo/tokens` — CSS design tokens (primitive → semantic → component)
  - `@cascivo/themes` — light, dark, and warm first-party themes
  - `@cascivo/icons` — SVG icon component set
  - `@cascivo/i18n` — signal-driven locale store with typed catalogs
  - `@cascivo/storage` — persisted signals over localStorage/IndexedDB
  - `@cascivo/react` — prebuilt npm distribution of all components
  - `@cascivo/mcp` — MCP server exposing the component registry to AI agents
  - `@cascivo/registry` — component registry runtime (CLI dependency)
  - `cascivo` — CLI for `npx cascivo init / add / list / update`

### Patch Changes

- Updated dependencies [b23575c]
  - @cascivo/registry@0.1.0
