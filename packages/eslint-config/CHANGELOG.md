# @cascivo/eslint-config

## 0.4.0

### Minor Changes

- 00c1a9e: Enforce the styling contract: a `--cascivo-*` token or `data-cascivo-*` hook that does not
  exist is now reported instead of silently doing nothing.

  CSS drops an unknown custom property without a word, and a selector that matches nothing is
  not an error either — so a misspelled token had no diagnostic anywhere in the toolchain. It
  found `--cascivo-button-bg`, taught as the worked example of the override ladder's first rung
  in four guides and defined by no stylesheet in the repo.

  - **`@cascivo/eslint-plugin`** adds `cascivo/token-values`, which reports an unknown
    `--cascivo-*` custom property in a JSX `style` prop (through the `as CSSProperties` cast
    React forces) and names the token that exists, including when the words are in the wrong
    order (`--cascivo-text-color` → `--cascivo-color-text`).
  - **`@cascivo/eslint-config`** enables it at `warn` as `cascivoTokenValues`.
  - **`@cascivo/tokens`** publishes `./style-contract` and `./style-contract.json`:
    `CascivoComponentToken`, `CascivoAnyToken`, `CascivoStyleHook`, and `CascivoTokenStyle` for
    `satisfies`-checking an inline style before the cast erases the name.
  - **`cascivo`** adds the `unknown-token` and `unknown-style-hook` audit rules at error level,
    covering CSS files as well as TSX.

  All four read one generated name set, so they cannot disagree with each other or with the
  shipped CSS.

  **Button gains the per-variant background tokens the docs had been promising.**
  `--cascivo-button-{primary,secondary,ghost,destructive}-bg`, plus `-bg-hover` for each and
  `-bg-active` for primary, each falling back to the semantic default it replaced — so nothing
  changes until you set one. This is the rung-1 lever for restyling one button family without
  moving `--cascivo-color-primary` under every other primary surface in the subtree. The
  foreground deliberately stays on the semantic tier: a background light enough to need dark
  text still needs `--cascivo-color-primary-fg` set alongside it.

- a8292df: Act on the 2026-08-31 deploy-console experience report — a collapsible rail that
  was broken end to end, plus fourteen smaller API and docs fixes.

  **The rail.** `AppShell` and `SideNav` fought over the nav column and `AppShell`
  won. `AppShell` pinned its inner wrapper to `--cascivo-shell-aside-inline-size` and
  stretched the nav back out with `flex: 1 1 auto`, so collapsing to the rail shrank
  the items to icons and left the column at its full width — measured 288px → 288px.
  `AppShellProps`' own docblock promised the two "compose on different axes and never
  fight". The column now follows the nav's `data-state` via `:has()`, full-hide still
  takes precedence over the rail width, and the composition is asserted in a real
  browser by `computed:check`.

  Two defects rode on top of it. Controlling `SideNav.collapsed` — the only workaround
  while the rail was broken — emitted `Cannot update a component while rendering a
different component` on every collapse, with signals or with `useState`, because the
  prop was mirrored into a signal during render. The rail state is read only during
  render, so it now reads the prop directly and the write is gone. And group headings
  kept painting on the 4rem rail, clipped mid-word; they are now hidden there (still
  in the a11y tree) and legible again on hover-expand.

  `SideNav.header` and `SideNav.footer` accept `({ collapsed }) => node`, so a team
  switcher or a "New project" button can shrink to a rail icon — the thing that forced
  the controlled-collapse workaround in the first place.

  **Diagnosability.** The published bundles keep function and class names, so React
  names cascivo components in its warnings instead of `x`. 88.5 KB → 90.5 KB gzip
  across the whole react tree.

  **Linting.** `@cascivo/eslint-config` now ships an oxlint fragment at
  `@cascivo/eslint-config/oxlintrc.json`. `pnpm create vite --template react-ts`
  scaffolds oxlint, not ESLint, and it reports the mandatory `signal.value = next`
  idiom as `react(immutability)` — the documented remedy was ESLint-only and did not
  apply to the most common way to start a project.

  **API.**

  - `FlexItem` (`size`, `basis`, `truncate`) — the counterpart to `GridItem`. Every raw
    `style={}` escape in the reported app was a missing flex item prop.
  - `DataListItem` is a component. The pair shape is now `DataListEntry`;
    `DataListItem` stays as a deprecated type alias so existing annotations compile.
  - `LogLine.timestamp` renders in its own dimmed, column-aligned gutter, excluded from
    the built-in search and from the copy button. Formatting a clock into `text` made
    `08:59` match every line.
  - `SegmentedControl` accepts `ariaLabel` / `label`, like the rest of the catalog.
  - `AreaChart`/`LineChart` thread the `x` accessor's return type into `format`, so a
    `Date` series gets `format: (value: Date) => string` with no `instanceof` guard.
  - `@cascivo/icons` exports the familiar names from other sets — `Rocket`,
    `LayoutDashboard`, `MagnifyingGlass`, `Gear`, `Bolt` and ~35 more — as real
    exports, minus the five that would collide with a component, chart or icon.
  - `cascivo init` / `cascivo add` pin exact versions, in each package manager's own
    spelling of the flag.

  **Docs.** `Search.ariaLabel` no longer claims `label` is visible (on `Search` both
  names are invisible; they differ in mechanism). Every framed chart documents that
  `height` tracks its container. `@cascivo/react`'s `.d.ts` carries `@cascivo/core`'s
  docblocks for the 56 names it re-exports, so it stays grep-complete on the path where
  `node_modules/@cascivo/core` does not exist. The react↔icons collision list is
  generated into `RECIPE-DASHBOARD.md` and enforced. Getting-started opens with the
  docspack index rather than a 2,000-line linear read.

