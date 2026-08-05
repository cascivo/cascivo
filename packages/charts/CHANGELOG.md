# @cascivo/charts

## 0.16.0

### Minor Changes

- dc2d9e7: Record each component's client-JavaScript cost in its manifest, and stop shipping `'use client'` from components that do not need it.

  `ComponentMeta` and `BlockMeta` gain an optional `clientJs: 'none' | 'enhancement' | 'required'`:

  - **`none`** — no client-only React API, no signal primitive, no DOM handler of its own. The
    server-rendered HTML is complete, and the component can render from a React Server
    Component without ever hydrating. Native-control wrappers land here even though they are
    interactive, because the platform supplies the interaction: `Slider` is an
    `<input type="range">`, `NativeSelect` a `<select>`, `Progress` a `<progress>`.
  - **`enhancement`** — the server HTML is correct and **no content is unreachable** with JS
    off; client JS adds interaction on top.
  - **`required`** — without client JS the component renders nothing useful, or a shell whose
    content is unreachable.

  It flows into `registry.json` and each `llms/<name>.md` automatically, so an agent choosing
  components can finally weigh their runtime cost. Nothing before this recorded it: an agent
  reading the registry could not tell that `Badge` is free while `CommandMenu` brings a dialog,
  a focus trap, a typeahead, and hydration.

  **68 components are `none`, 11 `enhancement`, 24 `required`.** The remaining 101 are
  deliberately left unclassified rather than guessed. `enhancement` versus `required` turns on
  whether content is merely hidden or genuinely unreachable, which no static scan can decide —
  a first mechanical pass cheerfully classified `Tabs`, `Carousel` and `Toast` as
  `enhancement`, and all three are wrong. Absent means unclassified, not `required`.

  `none` is derived from source and enforced in both directions by a new `client-js-parity`
  guard (in `pnpm meta:check`): a manifest cannot claim `none` while using a client-only API,
  and a clean component cannot understate itself as `enhancement`/`required` and quietly forfeit
  the RSC win. The guard also fails a `none` component that ships `'use client'`.

  **76 redundant `'use client'` directives were removed** across `@cascivo/react`'s components,
  `@cascivo/charts` (`Kpi`, `Meter`, `Sparkline`, and six internal chrome modules) and
  `@cascivo/flow` (`FlowBackground`, `FlowHandle`, `FlowPanel`). Those files use no
  client-only React API at all. On the copy-paste path the CLI writes registry sources
  verbatim, so the directive was landing in adopter projects and making purely static
  components a client boundary for nothing.

  No usage regresses. A Server Component passing `onClick` to `<Card>` already failed with the
  directive present, because functions cannot cross the boundary in either direction.

  The allowed-on-the-server API set was verified against React rather than assumed:
  `forwardRef`, `memo`, `useId` and `use` **are** exported under the `react-server` condition;
  `useState`, `useRef` and `createContext` are not.

### Patch Changes

- dc2d9e7: Add `@cascivo/core/pure`, and stop stamping `'use client'` on every `@cascivo/react` chunk.

  `@cascivo/react` previously applied a blanket `'use client'` banner to **every** emitted
  chunk, and hardcoded it into both flat entries. All 272 chunks carried it, `badge.js`
  included, and `dist/index.js` was `'use client'; export * from …` — so
  `import { Badge } from '@cascivo/react'` inside a Server Component crossed a client boundary
  at the barrel, no matter what the source said. The banner is now gone and the entries are
  bare re-exports: 86 of 272 chunks carry the directive, and the components that need no
  client JS render on the server without hydrating.

  That change was attempted once and reverted, because removing the banner broke RSC
  prerendering outright:

  ```
  Attempted to call cn() from the server but cn is on the client.
  ```

  `@cascivo/core` builds as a **single bundled chunk** whose own `'use client'` banner is
  load-bearing — the bundler collapses its 23 directive-carrying modules into one file and
  drops their per-module directives, so without it Next.js treats every hook and
  `Portal`/`Presence` as a Server Component. The side effect is that _everything_ in
  `@cascivo/core` sits behind a client boundary, including helpers that need no browser at all.

  **`@cascivo/core/pure`** is the fix: the same sources built without the banner, exporting
  exactly the transitively-pure surface — `cn`, `composeRefs`, `mergeProps`, `Slot`,
  `normalizeTone`, `normalizeProgress`, `sentimentOf`, `useId`, and their types. The subpath is
  small because it was measured, not guessed: the components that need it import only a
  handful of distinct symbols between them.

  ```tsx
  import { cn, Slot, normalizeTone } from '@cascivo/core/pure'
  ```

  **Nothing existing breaks.** `@cascivo/core` still exports every one of these, so client
  components keep their single import and no API is removed. Reach for `/pure` only from a
  component that must render on the server — exactly the set `clientJs: 'none'` names.
  **Type-only imports never need it**: they are erased at compile time, so they create no
  runtime edge, and routing a type through both specifiers makes the published `.d.ts` alias it.

  `packages/core`'s banner is untouched and must stay. Only `@cascivo/react`'s was redundant,
  because `preserveModules` keeps its chunks one-to-one with sources.

  `@cascivo/charts`, `@cascivo/flow`, `@cascivo/editor` and `@cascivo/ai` get subpath-aware
  externals (`/^@cascivo\/core($|\/)/` instead of the exact string). An exact string does not
  match `@cascivo/core/pure`, which silently bundles a second copy of `cn`/`Slot` into each
  package and duplicates their types in the published declarations — the same class of bug
  `@cascivo/core`'s own externals comment already warned about.

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

