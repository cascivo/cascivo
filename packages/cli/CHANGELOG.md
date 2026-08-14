# cascivo

## 0.8.1

### Patch Changes

- 3fcf3f1: Bump every published package so the next release run publishes the whole set.

  The 0.17.0 bump landed on `main` but never reached npm: the release job's build
  died inside `changesets/action` with `Failed to spawn process: Resource
temporarily unavailable (os error 11)` — an `EAGAIN` write to that action's
  stdout pipe, not a build failure. This changeset re-cuts the whole set on top of
  the workflow fix, so every package publishes from a release that runs its build
  in a runner-owned step.

- Updated dependencies [3fcf3f1]
  - @cascivo/registry@0.2.7

## 0.8.0

### Minor Changes

- b59146f: Fixes for the 2026-08-08 adopter pair (two Vercel-style dashboards, TanStack Start and React Router).

  ## ⚠ One behaviour change to check before upgrading

  **`AppShell` now insets its content by default** (`padding` defaults to space step `6`).
  `<main>` shipped with `padding: 0` for three releases, so every adopter wrote the same wrapper
  `<div>` — the reports say so explicitly, and the CLI's own generated dashboard did it too. If
  your app has one, you will now get **double** padding. Remove your wrapper, or pass
  `padding="none"` to keep owning the inset yourself:

  ```tsx
  <AppShell padding="none" header={…}>{…}</AppShell>
  ```

  ## Correctness
  - **`DataTable` controlled selection** no longer logs "Cannot update a component while
    rendering a different component" under React 19. The documented controlled API was unusable
    without console noise, and under concurrent rendering the render-phase write was a real
    hazard, not just a warning. Eleven other components carrying the same shape are migrated.
  - **`timeScale` returns a usable number of ticks for sub-day domains.** A "last 24 hours"
    chart — the canonical dashboard panel — rendered a single date tick and ignored `xTicks`
    entirely. Separately, `TimeScale.tickFormat()` was never called by anything, so a time axis
    fell through to `toLocaleDateString()` and would have repeated the same date on every tick
    even once the ticks were right. Both fixed; `AreaChart`/`LineChart` axes now format
    sub-day ticks as times.

  ## Layout and interaction
  - **`Card` is `position: relative`.** The stretched-link pattern (`<a>` with
    `::after { inset: 0 }`, what every dashboard project grid uses) resolved its overlay against
    the viewport and swallowed every click in the app, with nothing on screen to explain why.
  - **`Checkbox`'s decoration no longer intercepts pointer events**, so
    `getByRole('checkbox').check()` works in Playwright without `{ force: true }`. This affected
    every `DataTable` row-selection test in every adopter's suite.
  - **`DataTable` zebra striping is visible.** It was painted with `--cascivo-color-bg-subtle`,
    which every theme aliases to `--cascivo-color-surface` — so striping a table on a surface
    repainted each row its own colour, in all three themes rather than only dark.
  - **An icon composed next to a label inside a `Button` gets the button's `gap`** instead of
    rendering flush against it.
  - **A `Card` inside a spanning `GridItem` fills the row height** instead of leaving a hole, and
    **`Field`s in a `Grid` row keep their inputs aligned** when one of them has a `description`.

  ## New API
  - **`AppShell.padding`** — `SpaceStep | 'none'`, default `6`. See the note above.
  - **`SwitcherLink.id`** — stable React key. Sibling entries pointing at the same `href` (three
    teams that all link to `/`, placeholder `#` links) produced duplicate-key warnings on every
    render, fixable only by distorting the data.
  - **`AreaChartSeries.type`** — `'area' | 'line'`. A dual-axis requests-vs-errors chart was not
    expressible: two opaque fills hid each other, `fill` is chart-level, and `ComboChart` is
    bar+line rather than area+line.
  - **`BadgeShape` is renamed `BadgeVariant`** (internal type, surfaced in the `.d.ts`). It typed
    the `variant` prop while reading as the type of a `shape` prop that does not exist.

  ## Documentation
  - **39 previously undocumented props and 114 missing type definitions** across `@cascivo/charts`,
    `@cascivo/flow` and `@cascivo/editor` now reach `registry.json`, `llms.txt`, the `.d.ts` and
    the docs site. Both parity guards had been resolving source through the registry's `files[]`,
    which is empty for npm-shipped packages, so 37 entries had never been checked. `AreaChart.format`
    was the visible casualty — real, documented in TSDoc, invisible to every generated surface,
    and the fix for the tick bug above.
  - **A published prop-name vocabulary** (`items` vs `rows`, `variant` vs `shape`, `kind` as the
    discriminated-union tag, and the numeric `gap={4}`) in `AI-RULES.md`, `llms.txt` and
    `CLAUDE.md`. Nine wrong prop-name guesses in one small dashboard was the largest single
    friction reported.
  - Router active-item **prefix matching**, `Card padding="none"` semantics, `DataTable` density
    and column sizing, `Button`'s inner-`<span>` DOM shape, checkbox testing, and the
    sparkline/code-splitting trade-off are documented on every surface that should carry them.

  ## CLI
  - **`cascivo create` scaffolds a project whose `lint` actually inspects TypeScript.** It
    previously exited 0 having checked **zero files**: the flat config registered no TS parser and
    no `files` pattern, so ESLint 9 skipped every `.ts`/`.tsx`.
  - The scaffold now ships Prettier, and its generated pages no longer use the inline styles its
    own `AGENTS.md` forbids — they use `Flex` with a numeric `gap`, modelling the space-scale
    convention instead of contradicting it.

