# @cascivo/tokens

## 1.3.1

### Patch Changes

- dafb2cc: Accessibility fixes found by the workbench's axe sweep:

  - **Themes:** the static `--cascivo-color-text-on-destructive` / `--cascivo-color-text-on-accent` fallbacks of dark (destructive), midnight (both) and pastel (accent) were white on a light fill, below 3:1. Browsers without `contrast-color()` painted them; they are now dark ink, which is also what `contrast-color()` picks. A new check holds every theme's fallback to AA on its fill.
  - **Tokens:** `--cascivo-link-color` is declared on `[data-theme]` as well as `:root`, so a Link inside a scoped theme uses that theme's accent instead of the root theme's (3.67:1 on dark).
  - **Calendar:** each day is a `<button role="gridcell">` inside a presentational `<td>`, so `aria-selected` stays on the focused element and on a role ARIA allows it on. Tests that queried days by role `button` query `gridcell`.

- dafb2cc: `@cascivo/editor`'s colour tokens (`--cascivo-editor-*`) are declared on `[data-theme]` as well as `:root`, so a code editor inside a scoped theme uses that theme's surface, text and syntax colours instead of the root theme's. A light section inside a dark page no longer keeps the dark syntax hues, and the reverse.
- dafb2cc: Contrast fixes from a workbench axe sweep across all twelve themes: 101 findings in 7 themes before, 0 of 3060 checks after. Lightness only; hue and chroma are unchanged.

  - **Text on a fill:** pastel `--cascivo-color-primary-fg`, `--cascivo-color-accent-foreground` and `--cascivo-color-info-content`, midnight `--cascivo-color-accent-foreground` were white on a light fill (2.9–3.2:1); now dark ink. Primary buttons and info Badges in pastel, and Calendar's selected day in midnight, were the visible cases.
  - **Secondary text:** `--cascivo-color-foreground-muted` (and `--cascivo-color-text-subtle`, which points at it) darkened in pastel and minimal, so card, table, alert and form help text clears AA on every surface.
  - **Status ink:** `--cascivo-color-success-foreground` darkened in arcade, brutalist and flat (Badge, Alert titles); `--cascivo-color-destructive` darkened in pastel and lightened in cyberpunk, since 47 component rules use it as text.
  - **Code syntax:** `--cascivo-editor-syntax-keyword` and `-tag`, and CodeSnippet's keyword colour, read `--cascivo-color-accent-text` instead of the raw accent, which in warm, brutalist and pastel is a fill hue (1.4–2.9:1 as text).

  `accent-text-contrast` now holds every one of these token pairs to AA in every theme.

  `@cascivo/email`'s generated palettes follow the theme values.

## 1.3.0

### Minor Changes

- db3f056: AI components for work in progress. `AiStatus` names what an AI is doing (thinking,
  generating, done, failed, stopped), with a shimmering label and an optional Stop button. It
  announces each phase change once and never announces streamed tokens. `ShimmerText` is the
  "Thinking…" text sweep. `TypingIndicator` is the three-dot placeholder for a reply. `Reasoning`
  is a native `<details>` panel that opens and shimmers while the model reasons, then closes and
  reads "Thought for N seconds". `AiBadge` is the "AI" provenance marker, with an optional
  toggletip explanation. `Skeleton` gains `ai`, which gives a placeholder the AI tint (Carbon's AI
  skeleton). New semantic tokens `--cascivo-color-ai`, `-ai-subtle`, `-ai-border` and `-ai-sheen`
  are derived from each theme's own colours, so every theme gets them. New keyframe
  `cascivo-text-shimmer`. New `builtin.aiStatus`, `builtin.reasoning`, `builtin.aiBadge` and
  `builtin.typingIndicator` messages (en, de). Every loop stops under
  `prefers-reduced-motion`. `@cascivo/eslint-plugin`'s vocabulary maps the foreign names `AILabel`,
  `AISkeleton`, `TextShimmer`, `ThinkingBar` and `TypingDots` to them.

## 1.2.0

### Minor Changes

- b2a3d94: The tokens ship as W3C Design Tokens (DTCG 2025.10) in `@cascivo/tokens/dtcg/`:
  `cascivo.tokens.json` (semantic tokens kept as aliases of the primitives), one
  `themes/<theme>.tokens.json` per first-party theme, and `cascivo.resolver.json`, which
  selects a theme through a `theme` modifier. Figma variables, Tokens Studio, Style Dictionary
  and Terrazzo can load them directly. Values DTCG cannot express (`calc()`, `em`) are listed
  under `$extensions["com.cascivo"].notExported`.

## 1.1.1

### Patch Changes

