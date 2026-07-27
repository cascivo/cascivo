---
'@cascivo/react': minor
'@cascivo/charts': minor
'@cascivo/core': minor
'@cascivo/themes': patch
'@cascivo/tokens': patch
'cascivo': patch
---

Fix the 2026-07-26 adopter pair — two same-day dashboard reports on published 0.12.0.

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
