# @cascivo/mcp

## 0.4.1

### Patch Changes

- 62a02e6: DX improvements

## 0.4.0

### Minor Changes

- c335ed5: The MCP server now ships `instructions` carrying the cascivo CSS layer contract, so
  every MCP-connected agent receives the layer-discipline rules (no unlayered CSS, no
  invented layer names, native nesting over sublayers, `layer(vendor)` for third-party
  CSS) before generating styles.

## 0.3.5

### Patch Changes

- 810b8ba: Minor improvements

## 0.3.4

### Patch Changes

- 483e30a: Minor improvements

## 0.3.3

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.

## 0.3.2

### Patch Changes

- b49e0ba: Fixed red flags.
- 6ee2f91: Experience fixes

## 0.3.1

### Patch Changes

- fc61671: Minor improvements

## 0.3.0

### Minor Changes

- 5bafdb6: Adoption-audit fixes (waves 1–2):

  - CLI: per-command `--help` for every command (short-circuits before any prompt, fetch, or install); real `--version` (was hardcoded `0.0.0`); `init --theme <name>` / `--yes` with non-TTY defaulting; theme prompts and `theme add` now offer all 12 themes; `add` prints the `@cascivo/themes` wiring when the project doesn't import tokens yet; `add` is transactional (fetch-all-then-write — a failed fetch never leaves a partial component or a stale lockfile entry) and mixed bare + registry specs install both; registry fetches retry with backoff and fall back to the last cached copy when offline; first-party templates (`dashboard`, `auth`, `landing`) install by bare name; `@cascivo/<name>` namespace added (`@cascade/<name>` remains as a legacy alias); `doctor` no longer false-positives on hook names in comments; lockfile renamed `cascade.lock` → `cascivo.lock` (legacy file read and migrated automatically); HTTP cache moved to `~/.cascivo/cache`.
  - Registry: entries carry the real library version and per-file sha256 hashes; `cascivo update --check` diffs hashes instead of the previously inert version compare.
  - MCP: real server version (was `0.0.0`); `cascivo-mcp` bin added (`cascade-mcp` kept as a legacy alias).
  - i18n/react: `Combobox` search input, `DataTable` pagination buttons, `Dock` nav, and `Steps` list now source their aria-labels from the built-in catalog (with `labels`/`ariaLabel` prop overrides) instead of hardcoded English.

- 5bafdb6: AI-layer delivery (audit wave 3):

  - `@cascivo/mcp` is self-contained: `tokens.catalog.json`, `context.json`, per-component `context/*.md`, `tokens.variants.json`, and `marketplace.json` are bundled into the published package, so `get_tokens`, `get_context`, `get_variant_matrix`, `validate_component`, `list_templates`, and `get_template` all work offline via `npx -y @cascivo/mcp` (previously `list_templates`/`get_template` silently returned an empty catalog for every external user, and the token/context tools required network access).
  - The marketplace catalog loader now falls back to the hosted copy and reports an explicit error when neither is available, instead of silently returning an empty catalog.
  - `get_component` responses include `version`, `files`, and per-file `fileHashes`, letting agents detect drift between installed copies and upstream.
  - One canonical artifact-host constant per package (`CASCIVO_HOST`) replaces scattered `cascivo.com` literals.
  - `@cascivo/ai` (StreamingText, AiLabel, Terminal, AiChat) is published for the first time — it was advertised in the README but marked private. First publish requires the trusted-publisher bootstrap in docs/RELEASING.md.

## 0.2.0

### Minor Changes

- f2f1c62: Add an app scaffold generator. The `cascivo create [name]` CLI command scaffolds a complete, ready-to-run app (Vite + React + TypeScript) pre-wired with the cascivo app shell, side navigation, header, and a chosen theme — one page per nav section, with signal-driven section switching. The MCP server exposes the same capability through a new `create_app` tool.

### Patch Changes

- bc69e5b: Derivable theming, semantic typography, canonical tokens
- bb3c77e: Templates and further improvements

## 0.1.8

### Patch Changes

- f0b5654: Fixes

## 0.1.7

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements

## 0.1.6

### Patch Changes

- aa3c6f3: Introduce Editor

## 0.1.5

### Patch Changes

- 8ecc7a2: Introduce Flow

## 0.1.4

### Patch Changes

- fa55081: SideNav improvements

## 0.1.3

### Patch Changes

- 5e58e32: Component eject

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
