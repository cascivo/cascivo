---
'@cascivo/react': patch
'@cascivo/charts': patch
'@cascivo/icons': minor
'@cascivo/eslint-config': minor
'cascivo': patch
---

Act on the 2026-08-31 deploy-console experience report — a collapsible rail that
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
