# @cascivo/icons

## 0.2.2

### Patch Changes

- f0b5654: Fixes

## 0.2.1

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements

## 0.2.0

### Minor Changes

- 14f118e: Expand the icon catalog from 60 to ~440 icons by adopting the full chromicons
  set (MIT, stroked 24×24 — the same family as the existing Feather-derived
  icons), generated from vendored SVG source via `scripts/icons/generate.mjs`.
  Purely additive: no existing icon name, signature, or geometry changes;
  collisions resolve in favor of the existing export. A new `icons.catalog.json`
  manifest (name, keywords, category) powers the searchable `/icons` docs gallery.

### Patch Changes

- 14f118e: More Icons

## 0.1.2

### Patch Changes

- fa55081: SideNav improvements

## 0.1.1

### Patch Changes

- 72d0086: New location

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
