# @cascivo/react

## 0.3.8

### Patch Changes

- 6b50710: Addition chart types, and general chart improvements
- bb3c77e: Templates and further improvements
- Updated dependencies [6b50710]
- Updated dependencies [bb3c77e]
  - @cascivo/i18n@0.1.11
  - @cascivo/core@0.2.3

## 0.3.7

### Patch Changes

- f0b5654: Fixes
- Updated dependencies [f0b5654]
  - @cascivo/core@0.2.2
  - @cascivo/i18n@0.1.10

## 0.3.6

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements
- Updated dependencies [2458391]
- Updated dependencies [52c08b6]
  - @cascivo/core@0.2.1
  - @cascivo/i18n@0.1.9

## 0.3.5

### Patch Changes

- 0c2a9f7: Tree-shakeable css

## 0.3.4

### Patch Changes

- Updated dependencies [4554af1]
  - @cascivo/core@0.2.0
  - @cascivo/i18n@0.1.8

## 0.3.3

### Patch Changes

- aa3c6f3: Introduce Editor
- Updated dependencies [aa3c6f3]
  - @cascivo/i18n@0.1.5

## 0.3.2

### Patch Changes

- 8ecc7a2: Introduce Flow
- Updated dependencies [8ecc7a2]
  - @cascivo/i18n@0.1.4

## 0.3.1

### Patch Changes

- fa55081: SideNav improvements
- Updated dependencies [fa55081]
  - @cascivo/core@0.1.3
  - @cascivo/i18n@0.1.3

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
- Updated dependencies [72d0086]
  - @cascivo/core@0.1.2
  - @cascivo/i18n@0.1.2

## 0.2.1

### Patch Changes

- e9998ab: Further improvements
- Updated dependencies [e9998ab]
  - @cascivo/core@0.1.1
  - @cascivo/i18n@0.1.1

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

### Patch Changes

- Updated dependencies [b23575c]
  - @cascivo/core@0.1.0
  - @cascivo/i18n@0.1.0