- Updated dependencies [dc2d9e7]
- Updated dependencies [dc2d9e7]
- Updated dependencies [97da94e]
  - @cascivo/core@0.16.0
  - @cascivo/i18n@0.16.0

## 0.15.0

### Minor Changes

- 9841d27: Rename the calendar-heatmap chart to `CalendarHeatmap`.

  `Calendar` named two different components with incompatible APIs: this heatmap, and
  `@cascivo/react`'s date picker. A dashboard importing from both packages got whichever
  resolved last, with no error — and because the docs generator resolved a component's
  distribution channel by display name rather than by its own module, the heatmap's page told
  adopters to `import { Calendar } from '@cascivo/react'`, which hands back the date picker.

  **Breaking:** `Calendar`, `CalendarProps` and `CalendarDatum` are removed, not deprecated.
  Migrate to `CalendarHeatmap`, `CalendarHeatmapProps` and `CalendarHeatmapDatum`. The aliases
  were kept briefly during development and deleted before release, because keeping them would
  have kept the symbol colliding with `@cascivo/react`'s `Calendar` — the exact hazard the
  rename exists to remove. A one-line find-and-replace; the props are unchanged.

  The copy-paste `layout/app-shell` was renamed in the same pass — `AppShell` → `AppFrame` —
  for the same reason. It is not published, so no npm consumer is affected; adopters who
  already copied the source own their copy and are unaffected.

- 9841d27: Render `secondAxis.label`, and colour `Stat`/`Kpi` deltas by sentiment.

  `AreaChart`/`LineChart`'s `secondAxis.label` was typed and documented but never drawn, so a
  dual-axis chart had no way to say which series belonged to which scale. `Axis` gains a
  `title`/`titleOffset` pair; the right margin now reserves room for it.

  `Stat` and `Kpi` hard-coded "up is green, down is red", so a deploy console's two
  most-watched tiles — errors and latency — rendered their worst news in green, and negating
  the delta to correct the colour also reversed the arrow. Both now take
  `goodDirection?: 'up' | 'down' | 'neutral'` (default `'up'`, so existing behaviour is
  unchanged), backed by a shared `sentimentOf` in `@cascivo/core` so the two tiles in two
  packages cannot drift apart.

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

- Updated dependencies [9841d27]
- Updated dependencies [9841d27]
  - @cascivo/core@0.15.0
  - @cascivo/i18n@0.15.0

## 0.7.1

### Patch Changes

- 3ec6aaf: Minor fixes
- Updated dependencies [3ec6aaf]
  - @cascivo/core@0.7.1
  - @cascivo/i18n@0.2.14

## 0.7.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [6f318dd]
  - @cascivo/core@0.7.0
  - @cascivo/i18n@0.2.13

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
- Updated dependencies [254a1a9]
  - @cascivo/core@0.6.0
  - @cascivo/i18n@0.2.12

## 0.5.1

### Patch Changes

- dfc24e4: Documentation updates
- db4fa0d: Docs
- Updated dependencies [dfc24e4]
- Updated dependencies [db4fa0d]
  - @cascivo/core@0.5.3
  - @cascivo/i18n@0.2.11