### Patch Changes

- Updated dependencies [00c1a9e]
  - @cascivo/eslint-plugin@0.2.0

## 0.3.0

### Minor Changes

- 82423c6: Enables `cascivo/prop-vocabulary` at `warn`, via the new `@cascivo/eslint-plugin`.

  The rule answers a wrong prop guess with the prop that exists. TypeScript already rejects
  `<Text tone="subtle">`; its message names the mistake and not the fix, so the adopter goes
  looking for the docs — the dependency a 2026-08-21 report named as the system's real weak
  spot ("the docs are doing work the API should eventually do itself"). The rule says:

  ```
  `Text` has no `tone` prop — it is `muted`. `tone` is the catalog's SEVERITY vocabulary
  (Status, Badge, Timeline, SideNav). Text emphasis is the boolean `muted`.
  ```

  It also autofixes `gap="4"` → `gap={4}`, rewrites a foreign import name to the cascivo
  component (`Dialog` → `Modal`), and flags `const { theme } = useTheme()` (a tuple) and
  `<Flex justify=…>` with no `direction` (`Flex` is vertical by default).

  `warn`, never `error`: a lint error over a naming opinion is a reason to delete the config,
  which would take `react-hooks/immutability` with it. Spread `cascivoPropVocabulary` yourself,
  or take all three fragments via the default export.

### Patch Changes

- a0bb1cf: Release every published package.

  This changeset names all twenty published packages so the next release cuts a version for each
  of them, including the four that no other pending changeset touches (`@cascivo/docs`,
  `@cascivo/docspack`, `@cascivo/eslint-plugin`, `@cascivo/vite-plugin`).

  The bump is `patch` everywhere; where another pending changeset asks for a `minor` or `major`,
  that higher bump still wins.

- Updated dependencies [a0bb1cf]
  - @cascivo/eslint-plugin@0.1.1

## 0.2.4

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

## 0.2.3

### Patch Changes

- 3fcf3f1: Bump every published package so the next release run publishes the whole set.

  The 0.17.0 bump landed on `main` but never reached npm: the release job's build
  died inside `changesets/action` with `Failed to spawn process: Resource
temporarily unavailable (os error 11)` — an `EAGAIN` write to that action's
  stdout pipe, not a build failure. This changeset re-cuts the whole set on top of
  the workflow fix, so every package publishes from a release that runs its build
  in a runner-owned step.

## 0.2.2

### Patch Changes

- 66b251d: Bump every published package so the next release run publishes the whole set.
  Packages that carried no substantive change of their own have fallen behind the
  rest of the workspace; this gives each of them a real new version so the
  published set stays in lockstep.

## 0.2.1

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

## 0.2.0

### Minor Changes

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
