# @cascivo/themes

## 0.4.12

### Patch Changes

- 3fcf3f1: Bump every published package so the next release run publishes the whole set.

  The 0.17.0 bump landed on `main` but never reached npm: the release job's build
  died inside `changesets/action` with `Failed to spawn process: Resource
temporarily unavailable (os error 11)` — an `EAGAIN` write to that action's
  stdout pipe, not a build failure. This changeset re-cuts the whole set on top of
  the workflow fix, so every package publishes from a release that runs its build
  in a runner-owned step.

- Updated dependencies [3fcf3f1]
  - @cascivo/tokens@0.5.10

## 0.4.11

### Patch Changes

- 66b251d: Bump every published package so the next release run publishes the whole set.
  Packages that carried no substantive change of their own have fallen behind the
  rest of the workspace; this gives each of them a real new version so the
  published set stays in lockstep.
- Updated dependencies [66b251d]
  - @cascivo/tokens@0.5.9

## 0.4.10

### Patch Changes

- 97da94e: Repair the two CI gates failing on `main`, and refresh the generated registry artifacts.

  No package's runtime code changes here — every bump in this release is version-only.

  **`drift`** — `clientJs` reached the component manifests, but the 103 generated
  per-component files under `apps/site/public/r/` came from a branch cut before it, so merging
  the two left every one of them a field short. Regenerated; no other artifact moved.

  **`verify`** — `isolated:check`, the canary that type-checks packed tarballs in a strict,
  non-hoisted consumer workspace, was dying in `pnpm install` rather than in the type check it
  exists to run:

  ```
  ERR_PNPM_NO_MATCHING_VERSION  No matching version found for
  @cascivo/core@^0.15.0 while fetching it from https://registry.npmjs.org/
  ```

  `pnpm pack` rewrites `workspace:^` to `^<version>`, so the packed `@cascivo/react` asked the
  registry for a version that does not exist until release day — the fixture broke on every
  version bump that landed ahead of a publish, which is exactly what happened. Every
  inter-cascivo edge is now pinned to the tarball built from the commit under test, via
  `overrides` in the fixture's `pnpm-workspace.yaml`. The location matters: pnpm 10+ no longer
  reads the `pnpm` field from `package.json` and only warns about it, so the `pnpm.overrides`
  spelling silently does nothing.

  That also closes a quieter hole. Even when the versions did resolve, the fixture type-checked
  the freshly-built `@cascivo/react` against the last **published** `@cascivo/core` rather than
  the one just built — a mix, not the build under test.

  A new guard fails the fixture if any `@cascivo/*` dependency falls outside its `PACKAGES`
  list, since such an edge would slip back to registry resolution unnoticed — the silent-skip
  failure mode a canary must never have.

- Updated dependencies [97da94e]
  - @cascivo/tokens@0.5.8

## 0.4.9

### Patch Changes

- 3ec6aaf: Minor fixes
- Updated dependencies [3ec6aaf]
  - @cascivo/tokens@0.5.6

## 0.4.8

### Patch Changes

- 6f318dd: Fix the 2026-07-26 adopter pair — two same-day dashboard reports on published 0.12.0.

  **The manifest's prose now reaches the shipped `.d.ts`.** Two agents built the same dashboard
  against the same version; the one who read `llms.txt` was saved by the ⚠ on `Flex`'s
  `direction` default, the one who read `@cascivo/react/dist/index.d.ts` hit it three times.
  `pnpm regen` now republishes every documented default and warning as TSDoc on the TypeScript
  member (124 components), and `tsdoc-parity` fails a PR that lets the two drift.

  **Router links have a supported styling path.** `Link` gains `asChild`, so an in-content
  router link can carry cascivo's styling without a hand-rolled copy of its CSS.
  `Button`/`IconButton`/`Item`/`Tile` set `text-decoration: none` (the UA anchor underline
  survived onto `asChild` buttons) and style `[aria-disabled='true']` like `:disabled` (an `<a>`
  can never match `:disabled`). `--cascivo-link-color` is now a declared, catalogued token.
  New guide: `docs/USING-WITH-A-ROUTER.md`.

  **`cascivo audit --ai` no longer fails correct code.** Four independent root causes: duplicate
  display names collapsing in the contract (`AppShell`, `Calendar`), `children` being looked for
  as an attribute, `required` drift the manifests were never checked for, and aliased imports
  resolving to the pre-`as` name (so a router's `<Link to>` was audited against cascivo's
  contract). A realistic router dashboard is now audited in CI and must report zero errors.

  **Charts: axis chrome and `ComboChart`.** `Axis` gains `orientation="y-right"` — a right axis
  used to draw its labels inside the plot. `rightMarginForLabels` reserves room for a right axis
  and for the final x-label's overhang (`7/26/2026` → `7/26/202`). `ComboChart` now sizes its
  margins, strides crowded category labels, ships a legend, includes the line series in its
  screen-reader table (a WCAG 2.2-AA defect), and warns on index-misaligned or wildly-mismatched
  series. Overlapping `AreaChart` fills drop opacity so the plot stops contradicting its legend.
  Every chart's `width` prop now documents that **omitting it** is the responsive mode.

  **One vocabulary for status and progress.** `Tone` (`neutral | info | success | warning |
danger`) and `Progress` (`pending | active | complete | error`) in `@cascivo/core`; `Badge`,
  `Tag`, `Status`, `Notification`, `Steps` and `Timeline` accept them plus every historical
  spelling. `Filter`/`StructuredList`/`Progress` accept `ariaLabel` alongside `aria-label`;
  `OverflowMenu` items accept `id` alongside `value`. All additive.

  **Also:** `Card padding="none"` no longer strips padding from `CardHeader`/`CardContent`;
  11 field components and the chart frame shrink correctly inside a grid/flex track; `Kpi`'s
  chrome moved from inline styles into a layered stylesheet (it was un-overridable);
  `Stat` gains `card` so it matches `Kpi`; `AppShell` extends `HTMLAttributes` so its documented
  tokens have an application point; `PieChart` gains `tooltip`; `DataTable` only uses a fixed
  layout when every column is sized, and gains `Column.minWidth`; `PageHeader` is exported.

  **Card padding no longer doubles.** A card and its `CardHeader`/`CardContent` both applied the
  padding, so a default `<Card><CardHeader>` sat its title 48px from the border. The
  subcomponents now own the inset when they are present. Found by a new computed-style canary
  that renders the shipped `dist` in headless Chromium — the class of defect (an `asChild`
  button's UA underline, a card's resolved padding) that jsdom cannot see and a stylesheet grep
  cannot prove.