- a076a68: Editor: line numbers, the current-line highlight and the left gutter all survive a soft wrap

  Reported from an adopter running `CodeEditor` with `wrap` over markdown, and reproduced in
  Chromium against the shipped CSS: with soft wrap on, a single long line broke the whole left
  edge of the editor.

  - **Line numbers drifted one row per wrap.** The gutter was a separate column whose rows were
    one line box each, while the code column's rows grew with the text. A line that wrapped to two
    visual rows put `6` next to the continuation of line 5, and the last line got no number at all.
    The number and its line are now adjacent cells of **one CSS grid row**, so the row grows once
    and both grow with it — there is nothing left to keep in sync.
  - **The current-line highlight lit only the first visual row** of a wrapped line: it was
    positioned by `caretLine * 1lh` and was `1lh` tall. Under wrap it is now placed on the caret's
    grid row and takes that row's height, so it covers every visual row of the line. Not wrapping,
    where rows are uniform and large documents window to a slice, keeps the arithmetic.
  - **The gap between the border and the code could collapse to nothing.** It was padding on the
    gutter and on the highlight/edit layers, and a host reset — Tailwind Preflight's
    `* { padding: 0 }` is the one that hit — outranks `@layer cascivo.component`. The gutter's
    width is now a grid track, the gap after it a `column-gap`, and the textarea's alignment an
    `inset-inline-start`. A `padding: 0` reset can collapse none of the three, so the editing
    surface also cannot drift off the layer it is overlaid on.

  Two new override points come with it, both documented on `CodeEditor` and `Highlight`:
  `--cascivo-editor-gutter-width` (default: as wide as the widest line number) and
  `--cascivo-editor-gutter-gap`. Line numbers stay `aria-hidden` and unselectable, so they are
  neither announced nor copied with the code, and they now stay visible in forced-colors mode,
  where the highlight layer used to be hidden wholesale.

## 1.1.0

### Minor Changes

- 00c1a9e: Enforce the styling contract: a `--cascivo-*` token or `data-cascivo-*` hook that does not
  exist is now reported instead of silently doing nothing.

  CSS drops an unknown custom property without a word, and a selector that matches nothing is
  not an error either — so a misspelled token had no diagnostic anywhere in the toolchain. It
  found `--cascivo-button-bg`, taught as the worked example of the override ladder's first rung
  in four guides and defined by no stylesheet in the repo.

  - **`@cascivo/eslint-plugin`** adds `cascivo/token-values`, which reports an unknown
    `--cascivo-*` custom property in a JSX `style` prop (through the `as CSSProperties` cast
    React forces) and names the token that exists, including when the words are in the wrong
    order (`--cascivo-text-color` → `--cascivo-color-text`).
  - **`@cascivo/eslint-config`** enables it at `warn` as `cascivoTokenValues`.
  - **`@cascivo/tokens`** publishes `./style-contract` and `./style-contract.json`:
    `CascivoComponentToken`, `CascivoAnyToken`, `CascivoStyleHook`, and `CascivoTokenStyle` for
    `satisfies`-checking an inline style before the cast erases the name.
  - **`cascivo`** adds the `unknown-token` and `unknown-style-hook` audit rules at error level,
    covering CSS files as well as TSX.

  All four read one generated name set, so they cannot disagree with each other or with the
  shipped CSS.

  **Button gains the per-variant background tokens the docs had been promising.**
  `--cascivo-button-{primary,secondary,ghost,destructive}-bg`, plus `-bg-hover` for each and
  `-bg-active` for primary, each falling back to the semantic default it replaced — so nothing
  changes until you set one. This is the rung-1 lever for restyling one button family without
  moving `--cascivo-color-primary` under every other primary surface in the subtree. The
  foreground deliberately stays on the semantic tier: a background light enough to need dark
  text still needs `--cascivo-color-primary-fg` set alongside it.

## 1.0.0

### Major Changes

