# @cascivo/storage

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

### Patch Changes

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
- Updated dependencies [00b74e9]
  - @cascivo/core@0.18.0

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

## 0.17.0

### Patch Changes

- Updated dependencies [b59146f]
  - @cascivo/core@0.17.0

## 0.16.1

### Patch Changes

- 66b251d: Bump every published package so the next release run publishes the whole set.
  Packages that carried no substantive change of their own have fallen behind the
  rest of the workspace; this gives each of them a real new version so the
  published set stays in lockstep.
- Updated dependencies [66b251d]
  - @cascivo/core@0.16.1

## 0.16.0

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

## 0.15.0

### Patch Changes

- Updated dependencies [9841d27]
- Updated dependencies [9841d27]
  - @cascivo/core@0.15.0

## 0.1.19

### Patch Changes

- 3ec6aaf: Minor fixes
- Updated dependencies [3ec6aaf]
  - @cascivo/core@0.7.1

## 0.1.18

### Patch Changes

- Updated dependencies [6f318dd]
  - @cascivo/core@0.7.0

## 0.1.17

### Patch Changes

- 4172611: Bump every published package so the next release run publishes the whole set. The
  release drift gate had been failing on non-reproducible `regen` output (see PR #179),
  so packages carrying no substantive change of their own were left behind at versions
  older than the rest of the workspace. This changeset gives each of them a real new
  version, keeping the published set in lockstep.
- Updated dependencies [4172611]
- Updated dependencies [254a1a9]
  - @cascivo/core@0.6.0

## 0.1.16

### Patch Changes

- dfc24e4: Documentation updates
- db4fa0d: Docs
- Updated dependencies [dfc24e4]
- Updated dependencies [db4fa0d]
  - @cascivo/core@0.5.3

## 0.1.15

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

## 0.1.14

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

## 0.1.13

### Patch Changes

- 958fd6f: Every published package now exports `./package.json`, so
  `require.resolve('@cascivo/<pkg>/package.json')` resolves instead of throwing
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. Previously only `@cascivo/react` exposed it, which
  tripped version probes, bundler plugins, and inspection tooling on the other packages.
- Updated dependencies [958fd6f]
- Updated dependencies [958fd6f]
  - @cascivo/core@0.4.1

## 0.1.12

### Patch Changes

- Updated dependencies [357ba46]
  - @cascivo/core@0.4.0

## 0.1.11

### Patch Changes

- 810b8ba: Minor improvements
- Updated dependencies [810b8ba]
  - @cascivo/core@0.3.1

## 0.1.10

### Patch Changes

- 483e30a: Minor improvements
- Updated dependencies [483e30a]
- Updated dependencies [dd05e9b]
  - @cascivo/core@0.3.0

## 0.1.9

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.
- Updated dependencies [e29ad6e]
  - @cascivo/core@0.2.6

## 0.1.8

### Patch Changes

- b49e0ba: Fixed red flags.
- 6ee2f91: Experience fixes
- Updated dependencies [b49e0ba]
- Updated dependencies [6ee2f91]
  - @cascivo/core@0.2.5

## 0.1.7

### Patch Changes

- fc61671: Minor improvements
- Updated dependencies [fc61671]
  - @cascivo/core@0.2.4

## 0.1.6

### Patch Changes

- bb3c77e: Templates and further improvements
- Updated dependencies [bb3c77e]
  - @cascivo/core@0.2.3

## 0.1.5

### Patch Changes

- f0b5654: Fixes
- Updated dependencies [f0b5654]
  - @cascivo/core@0.2.2

## 0.1.4

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements
- Updated dependencies [2458391]
- Updated dependencies [52c08b6]
  - @cascivo/core@0.2.1

## 0.1.3

### Patch Changes

- Updated dependencies [4554af1]
  - @cascivo/core@0.2.0

## 0.1.2

### Patch Changes

- fa55081: SideNav improvements
- Updated dependencies [fa55081]
  - @cascivo/core@0.1.3

## 0.1.1

### Patch Changes

- 72d0086: New location
- Updated dependencies [72d0086]
  - @cascivo/core@0.1.2

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
