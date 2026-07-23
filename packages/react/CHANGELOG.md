# @cascivo/react

## 0.11.0

### Minor Changes

- 5c55ba7: Make the prebuilt path impossible to ship grayscale, and put the quickstart where offline/AI adopters actually read it.

  - `@cascivo/react/styles.css` now bundles the design tokens **and** the light & dark themes, not just component structure. Importing that one file yields a fully-colored app — no separate `@cascivo/themes` import required for the no-bundler path. (Size grows ~30 KB to ~305 KB / ~40 KB gzip; the other 10 themes stay opt-in via `@cascivo/themes`.)
  - `@cascivo/themes` is now a real **dependency** of `@cascivo/react`, so it installs automatically. You still import its CSS once on the bundler path (per-component CSS + one theme import), but there is no second `pnpm add` and no pnpm phantom-dependency error.
  - `ThemeProvider` emits a one-time **dev-mode** `console.warn` when it sets a `data-theme` for which no `--cascivo-color-*` token resolves — i.e. you forgot the theme CSS import and every component would render grayscale. The message names the exact fix. Production is unaffected (dead-code-eliminated).
  - The published `dist/index.d.ts` now opens with a quickstart banner (themes import, the sibling `@cascivo/charts`/`@cascivo/icons` packages, the `useSignals()` rule, and the offline `npx @cascivo/docs` docs channel) — the declaration file is the primary documentation for adopters who can't reach npmjs.com or cascivo.com.
  - Package descriptions cross-reference the family and the offline docs package.

- 5c55ba7: `useTheme()` now returns the theme **name as a plain string**, not a signal.

  `const [theme, setTheme] = useTheme()` — `theme` is a `string` you read directly (`theme === 'dark'`), and the component re-renders on change with no signal handling. Previously the first tuple element was a `Signal<string>` whose `.value` you had to read, which repeatedly led React adopters (no signals transform) to mirror the theme in `useState` — the exact anti-pattern cascivo bans.

  **Breaking:** if you read `theme.value`, drop the `.value` — `theme` is already the string (TypeScript flags this: `.value` on a `string` is an error). Code that needs the underlying signal (`computed()`, `effect()`, Preact) can get it from the new `themeSignal()` export.

  Also: the spacing-scale type used by layout `gap` props is now exported as `SpaceStep` (a single shared declaration), so compiler errors name `SpaceStep` instead of the bundler's `SpaceStep$3`/`$4` aliases.

### Patch Changes

- Updated dependencies [5c55ba7]
  - @cascivo/themes@0.4.5

## 0.10.1

### Patch Changes

