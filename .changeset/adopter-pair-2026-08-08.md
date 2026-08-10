---
'@cascivo/core': patch
'@cascivo/react': patch
'@cascivo/charts': patch
'@cascivo/themes': patch
'cascivo': patch
---

Fixes for the 2026-08-08 adopter pair (two Vercel-style dashboards, TanStack Start and React Router).

**Correctness**

- `DataTable` controlled selection no longer logs "Cannot update a component while rendering a
  different component" under React 19. The documented controlled API was unusable without
  console noise, and under concurrent rendering the render-phase write was a real hazard. Eleven
  other components carrying the same shape are migrated, and a guard keeps it out.
- `timeScale` returns a usable number of ticks for sub-day domains. A "last 24 hours" chart —
  the canonical dashboard panel — rendered a single date tick and ignored `xTicks` entirely.
  `TimeScale.tickFormat()` is now wired into `Axis`, so a sub-day axis formats as times instead
  of repeating the same date on every tick.

**Layout and interaction**

- `Card` is `position: relative`, so the stretched-link pattern no longer covers the whole page
  with an invisible overlay that swallows every click.
- `AppShell` gains `padding`, defaulting to space step 6. Content no longer sits flush against
  the viewport edge; pass `padding="none"` for full-bleed layouts.
- `Checkbox`'s decoration no longer intercepts pointer events, so `.check()` works in Playwright
  without `{ force: true }`.
- `DataTable` zebra striping is visible. It was painted with a token every theme aliases to the
  surface colour, so the stripes were exactly the colour they were striping.
- An icon composed next to a label inside a `Button` now gets the button's `gap`.
- A `Card` inside a spanning `GridItem` fills the row height instead of leaving a hole, and
  `Field`s in a `Grid` row keep their inputs aligned.

**API**

- `SwitcherLink` gains `id`, so sibling entries pointing at the same `href` no longer produce
  duplicate-key warnings.
- `AreaChartSeries` gains `type: 'area' | 'line'`, making a dual-axis requests-vs-errors chart
  expressible — previously two opaque fills hid each other and no prop could separate them.
- Badge's internal `BadgeShape` type is renamed `BadgeVariant`. It typed the `variant` prop while
  reading as the type of a `shape` prop that does not exist.

**Documentation**

- 39 previously undocumented props and 114 missing type definitions across charts, flow and
  editor now reach `registry.json`, `llms.txt` and the docs site — including `AreaChart.format`,
  which was the fix for the tick bug above and was invisible to every generated surface.
- A published prop-name vocabulary (`items` vs `rows`, `variant` vs `shape`, `kind` as the union
  tag, and the numeric `gap={4}`) in `AI-RULES.md`, `llms.txt` and `CLAUDE.md`.
- Router active-item prefix matching, `Card padding="none"` semantics, `DataTable` density and
  column sizing, `Button`'s DOM shape, checkbox testing, and the sparkline/code-splitting
  trade-off are all documented on every surface that should carry them.

**CLI**

- `cascivo create` scaffolds a project whose `lint` actually inspects TypeScript. It previously
  exited 0 having checked zero files. It also scaffolds Prettier, and its generated pages no
  longer use the inline styles its own `AGENTS.md` forbids.
