# @cascivo/themes

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