## 0.5.0

### Minor Changes

- 5c55ba7: Charts: document responsive sizing, clamp over-wide charts, and give `AreaChart` a time axis.

  - **`AreaChart` now accepts a `Date` x accessor** (`x: (d) => number | Date`), reaching parity with `LineChart`: return Dates and the chart uses a time scale with date-formatted ticks ("Jul 10"), instead of forcing you to encode day-of-month as an integer. Numeric x is unchanged.
  - **Sizing is documented where it's read.** Charts are responsive by default — omit `width` and the chart fills/tracks its container. The `width`/`height` prop JSDoc, the `useChartSize()` hook JSDoc, and a new README "Sizing" section now say so; the manifests regenerate accordingly.
  - **Over-wide charts are clamped, not clipped.** An explicit `width` larger than the container now scales down (`max-inline-size: 100%` on the SVG, which carries a viewBox) instead of overflowing its card — so a `width={420}` chart in a 320px card shows all its data.

### Patch Changes

- 5c55ba7: Make the prebuilt path impossible to ship grayscale, and put the quickstart where offline/AI adopters actually read it.

  - `@cascivo/react/styles.css` now bundles the design tokens **and** the light & dark themes, not just component structure. Importing that one file yields a fully-colored app — no separate `@cascivo/themes` import required for the no-bundler path. (Size grows ~30 KB to ~305 KB / ~40 KB gzip; the other 10 themes stay opt-in via `@cascivo/themes`.)
  - `@cascivo/themes` is now a real **dependency** of `@cascivo/react`, so it installs automatically. You still import its CSS once on the bundler path (per-component CSS + one theme import), but there is no second `pnpm add` and no pnpm phantom-dependency error.
  - `ThemeProvider` emits a one-time **dev-mode** `console.warn` when it sets a `data-theme` for which no `--cascivo-color-*` token resolves — i.e. you forgot the theme CSS import and every component would render grayscale. The message names the exact fix. Production is unaffected (dead-code-eliminated).
  - The published `dist/index.d.ts` now opens with a quickstart banner (themes import, the sibling `@cascivo/charts`/`@cascivo/icons` packages, the `useSignals()` rule, and the offline `npx @cascivo/docs` docs channel) — the declaration file is the primary documentation for adopters who can't reach npmjs.com or cascivo.com.
  - Package descriptions cross-reference the family and the offline docs package.

## 0.4.1

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

## 0.4.0

### Minor Changes

- e81a0a7: `AreaChart`, `LineChart`, and `BarChart` series accept a per-series `y` accessor.

  The chart-level `x`/`y` still apply to every series, but a series may now override `y` to
  plot a different field from the same rows — e.g. two series over one `data` array with
  `y: (d) => d.requests` and `y: (d) => d.errors`. Previously you had to pre-shape each
  series into a uniform `{x,y}` array or it silently plotted the same field twice. `x` stays
  chart-level (one x-domain per chart). Additive and backward-compatible: series with no
  `y` use the chart-level accessor exactly as before.

### Patch Changes

- Updated dependencies [e81a0a7]
  - @cascivo/core@0.5.1

## 0.3.14

### Patch Changes

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

## 0.3.13

### Patch Changes

- 958fd6f: Every published package now exports `./package.json`, so
  `require.resolve('@cascivo/<pkg>/package.json')` resolves instead of throwing
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. Previously only `@cascivo/react` exposed it, which
  tripped version probes, bundler plugins, and inspection tooling on the other packages.
- Updated dependencies [958fd6f]
- Updated dependencies [958fd6f]
  - @cascivo/core@0.4.1
  - @cascivo/i18n@0.2.8

## 0.3.12

### Patch Changes

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

- Updated dependencies [357ba46]
  - @cascivo/core@0.4.0
  - @cascivo/i18n@0.2.7

## 0.3.11

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

## 0.3.10

### Patch Changes

- 810b8ba: Minor improvements
- Updated dependencies [810b8ba]
  - @cascivo/core@0.3.1
  - @cascivo/i18n@0.2.5

## 0.3.9

### Patch Changes

- 483e30a: Minor improvements
- Updated dependencies [483e30a]
- Updated dependencies [dd05e9b]
  - @cascivo/core@0.3.0
  - @cascivo/i18n@0.2.4

