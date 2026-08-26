# @cascivo/charts

## 1.0.0

### Major Changes

- f1c8292: Remove the deprecated surfaces the 1.0 contract clears, and give deprecation an expiry.

  **Eleven removals.** Each has had a replacement shipping for at least one minor, each was
  struck through in your editor, and `docs/RECIPE-DASHBOARD.md` already told adopters the
  charts alias was "removed at 1.0".

  - **A value-carrying `onChange` is gone from eight components** — `Combobox`, `DatePicker`,
    `Filter`, `NumberInput`, `Search`, `Swap`, `TimePicker`, `Toggle`. Use `onValueChange`; it
    receives exactly the same argument, and both have been accepted since the alias was added.
    This is the catalog's handler-naming rule (`onValueChange` carries a value, `onChange`
    carries a DOM `ChangeEvent`) applied to the components that predate it.

    `Toggle`, `NumberInput` and `TimePicker` extend an HTML element's attributes, and they keep
    `Omit<…, 'onChange'>` deliberately: dropping the Omit as well would let the native
    `ChangeEventHandler` take the name back, so an adopter passing a value-carrying handler
    would compile and then be called with an event — a silent break. The other five are plain
    interfaces with no HTML base, so `onChange` is simply not a prop. Either way, passing it is
    a compile error that names the fix.

  - **`@cascivo/charts` no longer exports `Text` / `TextProps`** — use `ChartText` /
    `ChartTextProps`. This alias collided with `@cascivo/react`'s typography component and the
    wrong resolution was silent: the SVG primitive rendered where a paragraph was meant and
    nothing errored.

  - **`BarChart` drops `xTicks` / `yTicks`** — use `valueAxisTicks` / `categoryAxisTicks`. The
    removed pair was named for where an axis is _drawn_, so its meaning swapped with
    `orientation`: `yTicks={1}` silently did nothing on a horizontal chart while `xTicks={1}`
    worked, and `xLabelEvery` did not swap at all (2026-07-28 report C17b). The role-named
    props mean the same thing on both orientations. `ScatterChart` keeps `xTicks`/`yTicks` —
    both of its axes are value axes, so screen-position naming is correct there.

  - **`Dropdown` drops the `separator: true` flag on a row** — use a separate
    `{ kind: 'separator' }` entry. The flag marked the row _as_ a rule rather than drawing one
    above it, discarding its `label`, `value` and `icon`; an adopter lost a "Log out" item to it
    and only noticed because a smoke test counted rows (2026-08-22 report item 9). The dev-only
    warning that existed to catch that goes with it.

  **`Presence`'s return type is now declared, not inferred.** It was inferred as
  `ReactElement<…, JSXElementConstructor<any>> | null`, which leaked React's internal `any`
  into cascivo's published `.d.ts` — the only such leak the surface had that was cascivo's own
  to fix. It is now `ReactNode`. Rendering `<Presence>` is unaffected; the only code this can
  break is a direct call whose result is assigned to a `ReactElement`, which is why it rides
  this major rather than a minor.

  **`OverflowMenu` is NOT removed.** Its manifest promised removal "in v4", not at 1.0, and
  breaking a published promise early is the same defect as letting one slip. It now carries
  `removeIn: '2.0.0'`, keeps working for the whole `1.x` line, and `Menu` remains the
  replacement.

  **Deprecation gains an expiry.** `ComponentDeprecation` requires `removeIn` — the major that
  removes the old name — alongside `since`. It renders on every surface the manifest feeds, so
  the expiry is discoverable before you adopt the old name rather than after it disappears, and
  `deprecation-surfaces` fails the build if a deprecation names no major or is still shipping in
  the major it promised to leave. Both failure modes were verified by mutation. Before this,
  `overflow-menu` carried "removed in v4" as free prose in a `note` — a version that exists on
  no cascivo package — and nothing could tell whether it was overdue.

### Minor Changes

