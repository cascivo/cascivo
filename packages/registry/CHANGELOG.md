# @cascivo/registry

## 0.1.11

### Patch Changes

- 810b8ba: Minor improvements

## 0.1.10

### Patch Changes

- 483e30a: Minor improvements

## 0.1.9

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.

## 0.1.8

### Patch Changes

- b49e0ba: Fixed red flags.
- 6ee2f91: Experience fixes

## 0.1.7

### Patch Changes

- fc61671: Minor improvements

## 0.1.6

### Patch Changes

- 5bafdb6: Documentation pass (audit waves 4–5): package READMEs rewritten or corrected —
  `@cascivo/react` doc links now absolute (they dead-ended on npmjs.com),
  `@cascivo/registry` documents its real exports and consumers, and
  `@cascivo/themes` lists all 12 themes and import options. (The private
  render package's wrong ViewConfig example was also fixed.)

## 0.1.5

### Patch Changes

- bb3c77e: Templates and further improvements

## 0.1.4

### Patch Changes

- f0b5654: Fixes

## 0.1.3

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements

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