- 0b6b44e: Force a version bump across every published package to verify the changesets
  publish patch fix (see the release workflow fix in PR #168): several packages
  had been stuck re-publishing their already-released version on every release
  run and failing with a spurious E403, because the "already published" error
  detection missed pnpm's actual error shape. This changeset gives every
  package a real new version so the next release run exercises a genuine
  publish for all of them, not just the ones with substantive changes.
- Updated dependencies [0b6b44e]
  - @cascivo/core@0.5.2
  - @cascivo/i18n@0.2.10

## 0.10.0

### Minor Changes

- e81a0a7: SSR now works with zero Vite config — `@cascivo/react` ships a CSS-free server build.

  The published bundle shipped per-component CSS as static side-effect imports
  (`import './button.css'`), which a bare server-side ESM loader (Node's native loader,
  workerd) cannot resolve — so every externalized Vite SSR framework (TanStack Start,
  Remix, vite-ssr) threw `Unknown file extension ".css"` on the first request unless the
  adopter added `ssr: { noExternal: [/^@cascivo\//] }`. Three adopter reports hit this.

  The build now also emits a CSS-free twin under `dist/node/`, selected by the `node`
  export condition. A bare Node loader imports it cleanly; client bundles still reach the
  CSS-bearing build via `import`/`browser`, so per-component CSS tree-shaking is unchanged.
  Import `@cascivo/react/styles.css` once for the server-rendered first paint (the server
  build carries no per-component CSS by design). `cascivoSsr()` / `ssr.noExternal` are no
  longer required (they remain harmless, and stay documented for pinned versions < 0.10).

- e81a0a7: A controlled `<ThemeProvider value={…}>` is now SSR-safe on its own.

  Previously the provider wrote `data-theme` only in a client effect, so a controlled
  provider emitted no theme attribute during SSR and the first paint was unthemed until
  hydration (a FOUC). When the theme is decided by server state, the provider now renders a
  tiny inline script that sets `data-theme` during HTML parsing — themed first paint, no
  hydration mismatch (the same markup renders on both sides; the client effect owns every
  update after hydration). Values are escaped against `</script>` breakout, and a new
  `nonce` prop forwards a CSP nonce to the script. The uncontrolled/persisted flow still
  uses `themePreloadScript()` in `<head>`, and `target`-scoped providers are unchanged.

### Patch Changes

- e81a0a7: `Field` warns in dev when it and its child control both define a `label`.

  Wrapping a labelled control (`<Field label="Email"><Input label="Email" /></Field>`)
  renders two `<label>` elements for the same control. Dev builds now emit a one-time
  `console.warn` naming the collision; production is unaffected. The fix is to omit the
  child's `label` inside a `Field` — the `Field` owns it. Docs and the `Field`/`Input`/
  `Textarea` manifests now call this out.

- e81a0a7: `setLinkComponent` now infers `LinkComponentProps` for an inline adapter.

  An inline router adapter like `setLinkComponent(({ href, ...rest }) => <Link to={href}
{...rest} />)` previously got no parameter types (the parameter was `ElementType`), so
  `href` was untyped — the exact seam where a router integration is most error-prone. An
  added overload contextually types an inline function adapter as `LinkComponentProps`, so
  `href` is inferred with no annotation. Every existing call still compiles (`'a'`, a
  Next.js `Link`, a class component) via the `ElementType` fallback overload.

- Updated dependencies [e81a0a7]
  - @cascivo/core@0.5.1

## 0.9.0

### Minor Changes

- 21e7ddb: Standardize change-handler naming on `onValueChange` for value-carrying callbacks.

  cascivo now documents one rule (in `docs/AI-RULES.md`, `CLAUDE.md`, and llms.txt): a
  handler that receives the component's **value** is `onValueChange`; one that receives a
  raw DOM `ChangeEvent` is `onChange`; item activation is `onSelect`. This makes the prop
  predictable instead of a per-component guess (2026-07-20 report, #7).

  Eight components that exposed a value-carrying `onChange` gain an `onValueChange` prop and
  mark `onChange` `@deprecated` (it still works, and takes lower precedence than
  `onValueChange`): `Toggle`, `Swap`, `Search`, `TimePicker`, `NumberInput`, `Combobox`,
  `DatePicker`, `Filter`. No behavior change for existing code; migrate to `onValueChange`
  before the deprecated alias is removed in a future major.

- 21e7ddb: Theme: an explicit `defaultTheme` now wins over the visitor's OS `prefers-color-scheme`.

  Previously both `ThemeProvider` and `themePreloadScript()` resolved the initial theme as
  `persisted > OS preference > defaultTheme`, so a "dark by default" (`defaultTheme="dark"`)
  app rendered _light_ for a light-OS visitor, and a custom `defaultTheme="midnight"` was
  replaced by `'light'`/`'dark'` from the OS (2026-07-20 adopter report). The precedence is
  now **persisted value > `defaultTheme` (if you passed one) > OS `prefers-color-scheme` >
  `'light'`**. Omit `defaultTheme` to keep the old OS-following behavior.

  `themePreloadScript()`'s JSDoc and the theming docs now spell out that the script sets
  `data-theme` before hydration — add `suppressHydrationWarning` to the `<html>` it writes
  to, or React 19 logs a hydration mismatch.

  Migration: if you passed `defaultTheme` AND relied on the OS overriding it, drop
  `defaultTheme` to follow the OS. Apps that passed nothing are unaffected.

### Patch Changes

- 21e7ddb: Expose the router-link contract as a named, documented type.

  `setLinkComponent` shipped, but the prop bag it hands a custom link was an opaque
  `ElementType` — an adopter reading the shipped `.d.ts` as documentation couldn't see
  `href`/`aria-current`/`onClick`/… or the `href → to` mapping idiom (2026-07-20 report, #6).
  `@cascivo/core` now exports a JSDoc'd `LinkComponentProps` interface, re-exported from
  `@cascivo/react`, and `setLinkComponent`'s docs show the TanStack adapter inline.

  `SideNavLinkProps.onClick` is now optional: cascivo always provides it and it only
  `preventDefault`s a disabled item, so it composes cleanly when spread onto a router
  `<Link>` (which keeps middle-click / open-in-new-tab).

- 21e7ddb: Fix the `exports` map so `import` and `types` resolve to parallel, top-level files.

  `preserveModulesRoot` pushed the real entry to `dist/react/src/index.js` — a subtree
  that didn't parallel the flat `dist/index.d.ts`, which `publint`/`arethetypeswrong`
  flag (2026-07-20 report, #8). The build now emits a one-line re-export at
  `dist/index.js`, and `exports["."]` points `import`/`default`/`types` at parallel
  top-level files. A new `pack:check` release gate (publint + attw) guards against
  exports-map regressions across all published packages.

- 21e7ddb: Raise the `@preact/signals-react` peer floor from `>=2.0.0` to `>=3.0.0`.

  React 19 removed the internal export that signals-react 2.x imports, so a 2.x
  runtime fails to load under React 19 (`SyntaxError: … '__SECRET_INTERNALS…'`). The
  old `>=2` floor let a resolver pick that broken build. signals-react 3.x still
  supports React 16.14+/17/18, so the new floor costs React-18 users nothing.

  If a lockfile carried over from an earlier install pins signals-react 2.x, run
  `cascivo doctor` — it now flags the mismatch (error on React 19, warning on React 18)
  with the exact upgrade command.

- Updated dependencies [21e7ddb]
- Updated dependencies [21e7ddb]
  - @cascivo/core@0.5.0
  - @cascivo/i18n@0.2.9

## 0.8.0

### Minor Changes

- 958fd6f: `Avatar` accepts a `name` prop and derives initials from it (grapheme-safe, first +
  last word), so `<Avatar name="Ada Lovelace" />` renders "AL" and is labeled "Ada
  Lovelace" — no need to pre-compute `fallback`. Explicit `fallback` still wins, and
  `name` also supplies the image `alt` when `src` is set without an explicit `alt`. The
  `User` composite forwards its string `name` to the Avatar automatically.
- 958fd6f: Re-export the router-link API (`setLinkComponent`, `getLinkComponent`, and the
  `LinkComponent` type) from `@cascivo/react`. Prebuilt-package (Path B) users can now
  register their framework's router `<Link>` without adding `@cascivo/core` as a direct
  dependency — importing it directly was a phantom-dependency error under pnpm, since
  `@cascivo/core` is only a transitive dep. Copied-source (Path A) projects can still
  import it from `@cascivo/core`; both resolve the same module singleton.

### Patch Changes

- Updated dependencies [958fd6f]
- Updated dependencies [958fd6f]
  - @cascivo/core@0.4.1
  - @cascivo/i18n@0.2.8

## 0.7.1

### Patch Changes

- 0a3d756: DataTable: adjacent auto-width columns no longer visually touch. Long unbroken
  cell content (commit hashes, branch names) now wraps inside its cell instead of
  spilling past the padding into the next column under `table-layout: fixed`
  (paginated tables), and the inter-column gutter is exposed as an overridable
  `--cascivo-data-table-cell-gap` component token.
- 0a3d756: Component source hygiene so vendored/copied source stays clean under strict host
  ESLint configs (e.g. `@tanstack/eslint-config`) without adopters inheriting lint
  failures in code they didn't write: inline type specifiers converted to
  top-level `import type`, provably-unnecessary type assertions removed,
  `prefer-const` applied, and stale `eslint-disable` directives dropped.
  Behavior-neutral — all component tests pass unchanged. A `pnpm lint:host-strict`
  CI guard (oxlint, no ESLint dependency) keeps the objective classes clean, and
  docs/USING-WITH-STRICT-ESLINT.md documents scoping the remaining stylistic rules
  off your components directory.

## 0.7.0

### Minor Changes

- 357ba46: Fixes from the TanStack Start dashboard adopter report (SSR + framework integration):

  - **core:** new `setLinkComponent()` / `getLinkComponent()` (and the `LinkComponent`
    type) — register your router's `Link` once at app start so cascivo's config-driven
    nav components render real router links (preserving `href`, `aria-current`, and
    active `data-state`) instead of plain `<a>`, with no `onClick` interception. See
    docs/HEADLESS.md. Also: the signal-returning hooks `useControllableSignal`,
    `useMediaQuery`, `useDisclosure`, `useMachine`, `useRovingFocus`, `useStreamBuffer`,
    and `useScope` now call `useSignals()` internally, so a plain React consumer that
    reads their signal in render stays reactive without calling `useSignals()` itself
    (matching `useTheme`/`useForm`).
  - **react:** `SideNav`, `ShellHeader`, `Header`, `Breadcrumb`, `Switcher`, `Dock`, and
    `NavigationMenu` route their links through the registered link component (above);
    `SideNavItem.render` now receives the computed icon/label node and the anchor prop
    bag so a per-item hatch no longer discards layout. `RelativeTime` is now
    hydration-safe under SSR by default (server text is kept and corrected on the
    client) — pass a fixed `now` for byte-deterministic output.
  - **charts:** `PieChart` (and the whole trig family — donut, gauge, meter, radial-bar,
    radar, sunburst, polar) now emit quantized arc/polar coordinates, so they hydrate
    cleanly under SSR instead of throwing away the server markup on cross-engine
    floating-point differences. Also quieted the shared chart `ResizeObserver` loop.

  Note for reviewers: the responsive `Grid`/`Columns`/`SettingsLayout` container fix and
  the `Fork` → git-branch icon alias ship through the copy-paste registry (private
  `@cascivo/layouts`) and the regenerated site icon catalog respectively, so they are not
  versioned here.

### Patch Changes

- Updated dependencies [357ba46]
  - @cascivo/core@0.4.0
  - @cascivo/i18n@0.2.7

## 0.6.4

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

## 0.6.3

### Patch Changes

- 6cb3327: Shadcn compat registry, llms-full.txt

## 0.6.2

### Patch Changes

- 2aba8dc: Layout fixes
- Updated dependencies [3b784e1]
  - @cascivo/i18n@0.2.6

## 0.6.1

### Patch Changes

- 62a02e6: DX improvements

## 0.6.0

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

## 0.5.1

### Patch Changes

- 810b8ba: Minor improvements
- Updated dependencies [810b8ba]
  - @cascivo/core@0.3.1
  - @cascivo/i18n@0.2.5

## 0.5.0

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
- dd05e9b: Add `useTypeahead` and fix duplicate-aria-id bugs in overlay components.

  - **`@cascivo/core`:** new `useTypeahead` primitive — type-to-select buffer for
    menus/listboxes. Accumulates printable keypresses, resets after an inactivity
    window, and calls `onMatch(query)` so the consumer focuses the matching item.
    Signal/ref-based, SSR-safe, no `useEffect`.
  - **Modal / Tooltip / AlertDialog:** replaced hardcoded static aria ids (Modal,
    AlertDialog) and a `Math.random()` id (Tooltip) with `useId()`. Two of the same
    component on one page no longer emit duplicate ids, so their `aria-labelledby` /
    `aria-describedby` references resolve correctly; Tooltip ids are now stable
    (SSR-safe) and colon-free (valid in the CSS anchor name).
  - **Menu:** keyboard navigation moved off per-item `nextElementSibling` walking onto
    panel-level roving focus + `useTypeahead`, so disabled items and separators are
    skipped and Home/End, arrow-wrap, and type-to-select work.

- Updated dependencies [483e30a]
- Updated dependencies [dd05e9b]
  - @cascivo/core@0.3.0
  - @cascivo/i18n@0.2.4

## 0.4.3

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.
- Updated dependencies [e29ad6e]
  - @cascivo/core@0.2.6
  - @cascivo/i18n@0.2.3

## 0.4.2

### Patch Changes

- b49e0ba: Fixed red flags.
- 6ee2f91: Experience fixes
- Updated dependencies [b49e0ba]
- Updated dependencies [1d7599a]
- Updated dependencies [6ee2f91]
  - @cascivo/core@0.2.5
  - @cascivo/i18n@0.2.2

## 0.4.1

### Patch Changes

- fc61671: Minor improvements
- Updated dependencies [fc61671]
  - @cascivo/core@0.2.4
  - @cascivo/i18n@0.2.1

## 0.4.0

### Minor Changes

- 5bafdb6: Adoption-audit fixes (waves 1–2):

  - CLI: per-command `--help` for every command (short-circuits before any prompt, fetch, or install); real `--version` (was hardcoded `0.0.0`); `init --theme <name>` / `--yes` with non-TTY defaulting; theme prompts and `theme add` now offer all 12 themes; `add` prints the `@cascivo/themes` wiring when the project doesn't import tokens yet; `add` is transactional (fetch-all-then-write — a failed fetch never leaves a partial component or a stale lockfile entry) and mixed bare + registry specs install both; registry fetches retry with backoff and fall back to the last cached copy when offline; first-party templates (`dashboard`, `auth`, `landing`) install by bare name; `@cascivo/<name>` namespace added (`@cascade/<name>` remains as a legacy alias); `doctor` no longer false-positives on hook names in comments; lockfile renamed `cascade.lock` → `cascivo.lock` (legacy file read and migrated automatically); HTTP cache moved to `~/.cascivo/cache`.
  - Registry: entries carry the real library version and per-file sha256 hashes; `cascivo update --check` diffs hashes instead of the previously inert version compare.
  - MCP: real server version (was `0.0.0`); `cascivo-mcp` bin added (`cascade-mcp` kept as a legacy alias).
  - i18n/react: `Combobox` search input, `DataTable` pagination buttons, `Dock` nav, and `Steps` list now source their aria-labels from the built-in catalog (with `labels`/`ariaLabel` prop overrides) instead of hardcoded English.

### Patch Changes

- 5bafdb6: Documentation pass (audit waves 4–5): package READMEs rewritten or corrected —
  `@cascivo/react` doc links now absolute (they dead-ended on npmjs.com),
  `@cascivo/registry` documents its real exports and consumers, and
  `@cascivo/themes` lists all 12 themes and import options. (The private
  render package's wrong ViewConfig example was also fixed.)
- Updated dependencies [5bafdb6]
  - @cascivo/i18n@0.2.0

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
