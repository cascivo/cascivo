# @cascivo/core

## 0.17.0

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

## 0.16.1

### Patch Changes

- 66b251d: Bump every published package so the next release run publishes the whole set.
  Packages that carried no substantive change of their own have fallen behind the
  rest of the workspace; this gives each of them a real new version so the
  published set stays in lockstep.

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

## 0.15.0

### Minor Changes

- 9841d27: Version the `@cascivo/core`-sharing family in lockstep.

  `@cascivo/core`, `react`, `charts`, `editor`, `flow`, `i18n`, `storage` and `ai` now release
  together at one version (`fixed` in `.changeset/config.json`). Seven of them depend on
  `@cascivo/core`, and while they versioned independently an adopter could resolve two
  non-overlapping `@cascivo/core` ranges — the package manager then nests a second copy, and
  because cascivo's reactivity is a module-level signal registry, two copies means two
  registries: a signal written through one is invisible to components subscribed through the
  other, with no error at all.

  Expect a one-time version jump as the family aligns (the lower-numbered packages catch up to
  the highest). After that, a release bumps all eight together, which is an accurate reflection
  of how they are actually supported: only ever as a set.

  `linked` was considered and rejected — it aligns only packages bumped in the same release, so
  drift remains possible, which is the state this fixes. `cascivo doctor`'s duplicate-core
  check stays as defense in depth, since a carried-over lockfile can still hold a stale copy.

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

## 0.7.1

### Patch Changes

- 3ec6aaf: Minor fixes

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

- e81a0a7: `setLinkComponent` now infers `LinkComponentProps` for an inline adapter.

  An inline router adapter like `setLinkComponent(({ href, ...rest }) => <Link to={href}
{...rest} />)` previously got no parameter types (the parameter was `ElementType`), so
  `href` was untyped — the exact seam where a router integration is most error-prone. An
  added overload contextually types an inline function adapter as `LinkComponentProps`, so
  `href` is inferred with no annotation. Every existing call still compiles (`'a'`, a
  Next.js `Link`, a class component) via the `ElementType` fallback overload.

## 0.5.0

### Minor Changes

- 21e7ddb: Expose the router-link contract as a named, documented type.

  `setLinkComponent` shipped, but the prop bag it hands a custom link was an opaque
  `ElementType` — an adopter reading the shipped `.d.ts` as documentation couldn't see
  `href`/`aria-current`/`onClick`/… or the `href → to` mapping idiom (2026-07-20 report, #6).
  `@cascivo/core` now exports a JSDoc'd `LinkComponentProps` interface, re-exported from
  `@cascivo/react`, and `setLinkComponent`'s docs show the TanStack adapter inline.

  `SideNavLinkProps.onClick` is now optional: cascivo always provides it and it only
  `preventDefault`s a disabled item, so it composes cleanly when spread onto a router
  `<Link>` (which keeps middle-click / open-in-new-tab).

### Patch Changes

- 21e7ddb: Raise the `@preact/signals-react` peer floor from `>=2.0.0` to `>=3.0.0`.

  React 19 removed the internal export that signals-react 2.x imports, so a 2.x
  runtime fails to load under React 19 (`SyntaxError: … '__SECRET_INTERNALS…'`). The
  old `>=2` floor let a resolver pick that broken build. signals-react 3.x still
  supports React 16.14+/17/18, so the new floor costs React-18 users nothing.

  If a lockfile carried over from an earlier install pins signals-react 2.x, run
  `cascivo doctor` — it now flags the mismatch (error on React 19, warning on React 18)
  with the exact upgrade command.

## 0.4.1

### Patch Changes

- 958fd6f: Add an optional `importSymbols` field to `ComponentMeta` so a component whose display
  `name` is not itself an export (compound/imperative modules — `SkipNav` ships
  `SkipNavLink`/`SkipNavTarget`, `Toast` ships `ToastProvider`/`useToast`) renders a
  correct `import { … }` line in its generated docs instead of a broken
  `import { SkipNav }`. Also corrects the DataTable `rows` prop description (was a
  pasted "Number of visible text rows.") and documents 26 previously-undocumented props
  across the manifests, now enforced by the props-parity Direction-B gate.
- 958fd6f: Every published package now exports `./package.json`, so
  `require.resolve('@cascivo/<pkg>/package.json')` resolves instead of throwing
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. Previously only `@cascivo/react` exposed it, which
  tripped version probes, bundler plugins, and inspection tooling on the other packages.

## 0.4.0

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

## 0.3.1

### Patch Changes

- 810b8ba: Minor improvements

## 0.3.0

### Minor Changes

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

### Patch Changes

- 483e30a: Minor improvements

## 0.2.6

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.

## 0.2.5

### Patch Changes

- b49e0ba: Fixed red flags.
- 6ee2f91: Experience fixes

## 0.2.4

### Patch Changes

- fc61671: Minor improvements

## 0.2.3

### Patch Changes

- bb3c77e: Templates and further improvements

## 0.2.2

### Patch Changes

- f0b5654: Fixes

## 0.2.1

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements

## 0.2.0

### Minor Changes

- 4554af1: Make object-valued prop shapes machine-readable. `ComponentMeta` gains an optional
  `typeDefs` field (`TypeDefMeta`/`TypeFieldMeta`) describing the fields of object props —
  the per-datum/per-series `color` override was previously only discoverable in prose, so
  AI/registry consumers filtering props by name never found it. `PieChart` and `BarChart`
  now declare `typeDefs` for `PieChartDatum`, `BarChartSeries`, `StackedRow`/`StackedSegment`,
  and the `ChartPoint` tooltip-callback argument; these flow into `registry.json`, the MCP
  `get_component` payload, and a new `## Object types` section in the generated `llms.txt`
  component docs. The `@cascivo/charts` README now documents coloring, donut center labels,
  and `toStackedSeries` row-pivot usage. Resolves the `@lifosy/ui` charts discoverability gap.

## 0.1.3

### Patch Changes

- fa55081: SideNav improvements

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
