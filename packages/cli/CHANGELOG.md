# cascivo

## 0.5.2

### Patch Changes

- 21e7ddb: `cascivo doctor`: warn when a Vite SSR framework is present without the cascivo
  `ssr.noExternal` config.

  On TanStack Start / vite-ssr / Remix, cascivo's per-component `.css` side-effect
  imports crash a bare server-side ESM loader with `Unknown file extension ".css"`
  unless the packages are marked `ssr.noExternal` (or the `cascivoSsr()` plugin is
  used). `doctor` now detects the framework, checks the vite config, and prints the
  one-line fix + recipe link when it's missing — turning the cryptic runtime crash
  into an up-front diagnosis (2026-07-20 report, blocker #1).

- 21e7ddb: Raise the `@preact/signals-react` peer floor from `>=2.0.0` to `>=3.0.0`.

  React 19 removed the internal export that signals-react 2.x imports, so a 2.x
  runtime fails to load under React 19 (`SyntaxError: … '__SECRET_INTERNALS…'`). The
  old `>=2` floor let a resolver pick that broken build. signals-react 3.x still
  supports React 16.14+/17/18, so the new floor costs React-18 users nothing.

  If a lockfile carried over from an earlier install pins signals-react 2.x, run
  `cascivo doctor` — it now flags the mismatch (error on React 19, warning on React 18)
  with the exact upgrade command.

## 0.5.1

### Patch Changes

- 958fd6f: Every published package now exports `./package.json`, so
  `require.resolve('@cascivo/<pkg>/package.json')` resolves instead of throwing
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. Previously only `@cascivo/react` exposed it, which
  tripped version probes, bundler plugins, and inspection tooling on the other packages.
- Updated dependencies [958fd6f]
  - @cascivo/registry@0.2.1

## 0.5.0

### Minor Changes

- 0a3d756: CLI adopter-friction fixes from the TanStack Start experience report:

  - **Package-manager detection now works in workspaces.** `init`/`add`/`create`
    detect the package manager by `--package-manager`/`--pm` flag,
    `CASCIVO_PACKAGE_MANAGER`, the invoking PM (`npm_config_user_agent`), then an
    upward walk for a lock file or `packageManager` field — so a pnpm/yarn/bun
    monorepo where the lock file lives at the repo root no longer falls back to
    `npm` and crashes. Failed installs print the exact command to run by hand.
  - **`init` installs and states the complete dependency set** —
    `@cascivo/core`, `@cascivo/tokens`, `@cascivo/themes`, the
    `@preact/signals-react` peer, plus `cascivo` as a dev dependency for the
    generated config's type import — and prints a one-line dependency summary.
    `--no-install` writes files and prints the install commands instead.
  - **`cascivo add chart/*` now installs `@cascivo/charts`** (deduped, via the
    detected PM) and prints the import lines, instead of printing instructions and
    adding nothing. `--no-install` restores print-only.
  - **`cascivo add stack`** prints a note clarifying that `Stack` is a z-axis
    card-pile, not a vertical spacing layout (use `Flex`).
  - **`cascivo doctor`** in an adopter project now verifies the runtime
    dependencies copied source needs (including the `@preact/signals-react` peer)
    are declared, turning an opaque "cannot find module" build failure into a
    diagnosed condition with a fix.
  - All install hints now use the detected package manager instead of hardcoded
    `npm install`.

## 0.4.3

### Patch Changes

- Updated dependencies [2945720]
  - @cascivo/registry@0.2.0

## 0.4.2

### Patch Changes

- 6cb3327: Shadcn compat registry, llms-full.txt
- Updated dependencies [6cb3327]
  - @cascivo/registry@0.1.12

## 0.4.1

### Patch Changes

- 62a02e6: DX improvements

## 0.4.0

### Minor Changes

- c335ed5: `cascivo audit` gains two layer-discipline rules (both `warn`, never fail the
  build): `unlayered-css` flags top-level CSS rules outside any `@layer` block
  (accessibility-guarantee media queries like `forced-colors` are exempt), and
  `vendor-css-import` flags bare `*.css` imports from `node_modules` that can't be
  layered — pointing you at the `@import url(…) layer(vendor)` recipe. A new
  `pnpm unlayered:check` guards shipped CSS against the same trap in CI.
- c335ed5: Layer order: add a declared `cascivo.blocks` slot to the canonical `@layer`
  statement (between `cascivo.theme` and `cascivo.override`), and fold the
  `@function` helpers from the undeclared `cascivo.functions` layer into
  `cascivo.tokens`.

  Previously the shipped composite blocks (`@layer cascivo.blocks.<name>`) and the
  `@function` helpers used layer names that no order statement declared, so they were
  appended **above** `cascivo.override` and silently beat the consumer escape hatch.
  They now sit in their intended slots: blocks just above themes, functions with the
  tokens.

  Migration: if you relied on a shipped block's CSS beating your
  `@layer cascivo.override { … }` rules, that was the bug this fixes — move those
  overrides to win as intended. The `cascivo create` scaffold and example apps now
  emit the 7-layer canonical statement.

## 0.3.6

### Patch Changes

- 810b8ba: Minor improvements
- Updated dependencies [810b8ba]
  - @cascivo/registry@0.1.11

## 0.3.5

### Patch Changes

- dd05e9b: Ship one canonical CSS `@layer` order and a real override escape hatch.

  The layer order was previously restated in several places that disagreed on whether
  `theme` or `component` wins, so overriding tokens behaved differently depending on
  which stylesheet loaded first. Now a single authoritative statement —
  `@layer cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.theme, cascivo.override;`
  — ships from `@cascivo/tokens/layers.css` and is emitted first by every entry path
  (`@cascivo/tokens`, `@cascivo/themes/all`, and the `@cascivo/react` aggregate
  `styles.css`).

  - New top-most `cascivo.override` layer: put brand/one-off overrides in
    `@layer cascivo.override { … }` and they beat tokens, components, and themes with
    no `:root:not([data-theme])` specificity fight.
  - New export `@cascivo/tokens/layers.css`.
  - The CLI scaffold (`cascivo create`) now emits the canonical order (adds
    `cascivo.base` and `cascivo.override`).

  Behavior note: the `@cascivo/themes/all` bundle now makes `theme > component`
  explicit (previously implied `component > theme` via import order). This only affects
  a consumer who relied on a component redefining a semantic token in
  `@layer cascivo.component` and winning over the active theme — an anti-pattern under
  cascade's "themes own the semantic tier" model. No token values changed.

- 483e30a: Minor improvements
- Updated dependencies [483e30a]
  - @cascivo/registry@0.1.10

## 0.3.4

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.
- Updated dependencies [e29ad6e]
  - @cascivo/registry@0.1.9

## 0.3.3

### Patch Changes

- b49e0ba: Fixed red flags.
- 1d7599a: Fix version issues
- 6ee2f91: Experience fixes
- Updated dependencies [b49e0ba]
- Updated dependencies [6ee2f91]
  - @cascivo/registry@0.1.8

## 0.3.2

### Patch Changes

- fc61671: Minor improvements
- Updated dependencies [fc61671]
  - @cascivo/registry@0.1.7

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