- 5c89efa: Four silent-output defects fixed, and the guards that let them ship.

  **`Dropdown` separators no longer eat the item.** `{ label, value, separator: true }` renders
  only a rule — the label, value and icon are discarded, with no type error and no warning. An
  adopter lost a "Log out" entry to it and found out only because a smoke test counted rows.
  There is now a `{ kind: 'separator' }` union member that cannot carry data. The legacy flag
  renders exactly as before (no silent behaviour change on a minor) and dev-warns when it is
  combined with a non-empty label, which is the one unambiguous case.

  **`CalendarHeatmap` no longer crops its own grid.** Cell size came from the container width
  while height was a constant that never consulted it, so 119 days in a 1054px card drew 434px
  of grid inside a 160px viewBox and cut off rows 3–7 — output that reads as "this heatmap has
  three rows of data". Cells are clamped to the height budget, which changes the rendering _if
  and only if_ it was already clipping: a year-length range is untouched. New `maxCellSize` caps
  cells further and is opt-in with no default, because a fixed default would have shrunk ranges
  that render correctly today.

  **`Field` now names the control it wraps.** `TagsInput` hardcoded `aria-label="Tags"` on its
  inner input, and `aria-label` outranks a `<label for>` association — so `<Field
label="Production domains">` produced a control named "Tags" with its hint never announced, a
  WCAG 1.3.1/4.1.2 failure in the composition the guides prescribe. `Field` now also passes
  `aria-labelledby` pointing at its own `<Label>`, so a control drops its built-in fallback name
  only when something really is naming it, and a standalone control keeps its name. A new guard
  sweeps every form control through a `Field` and found four more with the same defect:
  `Search` (built-in label concatenated with the Field's), `Combobox` and `DatePicker` (own
  hint/error ids replaced the Field's instead of merging), `ColorPicker` and `Editable` (never
  took the wiring at all — `Editable` put it on a wrapper `div`, not the focusable element).

  **`DataTable` measures its own overflow** and dev-warns with the real `scrollWidth` /
  `clientWidth` and the sized columns to change. The sizing arithmetic depends on a container
  width the adopter cannot see, so a paragraph of rules of thumb could never be enough; three
  passes were reported. In production, where the warning is stripped, pure-CSS scrolling shadows
  mark the cut edge.

  **Line/AreaChart warn on epoch-millisecond x values.** `x` is typed `number | Date` and the
  scale is picked from the runtime type, so returning `Date.now()`-shaped numbers labels the axis
  `1,787,250,000,000`. The warning names the `Date` fix. The scale is deliberately _not_ inferred
  from magnitude: that would break genuinely numeric series with no opt-out, trading a visible
  wrong output for an invisible one.

  **One name, one meaning.** The 14 form controls with a visible `label` now also declare
  `ariaLabel`, so the invisible name is discoverable beside the visible one instead of arriving
  only through an undocumented spread `aria-label`. `Toggle.label` was already documented as
  visible on every surface — source TSDoc, manifest, `registry.json`, `llms.txt`, the site props
  table — and an adopter still got the text twice, because a doc only reaches someone who
  suspects they need it. `Filter` accepts `multiple` alongside `multi`, and `Steps` accepts
  `items` alongside `steps`: you cannot read the doc comment of a prop you do not know exists.

  **`ChartText` replaces `Text` in `@cascivo/charts`** — the last cross-package name collision,
  and the one whose wrong resolution was silent (the SVG primitive renders where a paragraph was
  meant). `Text` remains as a deprecated alias until 1.0.

  **The published `.d.ts` is greppable.** Import and export specifier lists are one name per
  line: the longest line drops from 7190 to 259 characters, `grep ThemeProviderProps` finds it
  (it previously matched nothing despite the name being present), and a component-name grep no
  longer dumps a 7.2 kB export list. `llms.txt`'s "self-contained" claim is corrected to state
  what is actually true — the vocabulary types come from `@cascivo/react/types`, because
  inlining them makes the dts bundler alias every prop to `ToneInput$1`.

  **Quick-starts recommend `@cascivo/themes/light-dark.css`.** They recommended `all.css` while
  describing it as "light & dark", which had been wrong since 0.14.0 — it is all twelve themes —
  so every new adopter was handed roughly twice the CSS they needed.

  `Step`, `ActionSheetAction`, `DateRangePreset`, `ProgressStep` and `SideNavGroup` gain `id`
  and are keyed on it, so reordering or inserting entries no longer re-uses the wrong DOM node.

