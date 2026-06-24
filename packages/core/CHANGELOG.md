# @cascivo/core

## 0.2.0

### Minor Changes

- 4554af1: Make object-valued prop shapes machine-readable. `ComponentMeta` gains an optional
  `typeDefs` field (`TypeDefMeta`/`TypeFieldMeta`) describing the fields of object props —
  the per-datum/per-series `color` override was previously only discoverable in prose, so
  AI/registry consumers filtering props by name never found it. `PieChart` and `BarChart`
  now declare `typeDefs` for `PieChartDatum`, `BarChartSeries`, `StackedRow`/`StackedSegment`,
  and the `ChartPoint` tooltip-callback argument; these flow into `registry.json`, the MCP
  `get_component` payload, and a new `## Object types` section in the generated `llms.txt`
  component docs. The `@cascivo/charts` README now documents coloring, donut center labels,
  and `toStackedSeries` row-pivot usage. Resolves the `@lifosy/ui` charts discoverability gap.

## 0.1.3

### Patch Changes

- fa55081: SideNav improvements

## 0.1.2

### Patch Changes

- 72d0086: New location

## 0.1.1

### Patch Changes

- e9998ab: Further improvements

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
