# @cascivo/react

## 0.17.1

### Patch Changes

- 3fcf3f1: Bump every published package so the next release run publishes the whole set.

  The 0.17.0 bump landed on `main` but never reached npm: the release job's build
  died inside `changesets/action` with `Failed to spawn process: Resource
temporarily unavailable (os error 11)` — an `EAGAIN` write to that action's
  stdout pipe, not a build failure. This changeset re-cuts the whole set on top of
  the workflow fix, so every package publishes from a release that runs its build
  in a runner-owned step.

- Updated dependencies [3fcf3f1]
  - @cascivo/core@0.17.1
  - @cascivo/i18n@0.17.1
  - @cascivo/themes@0.4.12

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

### Patch Changes

- Updated dependencies [b59146f]
  - @cascivo/core@0.17.0
  - @cascivo/i18n@0.17.0

## 0.16.1

### Patch Changes

- 66b251d: Bump every published package so the next release run publishes the whole set.
  Packages that carried no substantive change of their own have fallen behind the
  rest of the workspace; this gives each of them a real new version so the
  published set stays in lockstep.
- Updated dependencies [66b251d]
  - @cascivo/core@0.16.1
  - @cascivo/i18n@0.16.1
  - @cascivo/themes@0.4.11

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

- dc2d9e7: Rebuild `Accordion` and `Collapsible` on native `<details>`/`<summary>`.

  Both were hand-rolled signal state machines: a `<button>` carrying `aria-expanded` and
  `aria-controls`, next to a panel CSS collapsed to zero height. With JavaScript disabled the
  panels were in the DOM but could never be opened — the content was unreachable. Both are now
  `clientJs: 'enhancement'`: the open panel renders at first paint, the disclosure works with
  JS off, and find-in-page expands a collapsed section for free.

  The button role, the expanded state, and Enter/Space activation now come from the platform
  rather than from ARIA. `role="region"` and `aria-labelledby` on the panel stay — they are
  additive and do not collide with native semantics.

  **Breaking — the rendered DOM changed.** The public component API is unchanged, so no markup
  you write needs editing, but anything reaching _into_ these components does:

  | Before                                       | After                                 |
  | -------------------------------------------- | ------------------------------------- |
  | `<div class="item">` wrapping the pair       | `<details class="item">`              |
  | `<h3><button class="trigger">`               | `<summary class="trigger"><h3>`       |
  | `aria-expanded` on the trigger               | native; the attribute is gone         |
  | `AccordionTrigger` ref → `HTMLButtonElement` | ref → `HTMLElement` (the `<summary>`) |
  - **Tests** querying `getByRole('button', { name })` or asserting `aria-expanded` must read
    `details.open` instead. Note that jsdom exposes neither the button role nor `aria-expanded`
    for a `<summary>`, and does not activate one on Enter/Space — all three are jsdom gaps, not
    behaviour changes; real browsers do all of it.
  - **CSS** selecting `.trigger` or `[data-state]` still works — both are preserved — but a
    selector written against the `<button>`/`<div>` element names needs updating.
  - `Collapsible`'s `disabled` is now enforced in the enhancement layer (`aria-disabled` plus a
    cancelled click), because `<details>` has no native disabled state. With JS off, a disabled
    `Collapsible` is still operable. That is an honest degradation of a prop that never had a
    platform equivalent.

  `type="single"` additionally emits `<details name>`, so exclusivity survives with JS off. The
  JS exclusivity logic is retained rather than delegated to the browser, since it is what
  actually drives state once hydrated.

  Open/close animates via `::details-content` (Baseline since September 2025) with
  `content-visibility` sequenced by `transition-behavior: allow-discrete`; `calc-size()` layers
  on as a Chromium-only enhancement behind a static fallback, so Firefox and Safari snap open
  instead of sliding.

  The platform behaviour is covered by a new browser canary (`pnpm no-js:check`) that mounts
  server HTML, never hydrates it, and drives it with a real keyboard — proving the base layer
  works with no JavaScript at all, which no jsdom test structurally can.

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

- Updated dependencies [dc2d9e7]
- Updated dependencies [dc2d9e7]
- Updated dependencies [97da94e]
  - @cascivo/core@0.16.0
  - @cascivo/i18n@0.16.0
  - @cascivo/themes@0.4.10

## 0.15.0

### Minor Changes

- 9841d27: Converge the accessible-name prop on `ariaLabel`, and give `DataTable` sized columns a
  content floor.

  Ten components accepted only the DOM spelling `aria-label`, so `label` meant visible text
  on some components, an invisible name on others, and was not accepted at all on a third
  group. Every one now also accepts `ariaLabel`: `Menubar`, `NavigationMenu`, `TreeView`,
  `Swap`, `RadialProgress`, `MenuTrigger`, `SplitView` and `StatsBand` join the three that
  already did. Where the name is required (`Menubar`), an XOR union enforces that exactly one
  spelling is present, so the accessibility guarantee survives the alias. No existing code
  breaks — these are additive.

  `DataTable` columns with a `width` no longer shrink below their own longest word, so a
  sized column can't render `Buildin` / `g`; `minWidth` is now only for raising the floor
  above the content. The scroller reserves its gutter, so a table that overflows says so
  rather than appearing to have dropped columns.

### Patch Changes

- Updated dependencies [9841d27]
- Updated dependencies [9841d27]
  - @cascivo/core@0.15.0
  - @cascivo/i18n@0.15.0

## 0.14.0

### Minor Changes

- 4488d6f: Two additive props from the 2026-07-31 incident-console adopter report.

  `Timeline` items take an optional `tone` (the catalog-wide `Tone` vocabulary),
  independent of `status` and overriding it on the marker. `status` answers "where is
  this in the sequence", which is right for a tracker and wrong for the activity feed
  the manifest's `whenToUse` lists first: in a feed every entry is equally done, and
  what separates them is what produced them. There was no escape hatch — `icon` sets
  the marker's contents, not its colour, and `TimelineItem` has no `className` or
  `data-*` passthrough — so the adopter hand-rolled the component and lost the
  `<ol>`/`<li>` semantics and connector line with it.

  `ShellHeader` takes an optional `center` node, rendered between the nav and the
  right-hand cluster in a wrapper that takes the header's spare width. This is where a
  command-palette trigger belongs; `nav` accepts links only, `actions` accepts icon
  buttons only, and `end` sits after the spacer so it can neither centre nor grow. The
  only way to reach the position was to select the brand's hashed CSS-module class,
  which is the shape that broke when internal nesting last changed.

  Both are additive: existing callers are unaffected, `status` keeps its meaning, and
  the header keeps its spacer when `center` is absent.

## 0.13.1

### Patch Changes

- 3ec6aaf: Minor fixes
- Updated dependencies [3ec6aaf]
  - @cascivo/themes@0.4.9
  - @cascivo/core@0.7.1
  - @cascivo/i18n@0.2.14

## 0.13.0

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
  - @cascivo/themes@0.4.8
  - @cascivo/i18n@0.2.13

## 0.12.0

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
  - @cascivo/themes@0.4.7

## 0.11.1

### Patch Changes

- dfc24e4: Documentation updates
- db4fa0d: Docs
- Updated dependencies [dfc24e4]
- Updated dependencies [db4fa0d]
  - @cascivo/core@0.5.3
  - @cascivo/i18n@0.2.11
  - @cascivo/themes@0.4.6

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
