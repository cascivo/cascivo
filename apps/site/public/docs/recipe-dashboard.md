<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/recipe-dashboard.md
  registry v0.18.0 · generated 2026-08-17
-->
# Recipe: building a console/dashboard page

You're building something like Vercel's project dashboard, a Datadog-style usage
console, or an admin panel — a sidebar or topbar, a project/workspace switcher, a
grid of cards with row actions, KPI tiles, and usage sparklines or time-series
charts. Every part below already ships in cascivo. This page maps the need to the
exact component, in one place, so you don't reach for custom SVG or a separate
headless library.

Prerequisite reading: [GETTING-STARTED.md](/docs/getting-started.md) for the two
install paths (copy-paste vs. `@cascivo/react`). Everything below works with either.

The **Channel** column says how you get each entry: a package name means you can
`import { X } from '<package>'`, and `copy-paste` means it has no npm export — run
`npx cascivo add <registry id>` to own the source, or compose it from exported primitives.
The column is generated from `registry.json` and checked by
`scripts/checks/recipe-channels.test.ts`, so it cannot drift.

## Component map

| Need | Use | Registry id | Channel | Notes |
| --- | --- | --- | --- | --- |
| Workspace/project switcher — **collapsed trigger** (the usual console shape) | `Dropdown` | `dropdown` | `@cascivo/react` | What Vercel, Linear and GitHub all ship: one row showing the current workspace, a menu on click. Put an `Avatar` + name in the trigger. |
| Workspace list — **always visible** in the sidebar | `Switcher` | `switcher` | `@cascivo/react` | Renders every entry, permanently, at full height — budget the vertical space. Despite the name it does not collapse; an adopter picked it from the name and got both teams stacked in the rail (2026-08-21 report item 5). |
| Command palette (⌘K) | `CommandMenu` | `command-menu` | `@cascivo/react` | Full keyboard nav, fuzzy search, page-stack; native `<dialog>` focus trap built in. |
| Right-click / row actions | `ContextMenu`, or `OverflowMenu` for a visible "⋯" trigger | `context-menu`, `overflow-menu` | `@cascivo/react` | Right-click is undiscoverable on touch — pair `ContextMenu` with a visible `OverflowMenu`/`Dropdown` for the same actions, don't ship it as the only path. |
| Page structure (shell content, toolbars, card grids) | `Grid`/`GridItem`, `AutoGrid`, `Flex` | `layout/grid`, `layout/auto-grid`, `layout/flex` | `@cascivo/react` | `Grid`/`GridItem` take responsive object props (`cols={{ base: 1, md: 2, lg: 3 }}`); `AutoGrid` fills columns by width with no media queries; `Flex` is the gap-based flex container. Reach for these before writing custom layout CSS. |
| Project-card grid | `Card` + `Badge` (framework/status) + `RelativeTime` (last deploy), laid out in `AutoGrid`/`Grid` | `card`, `badge`, `relative-time`, `layout/auto-grid` | `@cascivo/react` | `AutoGrid min="16rem"` gives a responsive card grid with no media queries; use `Grid cols={{…}}` for an explicit responsive column count. Under SSR pass `RelativeTime`'s `now` (a serialized server timestamp) for byte-identical server/client text — every deploy console has a "3 minutes ago" column. `CardHeader actions={…}` gives the title-left / menu-right header. |
| KPI / usage numbers | `Stat`, or `Kpi` for a chart-library tile | `stat`, `chart/kpi` | `@cascivo/react` / `@cascivo/charts` | `Stat` is layout-only (label/value/delta/trend); `Kpi` (from `@cascivo/charts`) bundles a trailing sparkline — see below. ⚠ **Pick one per app.** `<Stat card>` matches `Kpi`'s **chrome** (surface/border/radius/padding) but **not its layout** — `Kpi` puts value and delta on one line with the sparkline below, `Stat` stacks value → delta → help text with `visual` trailing — so the two rows still read as different tile designs. Use `Kpi` when you have a numeric `delta` it should format and a sparkline; `Stat` otherwise. |
| Usage sparklines (inline, no axes) | `Sparkline` | `chart/sparkline` | `@cascivo/charts` | `npm: @cascivo/charts`. Token-scaled via `--cascivo-chart-*`. ⚠ **Fixed-width** (120×32 by default) — unlike every other chart it does *not* track its container, so in a tight card header it pushes siblings onto the next line. Give it a smaller `width`, or put it in a flex item with `min-width: 0` and let the text take the remainder. |
| Time-series usage charts (with axes, zoom, live data) | `LineChart` / `AreaChart` | `chart/line-chart`, `chart/area-chart` | `@cascivo/charts` | Both support time scales, multi-series, brush/zoom. For live-updating usage graphs, feed them with `useStreamSeries` (`@cascivo/charts`). **Multi-series colours are automatic**: the Nth series takes `--cascivo-chart-N` (eight distinct hues per theme, light and dark), so a two-series chart differentiates itself with no `color` prop. Set `color` on a series only to override — e.g. to make "errors" red regardless of position. |
| Data table of deployments/rows | `DataTable` | `data-table` | `@cascivo/react` | Sorting/pagination/search built in. Set `Column.width` (any CSS length) on identifier-shaped columns — default sizing doesn't consider content shape, so a commit hash wraps mid-hash. **Size SOME columns, not all**: sizing every one flips the table to `table-layout: fixed`, which can overflow its container (the far columns are then reachable by horizontal scroll, not dropped). Leave at least one free-form column unsized to absorb the remaining width. Sized and unsized columns alike have a content floor, so `minWidth` is only for raising it. |
| Page header (title + description + breadcrumb + actions) | `PageHeader` | `layout/page-header` | `@cascivo/react` | Every routed page needs one. Now exported — do **not** hand-compose it from `Heading`/`Text`/`Flex`, and don't `npx cascivo add` it just for this (that mixes consumption paths). Pair `breadcrumb={<Breadcrumb …/>}` with `actions={<Button …/>}`. |
| Empty state before first deploy/project | a dedicated empty-state block | `block/empty-dashboard` | copy-paste | Full page: empty illustration/copy + CTA, ready to adapt. |