- Updated dependencies [6f318dd]
  - @cascivo/tokens@0.5.5

## 0.4.7

### Patch Changes

- 4172611: Bump every published package so the next release run publishes the whole set. The
  release drift gate had been failing on non-reproducible `regen` output (see PR #179),
  so packages carrying no substantive change of their own were left behind at versions
  older than the rest of the workspace. This changeset gives each of them a real new
  version, keeping the published set in lockstep.
- Updated dependencies [4172611]
  - @cascivo/tokens@0.5.4

## 0.4.6

### Patch Changes

- dfc24e4: Documentation updates
- db4fa0d: Docs
- Updated dependencies [dfc24e4]
- Updated dependencies [db4fa0d]
  - @cascivo/tokens@0.5.3

## 0.4.5

### Patch Changes

- 5c55ba7: Make the prebuilt path impossible to ship grayscale, and put the quickstart where offline/AI adopters actually read it.

  - `@cascivo/react/styles.css` now bundles the design tokens **and** the light & dark themes, not just component structure. Importing that one file yields a fully-colored app — no separate `@cascivo/themes` import required for the no-bundler path. (Size grows ~30 KB to ~305 KB / ~40 KB gzip; the other 10 themes stay opt-in via `@cascivo/themes`.)
  - `@cascivo/themes` is now a real **dependency** of `@cascivo/react`, so it installs automatically. You still import its CSS once on the bundler path (per-component CSS + one theme import), but there is no second `pnpm add` and no pnpm phantom-dependency error.
  - `ThemeProvider` emits a one-time **dev-mode** `console.warn` when it sets a `data-theme` for which no `--cascivo-color-*` token resolves — i.e. you forgot the theme CSS import and every component would render grayscale. The message names the exact fix. Production is unaffected (dead-code-eliminated).
  - The published `dist/index.d.ts` now opens with a quickstart banner (themes import, the sibling `@cascivo/charts`/`@cascivo/icons` packages, the `useSignals()` rule, and the offline `npx @cascivo/docs` docs channel) — the declaration file is the primary documentation for adopters who can't reach npmjs.com or cascivo.com.
  - Package descriptions cross-reference the family and the offline docs package.

## 0.4.4

### Patch Changes

- 0b6b44e: Force a version bump across every published package to verify the changesets
  publish patch fix (see the release workflow fix in PR #168): several packages
  had been stuck re-publishing their already-released version on every release
  run and failing with a spurious E403, because the "already published" error
  detection missed pnpm's actual error shape. This changeset gives every
  package a real new version so the next release run exercises a genuine
  publish for all of them, not just the ones with substantive changes.
- Updated dependencies [0b6b44e]
  - @cascivo/tokens@0.5.2

## 0.4.3

### Patch Changes

- 21e7ddb: Make `@cascivo/tokens` a direct dependency of `@cascivo/themes` instead of a peer.

  The theme CSS `@import`s `@cascivo/tokens`, so it is a hard runtime edge — but as a
  peer it only resolved when the consumer's package manager auto-installed peers (pnpm's
  default). On npm, yarn-classic, or with `auto-install-peers=false`, the `@import`
  dead-ended and every component rendered unstyled with no error pointing at the cause
  (2026-07-20 adopter report). As a direct dependency it installs automatically on every
  package manager. A new `css-imports` guard keeps cross-package CSS `@import` targets as
  direct dependencies going forward.

## 0.4.2

### Patch Changes

- 958fd6f: Every published package now exports `./package.json`, so
  `require.resolve('@cascivo/<pkg>/package.json')` resolves instead of throwing
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. Previously only `@cascivo/react` exposed it, which
  tripped version probes, bundler plugins, and inspection tooling on the other packages.

## 0.4.1

### Patch Changes

- 2945720: Adopter-friction fixes (TanStack Start / Vite SSR report):

  - **vite-plugin:** new `cascivoSsr()` plugin sets `ssr.noExternal` for every
    `@cascivo/*` package, so Vite SSR / TanStack Start / workerd no longer throw
    `Unknown file extension ".css"`. See docs/USING-WITH-VITE-SSR.md.
  - **registry:** page blocks are now projected into `/r/<name>.json` and
    `/r/shadcn/block-<name>.json` (was: components only), so blocks install via the
    shadcn CLI and appear in every machine-readable surface.
  - **mcp:** new `search_icons` tool resolves an icon by intent or foreign name
    (LayoutDashboard→Dashboard, Rocket→Spaceship), backed by the icon catalog.
  - **icons:** added `GitBranch`/`GitCommit`/`GitMerge`/`GitPullRequest`, plus an
    alias layer so familiar Lucide/Radix names resolve to the cascivo export
    (surfaced as an `aliases` field in icons.catalog.json).
  - **charts:** area-chart solid-fill opacity is now the `--cascivo-chart-fill-opacity`
    token (default 0.25), raised on dark themes so fills keep their hue instead of
    muddying into the dark surface.
  - **themes:** new `--cascivo-chart-fill-opacity` token (0.4 on dark-surface themes,
    0.25 elsewhere).

## 0.4.0

### Minor Changes

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

## 0.3.1

### Patch Changes

- 810b8ba: Minor improvements

## 0.3.0

### Minor Changes

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

### Patch Changes

- 483e30a: Minor improvements

## 0.2.11

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.

## 0.2.10

### Patch Changes

- b49e0ba: Fixed red flags.
- 6ee2f91: Experience fixes

## 0.2.9

### Patch Changes

- fc61671: Minor improvements

## 0.2.8

### Patch Changes

- 5bafdb6: Documentation pass (audit waves 4–5): package READMEs rewritten or corrected —
  `@cascivo/react` doc links now absolute (they dead-ended on npmjs.com),
  `@cascivo/registry` documents its real exports and consumers, and
  `@cascivo/themes` lists all 12 themes and import options. (The private
  render package's wrong ViewConfig example was also fixed.)

## 0.2.7

### Patch Changes

- bc69e5b: Derivable theming, semantic typography, canonical tokens
- bb3c77e: Templates and further improvements

## 0.2.6

### Patch Changes

- f0b5654: Fixes

## 0.2.5

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements

## 0.2.4

### Patch Changes

- fa55081: SideNav improvements

## 0.2.3

### Patch Changes

- a8822a8: Integration-feedback fixes (from the bpmn-kit and pagome migrations):

  - **tokens:** `@function` helpers (`--cascivo-step`/`--cascivo-scale`) are no longer
    auto-imported from the main token CSS — they are now opt-in via the new
    `@cascivo/tokens/functions.css` export. This removes the `@import must precede all
other statements` warning and the lightningcss / Tailwind v4 `Unknown at rule:
@function` break for every consumer. Every call site already ships a static
    fallback, so default output is unchanged. Also adds the missing
    `--cascivo-text-4xl` (+ `-fluid`) type-scale token.
  - **react:** `Button` now supports `asChild` (render button styling on a real
    `<a href>`); `Sheet`'s `title` is now optional and `ReactNode`-typed (labels the
    dialog via `aria-labelledby`). Adds the conventional `"./package.json"` export.
  - **themes:** tightens the `@cascivo/tokens` peer-dependency range to `>=0.2.0`.

- a8822a8: Improvements
- 72d0086: New location

## 0.2.2

### Patch Changes

- e8758f2: Improvements

## 0.2.1

### Patch Changes

- 0903bd6: Cyperpunk theme

## 0.2.0

### Minor Changes

- 3454ec6: v37 migration hardening — fixes from the boringtools migration feedback.

  **Fixed (#1):** `@cascivo/react`'s `exports["./styles.css"]` pointed at a
  non-existent `./dist/cascade.css`; it now resolves to the emitted
  `./dist/cascivo.css`. Strict bundlers (Vite 6 and any tool that enforces the
  `exports` map) no longer need a `patch-package` patch to import the stylesheet.

  **BREAKING (#2/#5):** the shipped CSS `@layer` namespace was renamed from
  `cascade.*` to `cascivo.*` (`cascivo.base`, `cascivo.theme`, `cascivo.component`,
  …). Any consumer that referenced the old `@layer cascade.*` names in their own
  `@layer` ordering must rename them to `cascivo.*`. The brand is `cascivo`; the
  old name leaked into consumers' stylesheets. See `docs/CSS-LAYERS-PITFALL.md` for
  the recommended ordering (`cascivo.base < cascivo.theme < cascivo.component`).

  A `brand:check` guard (`scripts/brand-guard.mjs`) now fails CI if the old
  `cascade` brand reappears in shipped CSS layer names, package descriptions, or
  the published `@cascivo/react` entry JSDoc.

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