## 0.7.2

### Patch Changes

- 66b251d: Bump every published package so the next release run publishes the whole set.
  Packages that carried no substantive change of their own have fallen behind the
  rest of the workspace; this gives each of them a real new version so the
  published set stays in lockstep.
- Updated dependencies [66b251d]
  - @cascivo/registry@0.2.6

## 0.7.1

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
  - @cascivo/registry@0.2.5

## 0.7.0

### Minor Changes

- 9841d27: `doctor` now reports a duplicated `@cascivo/core`.

  `@cascivo/react` and `@cascivo/charts` each depend on `@cascivo/core`, and the family
  versions independently on 0.x. Non-overlapping ranges resolve a nested second copy — and
  because cascivo's reactivity is a module-level signal registry, two copies means two
  registries: a signal written through one is invisible to components subscribed through the
  other. Nothing errors; handlers fire and the UI does not move, which is the hardest cascivo
  symptom to diagnose. `doctor` now names it, and `doctor --ci` fails on it.

- 9841d27: Add `@cascivo/eslint-config`, and fix the scaffolder + doctor to obey cascivo's own docs.

  **New package `@cascivo/eslint-config`.** `eslint-plugin-react-hooks@7`'s
  `recommended-latest` enables `react-hooks/immutability`, which reports every
  `signal.value = next` — the idiom AI-RULES.md mandates — as
  `Error: This value cannot be modified`. A stock 2026 React app therefore lints the
  documented state idiom as an error on every piece of state the adopter wrote, and the docs
  corpus had zero hits for "immutability". Spread `...cascivo` last in `eslint.config.js`.

  **`cascivo create`** no longer writes `"latest"` for cascivo dependencies (exact pins are
  baked in at build time), no longer declares or imports `@cascivo/core` / `@cascivo/tokens`
  on the prebuilt path, now declares the `@preact/signals-react` peer its own `App.tsx`
  depends on, no longer writes a `cascivo.config.ts` into a prebuilt-path app, declares the
  `cascivo.example` layer its `AGENTS.md` tells agents to use, ships `lint`/`typecheck`
  scripts and a pre-wired `eslint.config.js`, and seeds a short brand instead of the whole
  directory name.

  **`cascivo doctor`** infers the install path from evidence (`detectInstallPath`) instead of
  treating any `cascivo.config.*` as proof of a copy-paste project. It no longer demands
  `@cascivo/core`/`@cascivo/tokens` of a prebuilt app — it now reports them as
  `[forbidden-dependency]` when present — so `doctor --ci` passes on a correctly-installed
  Path B app and the documented CI gate is usable on day one.

## 0.6.2

### Patch Changes

- 3ec6aaf: Minor fixes

## 0.6.1

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

## 0.6.0

### Minor Changes