- 82423c6: An engine-free `Sparkline`, and area fills that read like the rest of the system.

  **New: `@cascivo/charts/sparkline`.** `import { Sparkline } from '@cascivo/charts'` pulls in
  the whole charting engine — tooltips, voronoi hit-testing, canvas, zoom/pan, toolbox,
  PNG/SVG export — because `Sparkline` is built on the same frame as every other chart. An
  adopter measured 44.87 kB / 14.84 kB gzip for one trend line on a landing page. The subpath
  draws the identical chart on a minimal frame at ~3.5 kB gzip. Same props, same markup, same
  styling (asserted by a DOM-parity test); the one difference is **no hover tooltip**, because
  the tooltip is what requires the engine. A CI size budget keeps it that way.

  **`AreaChart` warns on dual-axis area fills.** `warnScaleMismatch` steers a mismatched pair
  onto two axes and stops there, which leaves two areas compositing into a muddy third colour
  where they cross. The new warning names both series and the one-prop fix (`type: 'line'` on
  the secondary series), matching the house style of the existing chart warnings.

  **`AreaChart` defaults a single non-stacked series to `fill="gradient"`.** A lone solid area
  renders as a block of colour from the curve to the baseline, heavier than the rest of the
  system. Stacked and overlapping series keep `solid` — stacked bands need to read as areas,
  and overlapping ones already drop to a lower opacity. Pass `fill` explicitly to override.
  This changes the appearance of existing single-series area charts.

  **`Histogram.label` now renders.** It was a required prop documented as "rendered visibly
  beneath the axis", destructured as `_label` and never used. It is drawn as the x-axis title.

### Patch Changes

- 82423c6: Rewrote 44 prop descriptions that restated the prop name and said nothing else.

  Six boilerplate sentences — "Layout orientation of the component.", "Selects the visual style
  variant.", "Placement relative to the trigger.", "Position of the component.", "The HTML
  element to render as.", "Edge the component is anchored to." — were the entire published
  documentation for 38 props, and each is a sentence a reader could have written from the prop
  name alone. They shipped in the manifests, `registry.json`, `llms.txt`, the docs site and the
  `.d.ts`.

  `Separator.orientation` now says a `horizontal` separator draws a full-width line;
  `BarChart.orientation` says `vertical` grows bars upward from categories on the x-axis and
  `horizontal` grows them rightward (the better choice for long labels); `Resizable` says which
  way you drag. `Badge`, `Tag` and `Notification` keep — and now spell out — their alias
  mapping onto the canonical `Tone` vocabulary; `Alert` and `Toast` say plainly that theirs is
  a private union and the canonical `danger`/`neutral` spellings are not accepted.

  No API change; documentation only.

- a0bb1cf: Release every published package.

  This changeset names all twenty published packages so the next release cuts a version for each
  of them, including the four that no other pending changeset touches (`@cascivo/docs`,
  `@cascivo/docspack`, `@cascivo/eslint-plugin`, `@cascivo/vite-plugin`).

  The bump is `patch` everywhere; where another pending changeset asks for a `minor` or `major`,
  that higher bump still wins.

- Updated dependencies [82423c6]
- Updated dependencies [a0bb1cf]
- Updated dependencies [f1c8292]
  - @cascivo/core@1.0.0
  - @cascivo/i18n@1.0.0

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

- b16cb6c: `Stream` is `clientJs: 'enhancement'`, not `'required'`.

  It was labelled `required` on the theory that a live feed frozen at one server-rendered frame
  is not what the component is for. Rendering it disproves that: the server HTML carries the
  SVG _and_ the accessible data table with every value, exactly like every other chart. The
  "live" part is the app pushing data through `createStreamBuffer` — the app's JavaScript, not
  the component's.

  Caught by `packages/react/src/enhancement-renders.test.tsx`, which now server-renders every
  `clientJs: 'enhancement'` component and asserts the server HTML is actually usable.

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