- f1c8292: Join the `1.x` line.

  These four carry **no breaking change**. The major is the version-alignment decision recorded
  in [`docs/UPGRADING.md`](../docs/UPGRADING.md#which-packages-are-covered): the packages an
  application depends on at runtime move to `1.x` together, so `@cascivo/*` reads as one system
  in a lockfile instead of the `0.0.4`–`0.18.0` spread an adopter called out in the 2026-07 pair
  report ("everything is pre-1.0 and versions don't align").

  The lockstep family — `core`, `react`, `charts`, `editor`, `flow`, `i18n`, `storage`, `ai` —
  reaches `1.0.0` through the changeset that removes the deprecated surfaces, and the
  `fixed` group in `.changeset/config.json` keeps them on one version.

  Tooling packages stay on `0.x` and say so: `@cascivo/mcp`, `@cascivo/registry`,
  `@cascivo/docs`, `@cascivo/docspack`, `@cascivo/eslint-config`, `@cascivo/eslint-plugin`,
  `@cascivo/vite-plugin` and `@cascivo/platform`. `@cascivo/platform` in particular is an early
  experiment in platform-idiomatic geometry and motion; a 1.0 promise would be wrong for it.

  Upgrading from the last `0.x` of any of these four is a no-op beyond the version number.

### Patch Changes

- a0bb1cf: Release every published package.

  This changeset names all twenty published packages so the next release cuts a version for each
  of them, including the four that no other pending changeset touches (`@cascivo/docs`,
  `@cascivo/docspack`, `@cascivo/eslint-plugin`, `@cascivo/vite-plugin`).

  The bump is `patch` everywhere; where another pending changeset asks for a `minor` or `major`,
  that higher bump still wins.

## 0.5.11

### Patch Changes

- 00b74e9: Run the release train so the stranded 0.17.0 reaches npm and the recovery path
  gets exercised on a real release.

  No package source changed in this PR — the fixes are the Tag visual baselines
  and `release.yml`'s new `Publish any stranded versions` step. But `release.yml`
  only triggers on pushes that touch `.changeset/**`, so without a changeset
  merging it would not start a release at all, and the step meant to unstrand
  0.17.0 would sit unverified until some unrelated changeset happened to land.

  Bumping the whole published set matches the 2026-08-11 changeset it lands
  beside: npm is behind `main` on every package, not just the ones whose source
  moved, and a partial bump would leave the rest still disagreeing.

## 0.5.10

### Patch Changes

- 3fcf3f1: Bump every published package so the next release run publishes the whole set.

  The 0.17.0 bump landed on `main` but never reached npm: the release job's build
  died inside `changesets/action` with `Failed to spawn process: Resource
temporarily unavailable (os error 11)` — an `EAGAIN` write to that action's
  stdout pipe, not a build failure. This changeset re-cuts the whole set on top of
  the workflow fix, so every package publishes from a release that runs its build
  in a runner-owned step.

## 0.5.9

### Patch Changes

- 66b251d: Bump every published package so the next release run publishes the whole set.
  Packages that carried no substantive change of their own have fallen behind the
  rest of the workspace; this gives each of them a real new version so the
  published set stays in lockstep.

## 0.5.8

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

## 0.5.7

### Patch Changes

- 9841d27: Fix CSS custom properties that resolved to nothing, and complete the token catalog.

  18 shipped `var(--cascivo-…)` reads referenced properties that are declared nowhere and had
  no fallback, so the declaration silently did not apply — `--cascivo-text-secondary`,
  `--cascivo-color-danger`, `--cascivo-font-size-sm`, `--cascivo-color-neutral-200` and
  friends, all near-misses for a real token. Affected shipped CSS across components, layouts
  and two charts (`Bullet`'s range fills and `Heatmap`'s `color-mix` base).

  `tokens.catalog.json` — advertised as a closed set — was generated from the token and theme
  stylesheets only, so every per-component knob was invisible to anyone validating against it.
  It now includes component-declared tokens and author hooks: 266 → 317 entries.

## 0.5.6

### Patch Changes

- 3ec6aaf: Minor fixes

## 0.5.5

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

## 0.5.4

### Patch Changes

- 4172611: Bump every published package so the next release run publishes the whole set. The
  release drift gate had been failing on non-reproducible `regen` output (see PR #179),
  so packages carrying no substantive change of their own were left behind at versions
  older than the rest of the workspace. This changeset gives each of them a real new
  version, keeping the published set in lockstep.

## 0.5.3

### Patch Changes

- dfc24e4: Documentation updates
- db4fa0d: Docs

## 0.5.2

### Patch Changes

- 0b6b44e: Force a version bump across every published package to verify the changesets
  publish patch fix (see the release workflow fix in PR #168): several packages
  had been stuck re-publishing their already-released version on every release
  run and failing with a spurious E403, because the "already published" error
  detection missed pnpm's actual error shape. This changeset gives every
  package a real new version so the next release run exercises a genuine
  publish for all of them, not just the ones with substantive changes.

## 0.5.1

### Patch Changes

- 958fd6f: Every published package now exports `./package.json`, so
  `require.resolve('@cascivo/<pkg>/package.json')` resolves instead of throwing
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. Previously only `@cascivo/react` exposed it, which
  tripped version probes, bundler plugins, and inspection tooling on the other packages.

## 0.5.0

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

## 0.4.1

### Patch Changes

- 810b8ba: Minor improvements

## 0.4.0

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

## 0.3.8

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.

## 0.3.7

### Patch Changes

- b49e0ba: Fixed red flags.
- 6ee2f91: Experience fixes

## 0.3.6

### Patch Changes

- fc61671: Minor improvements

## 0.3.5

### Patch Changes

- bc69e5b: Derivable theming, semantic typography, canonical tokens
- bb3c77e: Templates and further improvements

## 0.3.4

### Patch Changes

- f0b5654: Fixes

## 0.3.3

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements

## 0.3.2

### Patch Changes

- aa3c6f3: Introduce Editor

## 0.3.1

### Patch Changes

- fa55081: SideNav improvements

## 0.3.0

### Minor Changes

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

### Patch Changes

- a8822a8: Improvements
- 72d0086: New location

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