- 254a1a9: Fix the reactivity contract, SSR ids, and the audit's reachability (2026-07-25 adopter report)

  **`useSignal` / `useComputed` now make your component reactive.** They were raw re-exports of
  `@preact/signals-react`, so without the Babel signals transform — which no consumer app runs
  — a component reading `signal.value` in render never re-rendered. The failure was silent:
  handlers fired, signals updated, the UI froze. `docs/HEADLESS.md` had always promised these
  subscribe for you; now they do, and the promise is machine-checked rather than prose. The
  rule that survives: `useSignals()` is still required for a signal you did **not** get from a
  cascivo hook (a module-level `signal()`, a signal passed as a prop, `currentLocale()`).

  **Every reactivity primitive is now importable from `@cascivo/react`.** The prebuilt path had
  no legal move: the reactivity contract said "use `useSignal`", the SSR guide said never depend
  on `@cascivo/core`, and `useSignal` lived only in core. `useSignal`, `useComputed`,
  `useSignalEffect`, `useSignals`, `signal`, `computed`, `effect`, `batch`,
  `useControllableSignal`, `useEffectPropSignal`, `useDisclosure`, `useMachine`, `useScope`,
  `useId`, `useMediaQuery`, `useRovingFocus`, `useTypeahead`, `useAnchorPosition`,
  `DismissableLayer`, `Presence`, `Slot`, `VisuallyHidden` and more now ship from
  `@cascivo/react`. Import the `Signal`/`ReadonlySignal` **types** from `@preact/signals-react`
  (a declared peer you already have).

  **New `useEffectPropSignal`** for a controlled prop whose signal is read only inside
  `useSignalEffect`. Preact runs effects synchronously on write, so the previously documented
  `s.value = prop` idiom executed effect bodies inside React's render phase — `showModal()`,
  listener registration against a pre-commit ref, parent `setState` calls. Fourteen sites across
  `Modal`, `Sheet`, `Dropdown`, `AlertDialog`, `CommandMenu`, `HeaderPanel`, `Checkbox`,
  `Presence`, `useDraggable`, `useInfiniteScroll`, `useResizeObserver` and flow are migrated.
  `useControllableSignal` keeps its synchronous mirror, which is correct for a signal read in
  render.

  Behavioral note: effect work driven by a controlled prop now lands one microtask after the
  commit, where it always belonged. If you assert on it synchronously in a test, await the
  settle (`await act(async () => …)`).

  **`Search` and `usePopover` no longer break SSR hydration.** Both built DOM identifiers from a
  module-scoped counter that kept incrementing for the life of the server process, so it
  diverged from a freshly-loaded client on essentially every request — a mismatch React does not
  patch up, which can leave `<label for>` pointing at nothing. Both use `useId` now.

  **`cascivo audit --ai` runs in your project.** It previously searched for `apps/site/public/`,
  a directory that only exists in the cascivo monorepo, and died with "token catalog not found"
  everywhere else. The contract now ships inside the CLI (~100 KB), with `--contract <path>`,
  `--verbose`, and a cached network fallback. No setup, no network required.

  **`Kpi` gained `deltaFormat`** (`'number' | 'percent' | (delta) => string`), so a percentage
  delta renders as `+25.6%`; values are locale-formatted. **`CardHeader` gained `actions`** for
  the title-left / menu-right dashboard card, which the column default made awkward.
  **`IconButton` and `Sparkline`** now accept `ariaLabel` as an alias for `label`; exactly one
  remains required.

### Patch Changes

- 4172611: Bump every published package so the next release run publishes the whole set. The
  release drift gate had been failing on non-reproducible `regen` output (see PR #179),
  so packages carrying no substantive change of their own were left behind at versions
  older than the rest of the workspace. This changeset gives each of them a real new
  version, keeping the published set in lockstep.
- Updated dependencies [4172611]
  - @cascivo/registry@0.2.4

## 0.5.4

### Patch Changes

- dfc24e4: Documentation updates
- db4fa0d: Docs
- Updated dependencies [dfc24e4]
- Updated dependencies [db4fa0d]
  - @cascivo/registry@0.2.3

## 0.5.3

### Patch Changes

- 0b6b44e: Force a version bump across every published package to verify the changesets
  publish patch fix (see the release workflow fix in PR #168): several packages
  had been stuck re-publishing their already-released version on every release
  run and failing with a spurious E403, because the "already published" error
  detection missed pnpm's actual error shape. This changeset gives every
  package a real new version so the next release run exercises a genuine
  publish for all of them, not just the ones with substantive changes.
- Updated dependencies [0b6b44e]
  - @cascivo/registry@0.2.2

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
