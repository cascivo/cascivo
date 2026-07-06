# cascivo

## 0.3.1

### Patch Changes

- fe6e6f2: Improvements

## 0.3.0

### Minor Changes

- 5bafdb6: Adoption-audit fixes (waves 1–2):

  - CLI: per-command `--help` for every command (short-circuits before any prompt, fetch, or install); real `--version` (was hardcoded `0.0.0`); `init --theme <name>` / `--yes` with non-TTY defaulting; theme prompts and `theme add` now offer all 12 themes; `add` prints the `@cascivo/themes` wiring when the project doesn't import tokens yet; `add` is transactional (fetch-all-then-write — a failed fetch never leaves a partial component or a stale lockfile entry) and mixed bare + registry specs install both; registry fetches retry with backoff and fall back to the last cached copy when offline; first-party templates (`dashboard`, `auth`, `landing`) install by bare name; `@cascivo/<name>` namespace added (`@cascade/<name>` remains as a legacy alias); `doctor` no longer false-positives on hook names in comments; lockfile renamed `cascade.lock` → `cascivo.lock` (legacy file read and migrated automatically); HTTP cache moved to `~/.cascivo/cache`.
  - Registry: entries carry the real library version and per-file sha256 hashes; `cascivo update --check` diffs hashes instead of the previously inert version compare.
  - MCP: real server version (was `0.0.0`); `cascivo-mcp` bin added (`cascade-mcp` kept as a legacy alias).
  - i18n/react: `Combobox` search input, `DataTable` pagination buttons, `Dock` nav, and `Steps` list now source their aria-labels from the built-in catalog (with `labels`/`ariaLabel` prop overrides) instead of hardcoded English.

### Patch Changes

- Updated dependencies [5bafdb6]
  - @cascivo/registry@0.1.6

## 0.2.0

### Minor Changes

- f2f1c62: Add an app scaffold generator. The `cascivo create [name]` CLI command scaffolds a complete, ready-to-run app (Vite + React + TypeScript) pre-wired with the cascivo app shell, side navigation, header, and a chosen theme — one page per nav section, with signal-driven section switching. The MCP server exposes the same capability through a new `create_app` tool.

### Patch Changes

- bb3c77e: Templates and further improvements
- Updated dependencies [bb3c77e]
  - @cascivo/registry@0.1.5

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
