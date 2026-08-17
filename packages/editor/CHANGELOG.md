# @cascivo/editor

## 0.18.0

### Minor Changes

- d009502: Fixes for the 2026-08-14 adopter report (a Vercel-style dashboard on Vite +
  React Router).

  ## New: the vocabulary types are importable on the prebuilt path

  `Status.status` and `Badge.variant` are typed `ToneInput`, and every layout
  `gap` is a `SpaceStep` — but those types live in `@cascivo/core`, which is a
  _transitive_ dependency on the prebuilt path that the docs tell you not to
  install. So the first thing a typed dashboard writes had no supported import.

  ```ts
  import type { Tone } from '@cascivo/react/types'

  const DEPLOY_TONE: Record<DeployState, Tone> = {
    ready: 'success',
    error: 'danger',
  }
  ```

  `@cascivo/react/types` exports `Tone`, `ToneAlias`, `ToneInput`, `Progress`,
  `ProgressAlias`, `ProgressInput`, `SpaceStep` and `RovingOrientation`. On the
  copy-paste path keep importing from `@cascivo/core`. **Do not** add
  `@cascivo/core` to a prebuilt app to reach these — it is transitive there.

  They ship from a subpath rather than the main entry for a mechanical reason:
  component sources already import those names from core, so re-exporting them
  from `@cascivo/react` makes the dts bundler emit `ToneInput as ToneInput$1`
  and every prop switches to the aliased name.

  ## The router guide is now published

  `docs/USING-WITH-A-ROUTER.md` existed and was referenced from `Link`, `Tabs`
  and `setLinkComponent`, but was never published — so those pointers 404'd.
  It is now at <https://cascivo.com/docs/using-with-a-router.md> and in
  `npx @cascivo/docs`, along with three other guides that were also unpublished:
  `testing`, `css-layers-pitfall` and `third-party-css` (the last two cited by
  `@cascivo/react`'s own README and by `cascivo audit`).

  `setLinkComponent` gains a React Router recipe — its `to` is required, so the
  disabled-item case needs a fallback:

  ```tsx
  setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href ?? '#'} {...rest} />)
  ```

  ## Components
  - `PageHeader.title` and `.description` accept `ReactNode`, not just `string`,
    so a page title can carry a status badge or a linked domain.
  - `CodeSnippet` accepts children as an alias for `code`
    (`<CodeSnippet>npm i foo</CodeSnippet>`). It stays a string — the content is
    tokenized for highlighting and handed to the clipboard.
  - `BreadcrumbItem` and `DockItem` gain the `id` escape hatch the other
    link-shaped item types already had. `Dock` previously keyed on the array
    index.
  - `Sparkline`'s documented default was 80 while the code applied 120; the docs
    now say 120 and that it is **fixed-width**, correcting a dashboard-recipe
    claim that it shrinks to fit.
  - `Stat` and `Kpi` now document the choice between them: `<Stat card>` matches
    `Kpi`'s chrome but **not** its layout, so pick one per app.
  - `label` visibility is now stated per component. It renders on screen for most
    components and is an invisible accessible name for a few (`Sparkline`,
    `Spinner`, `Fab`, …); nothing said which, and `<Toggle label>` duplicating a
    settings row's own heading is what the ambiguity cost.

  ## Charts

  `@cascivo/charts/styles.css` is **not** required on a bundler build — the entry
  imports its own stylesheet. It is required with no bundler, and on an SSR setup
  that externalises dependencies, where the CSS-free `node` twin loads. Several
  docs still called it unconditionally required. Also documents 13 chart and flow
  prop defaults that no generated table had ever shown.

  ## CLI
  - `cascivo create` emits the app shell as its own `src/Shell.tsx` with a
    `children` slot, so adding a router means deleting `App.tsx` and
    `src/sections/` rather than re-deriving the shell wiring.
  - The scaffold no longer imports the ~273 kB aggregate `@cascivo/react/styles.css`;
    per-component CSS auto-includes and tree-shakes on a bundler. A generated app
    now emits **39.65 kB** of entry CSS (6.90 kB gzip).
  - `create` inside an existing workspace detects the package manager from the
    surrounding lock file instead of always reporting npm under `npx`.
  - The browser tab title is title-cased rather than the raw directory name.

### Patch Changes

- b16cb6c: Every component now declares `clientJs`, so `registry.json` can answer "does this hydrate?"
  for the whole catalog.

  96 of 209 manifests (46%) declared nothing — including `DataTable`, `Calendar`, `Form`,
  `Toast` and every chart. `client-js-parity.test.ts` only ever validated manifests that _did_
  declare the field, so a missing value looked exactly like a value under no rule. Coverage is
  now **74 `none` · 72 `enhancement` · 63 `required`**, and
  `scripts/checks/client-js-coverage.test.ts` fails on any manifest that omits it.

  The labels are derived from what components actually emit. Charts were server-rendered
  through `renderToString` — every one emits the SVG _and_ the accessible `<table>` fallback
  with real data points, so charts read with JS off (`enhancement`); `Stream` is the exception,
  since a live feed frozen at one frame is not the component. Components and blocks were
  rendered from their own manifest examples in an SSR harness, recording native inputs, anchors
  and JS-only buttons: that is what separates `TimePicker` (native `<input type="time">` →
  `enhancement`) from `RatingGroup` (buttons with `role="radio"` → `required`), and `Toc` (real
  anchors) from `Pagination` (buttons plus a select that navigate nothing). Each declaration
  carries a one-line reason in its manifest.

  **The `'enhancement'` vs `'required'` definition is now fixed, and it changed.** The guard
  previously described the split as content-based ("is content merely hidden or genuinely
  unreachable") while also saying `clientJs` records what a component needs "to be correct".
  Those disagree on ~30 components: `Calendar` server-renders a complete 32-button month grid
  and cannot pick a date; `Tabs` renders one panel and cannot reach the others. The definition
  is now **function-based** — `'required'` whenever the component's primary job needs JS, even
  when its markup is all present. If you read `clientJs` to decide what can render from a
  Server Component, this is the answer you wanted; the content-based reading would have told
  you to ship a dead Calendar.

  The `llms/<name>.md` "Client JavaScript" wording was updated to match.

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

- Updated dependencies [d009502]
- Updated dependencies [b16cb6c]
- Updated dependencies [00b74e9]
  - @cascivo/core@0.18.0
  - @cascivo/i18n@0.18.0

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

## 0.16.0

### Patch Changes

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

### Patch Changes

- Updated dependencies [9841d27]
- Updated dependencies [9841d27]
  - @cascivo/core@0.15.0
  - @cascivo/i18n@0.15.0

## 0.2.20

### Patch Changes

- 3ec6aaf: Minor fixes
- Updated dependencies [3ec6aaf]
  - @cascivo/core@0.7.1
  - @cascivo/i18n@0.2.14

## 0.2.19

### Patch Changes

- Updated dependencies [6f318dd]
  - @cascivo/core@0.7.0
  - @cascivo/i18n@0.2.13

## 0.2.18

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

## 0.2.17

### Patch Changes

- dfc24e4: Documentation updates
- db4fa0d: Docs
- Updated dependencies [dfc24e4]
- Updated dependencies [db4fa0d]
  - @cascivo/core@0.5.3
  - @cascivo/i18n@0.2.11

## 0.2.16

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

## 0.2.15

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

## 0.2.14

### Patch Changes

- 958fd6f: Every published package now exports `./package.json`, so
  `require.resolve('@cascivo/<pkg>/package.json')` resolves instead of throwing
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. Previously only `@cascivo/react` exposed it, which
  tripped version probes, bundler plugins, and inspection tooling on the other packages.
- Updated dependencies [958fd6f]
- Updated dependencies [958fd6f]
  - @cascivo/core@0.4.1
  - @cascivo/i18n@0.2.8

## 0.2.13

### Patch Changes

- Updated dependencies [357ba46]
  - @cascivo/core@0.4.0
  - @cascivo/i18n@0.2.7

## 0.2.12

### Patch Changes

- 810b8ba: Minor improvements
- Updated dependencies [810b8ba]
  - @cascivo/core@0.3.1
  - @cascivo/i18n@0.2.5

## 0.2.11

### Patch Changes

- 483e30a: Minor improvements
- Updated dependencies [483e30a]
- Updated dependencies [dd05e9b]
  - @cascivo/core@0.3.0
  - @cascivo/i18n@0.2.4

## 0.2.10

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.
- Updated dependencies [e29ad6e]
  - @cascivo/core@0.2.6
  - @cascivo/i18n@0.2.3

## 0.2.9

### Patch Changes

- b49e0ba: Fixed red flags.
- 6ee2f91: Experience fixes
- Updated dependencies [b49e0ba]
- Updated dependencies [1d7599a]
- Updated dependencies [6ee2f91]
  - @cascivo/core@0.2.5
  - @cascivo/i18n@0.2.2

## 0.2.8

### Patch Changes

- fc61671: Minor improvements
- Updated dependencies [fc61671]
  - @cascivo/core@0.2.4
  - @cascivo/i18n@0.2.1

## 0.2.7

### Patch Changes

- Updated dependencies [5bafdb6]
  - @cascivo/i18n@0.2.0

## 0.2.6

### Patch Changes

- 25ab8b2: Improved editor handling

## 0.2.5

### Patch Changes

- bb3c77e: Templates and further improvements
- Updated dependencies [6b50710]
- Updated dependencies [bb3c77e]
  - @cascivo/i18n@0.1.11
  - @cascivo/core@0.2.3

## 0.2.4

### Patch Changes

- f0b5654: Fixes
- Updated dependencies [f0b5654]
  - @cascivo/core@0.2.2
  - @cascivo/i18n@0.1.10

## 0.2.3

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements
- Updated dependencies [2458391]
- Updated dependencies [52c08b6]
  - @cascivo/core@0.2.1
  - @cascivo/i18n@0.1.9

## 0.2.2

### Patch Changes

- Updated dependencies [4554af1]
  - @cascivo/core@0.2.0
  - @cascivo/i18n@0.1.8

## 0.2.1

### Patch Changes

- 75ab15e: Improvements
- 75ab15e: Fix the published tarball shipping no `dist/`: add `@cascivo/editor` to the
  release build filter (`build:release`), add a defensive `prepack` build, and
  verify the tarball contains `dist/index.js`, `dist/index.d.ts`, and
  `dist/editor.css` via a `npm pack --dry-run` assertion. Without the build
  filter entry, `changeset publish` shipped the package unbuilt and unimportable.
  Unblocks the `@lifosy/ui` CodeMirror → Cascivo `CodeEditor` migration (Phase 4).
- Updated dependencies [75ab15e]
  - @cascivo/i18n@0.1.7

## 0.2.0

### Minor Changes

- Large-document performance (v47): windowed (viewport-scoped) tokenization. Per-render
  tokenization is now **O(viewport)** instead of O(document) — `CodeEditor` and `Highlight`
  tokenize only the visible window via a new `tokenizeRange` engine entry fed by a persistent
  per-line `LineStateIndex` (memoized grammar end-states with `ensure` / `startStateOf` /
  `invalidateFrom`). An edit re-tokenizes only the **changed suffix** until the state
  reconverges, not the whole file. The bounded `MAX_CACHE = 5000` per-line memo cap — the
  source of the ~5,000-line cliff — is removed; the index supersedes it for the window.
  Highlighting output is **byte-identical** and the overlay + owned-tokenizer model is
  unchanged, with **zero new dependencies**. Long Markdown now edits well past ~5,000 lines
  (50k-line keystroke ~587 ms → sub-millisecond, flat across document size). `wrap` render
  stays O(n) (documented); a worker offload is evaluated and deferred. New exports:
  `tokenizeRange`, `createLineStateIndex`, `LineStateIndex`.

  Also: the current-line highlight now updates **instantly** when the caret moves
  (driven by `selectionchange`), instead of waiting for `keyup` — fast arrow-key
  navigation no longer leaves the active-row marker lagging behind the cursor.

## 0.1.1

### Patch Changes

- 64535b7: Editor updates
- Updated dependencies [64535b7]
  - @cascivo/i18n@0.1.6

## 0.1.0

### Minor Changes

- Editor parity (v46): close the gap-analysis findings inside the textarea-overlay
  model — owned undo/redo history (`Mod-Z` / `Mod-Shift-Z`) that survives
  programmatic `value` writes; selection-preserving, echo-safe controlled sync;
  in-document find & replace (`Mod-F` / `Mod-Alt-F`); a keymap dispatch with a
  `Mod-S` `onSave` hook and a public `keymap` + `decorations` extension seam;
  per-instance `theme` overrides that switch live; active-line gutter and opt-in
  `bracketMatching`; an imperative `CodeEditorHandle`
  (`applyEdit`/`getSelection`/`focus`/`undo`/`redo`/`openFind`); and a hardened
  Markdown grammar (task lists, strikethrough, horizontal rules, lists, quotes).
  Additive and backward-compatible — the default render is unchanged. New exports:
  `CodeEditorHandle`, `EditorTheme`, `Decoration`, `KeyMap`, `Command`,
  `CommandContext`.

## 0.0.2

### Patch Changes

- aa3c6f3: Introduce Editor
- Updated dependencies [aa3c6f3]
  - @cascivo/i18n@0.1.5

## 0.0.1

### Patch Changes

- Initial release: lightweight CSS-native code editor. `CodeEditor` (native
  textarea overlay) + `Highlight` (read-only renderer) built on an owned,
  zero-dependency per-line tokenizer with tree-shakeable grammars
  (`plaintext`, `json`, `javascript`, `typescript`, `css`, `html`, `markdown`,
  `bash`). Themed through the cascivo token system.
