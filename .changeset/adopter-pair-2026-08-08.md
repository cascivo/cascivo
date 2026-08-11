---
'@cascivo/core': minor
'@cascivo/react': minor
'@cascivo/charts': minor
'@cascivo/editor': minor
'@cascivo/flow': minor
'cascivo': minor
---

Fixes for the 2026-08-08 adopter pair (two Vercel-style dashboards, TanStack Start and React Router).

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