## 0.3.8

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.
- Updated dependencies [e29ad6e]
  - @cascivo/core@0.2.6
  - @cascivo/i18n@0.2.3

## 0.3.7

### Patch Changes

- b49e0ba: Fixed red flags.
- 6ee2f91: Experience fixes
- Updated dependencies [b49e0ba]
- Updated dependencies [1d7599a]
- Updated dependencies [6ee2f91]
  - @cascivo/core@0.2.5
  - @cascivo/i18n@0.2.2

## 0.3.6

### Patch Changes

- fc61671: Minor improvements
- Updated dependencies [fc61671]
  - @cascivo/core@0.2.4
  - @cascivo/i18n@0.2.1

## 0.3.5

### Patch Changes

- Updated dependencies [5bafdb6]
  - @cascivo/i18n@0.2.0

## 0.3.4

### Patch Changes

- 6b50710: Addition chart types, and general chart improvements
- bb3c77e: Templates and further improvements
- Updated dependencies [6b50710]
- Updated dependencies [bb3c77e]
  - @cascivo/i18n@0.1.11
  - @cascivo/core@0.2.3

## 0.3.3

### Patch Changes

- f0b5654: Fixes
- Updated dependencies [f0b5654]
  - @cascivo/core@0.2.2
  - @cascivo/i18n@0.1.10

## 0.3.2

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements
- Updated dependencies [2458391]
- Updated dependencies [52c08b6]
  - @cascivo/core@0.2.1
  - @cascivo/i18n@0.1.9

## 0.3.1

### Patch Changes

- 4554af1: Make object-valued prop shapes machine-readable. `ComponentMeta` gains an optional
  `typeDefs` field (`TypeDefMeta`/`TypeFieldMeta`) describing the fields of object props —
  the per-datum/per-series `color` override was previously only discoverable in prose, so
  AI/registry consumers filtering props by name never found it. `PieChart` and `BarChart`
  now declare `typeDefs` for `PieChartDatum`, `BarChartSeries`, `StackedRow`/`StackedSegment`,
  and the `ChartPoint` tooltip-callback argument; these flow into `registry.json`, the MCP
  `get_component` payload, and a new `## Object types` section in the generated `llms.txt`
  component docs. The `@cascivo/charts` README now documents coloring, donut center labels,
  and `toStackedSeries` row-pivot usage. Resolves the `@lifosy/ui` charts discoverability gap.
- Updated dependencies [4554af1]
  - @cascivo/core@0.2.0
  - @cascivo/i18n@0.1.8

## 0.3.0

### Minor Changes

- 75ab15e: PieChart: donut `centerValue`/`centerLabel` (+ `centerSlot`), `thickness`/`innerRadius`, square
  `size` shorthand, a visible "No data" empty-state (`emptyLabel`, i18n built-in), and a `value (pct%)`
  slice-colored tooltip with a `tooltipFormat` escape hatch. BarChart: `toStackedSeries(rows)` pivot
  helper (preserving per-segment color), a stacked per-segment tooltip (`label · total` + per-layer
  breakdown) with `tooltipFormat`, and `xLabelEvery` x-label thinning. Per-datum/per-series `color`
  override documented in the metas and covered by tests. Resolves the `@lifosy/ui` charts adoption
  feedback (C1–C12).

### Patch Changes

- 75ab15e: Improvements
- Updated dependencies [75ab15e]
  - @cascivo/i18n@0.1.7

## 0.2.1

### Patch Changes

- fa55081: SideNav improvements
- Updated dependencies [fa55081]
  - @cascivo/core@0.1.3
  - @cascivo/i18n@0.1.3

## 0.2.0

### Minor Changes

- 30b0f20: Publish `@cascivo/charts` to npm. The package was previously private and
  source-only; it now builds to `dist/` (ESM + flat `.d.ts` + `charts.css`) with a
  proper export map (`@cascivo/charts` and `@cascivo/charts/styles.css`), so
  `pnpm add @cascivo/charts` works. Ships token-themed `LineChart`, `AreaChart`,
  `BarChart`, `Sparkline`, and the rest of the chart set the registry already
  pointed at.

### Patch Changes

- 72d0086: New location
- Updated dependencies [72d0086]
  - @cascivo/core@0.1.2
  - @cascivo/i18n@0.1.2