## Whole-page starting points

Don't build from the component list above if one of these already matches — start
from the block/template and adapt it, which is faster and more consistent than
composing from scratch:

| Block/template | Registry id | What it gives you |
| --- | --- | --- |
| Full KPI-tiles + charts dashboard | `block/dashboard-charts` | KPI tiles, line chart, bar chart, and pie chart wired together over sample data. |
| KPI stat-card grid only | `block/stats-cards` | Grid of `Stat` cards with trend badges — the "four numbers at the top" row. |
| Welcome header + KPI cards | `dashboard-overview` | Header + four KPI stat cards (revenue, users, orders, …). |
| Searchable/sortable/paginated table page | `dashboard-table`, `block/users-table-page` | `DataTable` wired with search, sort, pagination, export/invite actions. |
| App shell with collapsible sidebar | `app-shell`, `block/sidebar-app` | Sidebar + topbar + content area chrome to host any of the above. |
| Carbon-parity console shell (icon-rail side nav) | `block/console-app` | `ShellHeader` + icon-rail `SideNav` + content area — denser, IDE-like console chrome. |

Before scaffolding by hand, check `list_templates` (MCP) or `/docs/marketplace` for a
whole-page `dashboard` template — see the `cascivo:design-page` skill's step 0.

## Reference implementations

Five full example apps compose exactly this component set into real consoles —
read one end-to-end rather than starting from a blank file:

- [`apps/examples/deploy`](https://github.com/cascivo/cascivo/tree/main/apps/examples/deploy) — Vercel-style deploy dashboard: project grid, switcher, sparklines.
- [`apps/examples/pulse`](https://github.com/cascivo/cascivo/tree/main/apps/examples/pulse) — Datadog-style monitoring console: `LineChart`, `Sparkline`.
- [`apps/examples/trade`](https://github.com/cascivo/cascivo/tree/main/apps/examples/trade) — Trade Republic-style: `Sparkline`, `Stat`.
- [`apps/examples/pay`](https://github.com/cascivo/cascivo/tree/main/apps/examples/pay) — Stripe-style: `AreaChart`, `BarChart`.
- [`apps/examples/track`](https://github.com/cascivo/cascivo/tree/main/apps/examples/track) — Linear-style issue tracker console.


## Bundle size, and the 500 KB warning on your first build

A six-route console drawing on a few dozen of the catalog's components plus three chart
types measures roughly
**540 KB JS / 177 KB gzip** and **166 KB CSS / 21 KB gzip** in production. Vite prints its
default `chunk-size-limit` warning at 500 KB, so **a stock cascivo dashboard trips that
warning on the first build**. That is alarming and worth explaining: it is one eagerly-loaded
chunk containing every route, not a signal that something is wrong.

The fix is ordinary route-level code splitting, which every router supports — **including
the index route.** That last clause is the whole trick, and omitting it is what has cost two
adopters a build cycle each:

```tsx
// React Router — lazy route modules. Note `/` is lazy too, not just the "big" routes.
{ index: true, lazy: () => import('./routes/overview') },
{ path: 'analytics', lazy: () => import('./routes/analytics') },

// TanStack Router — the same idea
createFileRoute('/analytics')({ component: lazyRouteComponent(() => import('./analytics')) })
```

Charts are the single biggest win: `@cascivo/charts` is a real charting engine, and a
console typically renders charts on one or two routes out of six. Splitting those routes
keeps the engine out of the initial chunk entirely.

> ### ⚠ Split the index route too, or the chart engine lands in your entry chunk anyway
>
> "Split the chart routes" reads as *not* including the landing page, and an adopter took it
> that way (2026-08-08 report B). They split `/analytics` exactly as above, left `/` eager,
> and measured:
>
> ```
> dist/assets/index-*.js     524.70 kB   ← still over the limit
> dist/assets/analytics-*.js   2.88 kB   ← the "big" chart route
> ```
>
> The analytics chunk was 2.9 kB because `@cascivo/charts` was *already* in the entry chunk:
> the Overview page uses `Sparkline` in its KPI tiles and project cards — which is what
> ["Composing a KPI tile with a sparkline"](#composing-a-kpi-tile-with-a-sparkline) below
> recommends. One `Sparkline` on an **eagerly-loaded** route pulls the engine into the entry
> chunk, and route-splitting the chart pages then buys almost nothing.
>
> Making `/` lazy like every other route fixes it, at no cost. A later adopter did exactly
> that on the same shape of app and measured (2026-08-21 report):
>
> ```
> dist/assets/index-*.js     413.07 kB / 133.25 kB gzip   ← no warning
> dist/assets/dist-*.js       44.87 kB /  14.84 kB gzip   ← the chart engine, shared
> ```
>
> Sparklines on the landing page **and** an entry chunk under the limit. The engine moves to
> a shared chunk that every chart route reuses; the landing page fetches it in parallel with
> its own chunk rather than serialised behind the entry.
>
> **One sparkline and no engine at all.** If a page wants a trend line but draws no real
> charts — a marketing page, a KPI strip — import from the engine-free subpath instead:
>
> ```tsx
> import { Sparkline } from '@cascivo/charts/sparkline'   // ~3.5 kB gzip, no chart engine
> ```
>
> Same chart, same props, same markup; the one difference is that it has no hover tooltip,
> because the tooltip is what requires the engine. Use the main entry when the page draws
> other charts anyway — the engine is then already paid for and the subpath saves nothing.
>
> Two footnotes:
>
> - **Do not pre-emptively raise `build.chunkSizeWarningLimit`.** The 2026-08-21 adopter set
>   it to 700 on the strength of an earlier version of this box, measured, and deleted it
>   again — it was never needed. Raise it only after you have measured and decided the number
>   is fine.
> - **Expect a `HydrateFallback` warning** once your routes are lazy — it is React Router's,
>   not cascivo's, and
>   [USING-WITH-A-ROUTER.md](/docs/using-with-a-router.md#4-code-splitting--and-the-hydratefallback-warning-it-produces)
>   has the two-line fix.
> - **Verify rather than assume.** `grep` the built bundles for a chart-engine symbol to
>   confirm which chunk it landed in. Chunking is a property of your import graph, not of
>   cascivo.

The CSS number behaves differently and needs no action — per-component tree-shaking already
dropped ~40% of the aggregate sheet (166 KB of 273 KB) — **except under SSR**, where the
aggregate import is required; see
[USING-WITH-VITE-SSR.md](/docs/using-with-vite-ssr.md#the-cost-per-component-css-tree-shaking-does-not-apply-under-ssr).

## Composing a KPI tile with a sparkline

The canonical dashboard tile — a number, a trend, and a tiny chart — is either:

```tsx
// Layout-only Stat, with a sparkline in its trailing `visual` slot
import { Stat } from '@cascivo/react'
import { Sparkline } from '@cascivo/charts'

<Stat
  label="Requests / min"
  value="1.2k"
  delta="+4.3%"
  trend="up"
  visual={<Sparkline data={requestsPerMinute} label="Requests per minute trend" />}
/>
```

```tsx
// Or the charts package's own KPI tile, sparkline built in
import { Kpi } from '@cascivo/charts'

<Kpi
  label="Requests / min"
  value={1200}
  delta={4.3}
  deltaFormat="percent"   // renders +4.3% — `delta` is a number, Kpi owns the formatting
  sparkline={requestsPerMinute}
/>
```

Use `Stat` when the tile is pure layout and you want full control of the trailing
visual; use `Kpi` when you want the chart-library tile with the sparkline baked in.
The two disagree deliberately about who formats: `Stat` takes `delta` as a
pre-formatted **string** (you own it), `Kpi` takes a **number** and owns the sign, arrow,
colour and unit — pass `deltaFormat="percent"` for `+4.3%`, or a function for anything else.

## Sizing charts — omit `width`

**Every chart in `@cascivo/charts` is responsive by default. Omit `width` and it fills its
container**, tracking resizes through a `ResizeObserver`. There is no config, no wrapper and
no container query to write:

```tsx
<Card>
  <CardHeader>Requests</CardHeader>
  <CardContent>
    <AreaChart title="Requests" series={series} x={(d) => d.t} y={(d) => d.v} height={240} />
  </CardContent>
</Card>
```

- **`width`** — a *fixed* SVG width in px, for an export or a thumbnail. It is clamped to the
  container (`max-inline-size: 100%`), so it can never overflow its card, but it also stops
  the chart from growing. In a responsive dashboard grid there is no correct number: don't
  pass one.
- **`height`** — sets the aspect (default 300; 48 in `plain` mode). Unlike `width` it does
  **not** track the container, so this is the knob you do set.
- **`useChartSize`** is **not** the answer to "make my chart responsive" — charts already
  call it internally. Reach for it only to size a *different* element to match a chart, or to
  build a custom chart on the same measurement primitive.

Two axis-chrome details worth knowing, both automatic:

- Margins are sized to the actual tick labels, so a `60,000` left label or a right-hand
  second axis is never clipped.
- A crowded category axis is auto-strided (`Jun 1 … Jun 30` renders every Nth label).
  `xLabelEvery` **overrides** that computation — omit it unless you specifically want a
  different stride; passing `Math.ceil(n / 8)` "to help" makes it worse.
  The stride is direction-aware: `orientation="horizontal"` stacks its categories down the
  y-axis, so they are measured by line height, not by name length. If you still see labels
  dropped on an axis that visibly has room, that is a bug worth reporting — but
  `categoryLabelEvery={1}` forces every label in the meantime.

## Importing from more than one cascivo package

A dashboard file often imports from `@cascivo/react`, `@cascivo/charts` and `@cascivo/icons`
at once. One name clash remains, and a wrong resolution is **silent** — the wrong component
renders, nothing errors:

| Name | `@cascivo/react` | `@cascivo/charts` |
| --- | --- | --- |
| `Text` | the typography component | an SVG `<text>` primitive for custom charts |

Alias whichever you use less:

```tsx
import { Text } from '@cascivo/react'
import { Text as ChartText } from '@cascivo/charts'
```

`Calendar` used to clash the same way. The charts heatmap is now **`CalendarHeatmap`**, so
`Calendar` unambiguously means `@cascivo/react`'s date picker and no alias is needed:

```tsx
import { Calendar } from '@cascivo/react' // date picker
import { CalendarHeatmap } from '@cascivo/charts' // activity heatmap
```

`@cascivo/icons` shares names with both by nature — an icon set of ~440 nouns contains
`Search`, `Filter`, `Grid`, `User`, `BarChart`, `PieChart`. The convention is the same one
every icon library uses: `import { Search as SearchIcon } from '@cascivo/icons'`.
`scripts/checks/export-collisions.test.ts` fails CI on a **new** react↔charts collision.

## Don't hand-roll the behavior layer

`Dropdown`, `Menu`, `ContextMenu`, `Combobox`, `CommandMenu`, `MultiSelect`, and
`Tabs` ship with keyboard navigation, focus management, and outside-click
dismissal already implemented (native `<dialog>`/Popover APIs plus
`@cascivo/core` primitives). If you find yourself writing a `document
.addEventListener('mousedown', ...)` outside-click handler or your own arrow-key
`switch` statement for a menu, stop — the component you're wrapping already does it.
