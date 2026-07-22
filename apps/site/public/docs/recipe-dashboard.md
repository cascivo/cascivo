<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/recipe-dashboard.md
  registry v0.9.0 · generated 2026-07-22
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

## Component map

| Need                                                  | Use                                                                                               | Registry id                                          | Notes                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project/workspace switcher (top-left)                 | `Switcher`, or `Dropdown` for a richer trigger                                                    | `switcher`, `dropdown`                               | `Switcher` is a static nav list; use `Dropdown` if the trigger itself needs a button/avatar with a menu.                                                                                                                                                                    |
| Command palette (⌘K)                                  | `CommandMenu`                                                                                     | `command-menu`                                       | Full keyboard nav, fuzzy search, page-stack; native `<dialog>` focus trap built in.                                                                                                                                                                                         |
| Right-click / row actions                             | `ContextMenu`, or `OverflowMenu` for a visible "⋯" trigger                                        | `context-menu`, `overflow-menu`                      | Right-click is undiscoverable on touch — pair `ContextMenu` with a visible `OverflowMenu`/`Dropdown` for the same actions, don't ship it as the only path.                                                                                                                  |
| Page structure (shell content, toolbars, card grids)  | `Grid`/`GridItem`, `AutoGrid`, `Flex`                                                             | `layout/grid`, `layout/auto-grid`, `layout/flex`     | All exported from `@cascivo/react`. `Grid`/`GridItem` take responsive object props (`cols={{ base: 1, md: 2, lg: 3 }}`); `AutoGrid` fills columns by width with no media queries; `Flex` is the gap-based flex container. Reach for these before writing custom layout CSS. |
| Project-card grid                                     | `Card` + `Badge` (framework/status) + `RelativeTime` (last deploy), laid out in `AutoGrid`/`Grid` | `card`, `badge`, `relative-time`, `layout/auto-grid` | `AutoGrid min="16rem"` gives a responsive card grid with no media queries; use `Grid cols={{…}}` for an explicit responsive column count.                                                                                                                                   |
| KPI / usage numbers                                   | `Stat`, or `Kpi` for a chart-library tile                                                         | `stat`, `chart/kpi`                                  | `Stat` is layout-only (label/value/delta/trend); `Kpi` (from `@cascivo/charts`) bundles a trailing sparkline — see below.                                                                                                                                                   |
| Usage sparklines (inline, no axes)                    | `Sparkline`                                                                                       | `chart/sparkline`                                    | `npm: @cascivo/charts`. Token-scaled via `--cascivo-chart-*`; default 120×32, pass `width`/`height` to resize.                                                                                                                                                              |
| Time-series usage charts (with axes, zoom, live data) | `LineChart` / `AreaChart`                                                                         | `chart/line-chart`, `chart/area-chart`               | Both support time scales, multi-series, brush/zoom. For live-updating usage graphs, feed them with `useStreamSeries` (`@cascivo/charts`).                                                                                                                                   |
| Data table of deployments/rows                        | `DataTable`                                                                                       | `data-table`                                         | Sorting/pagination/search built in.                                                                                                                                                                                                                                         |
| Empty state before first deploy/project               | a dedicated empty-state block                                                                     | `block/empty-dashboard`                              | Full page: empty illustration/copy + CTA, ready to adapt.                                                                                                                                                                                                                   |

## Whole-page starting points

Don't build from the component list above if one of these already matches — start
from the block/template and adapt it, which is faster and more consistent than
composing from scratch:

| Block/template                                   | Registry id                                 | What it gives you                                                                     |
| ------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------- |
| Full KPI-tiles + charts dashboard                | `block/dashboard-charts`                    | KPI tiles, line chart, bar chart, and pie chart wired together over sample data.      |
| KPI stat-card grid only                          | `block/stats-cards`                         | Grid of `Stat` cards with trend badges — the "four numbers at the top" row.           |
| Welcome header + KPI cards                       | `dashboard-overview`                        | Header + four KPI stat cards (revenue, users, orders, …).                             |
| Searchable/sortable/paginated table page         | `dashboard-table`, `block/users-table-page` | `DataTable` wired with search, sort, pagination, export/invite actions.               |
| App shell with collapsible sidebar               | `app-shell`, `block/sidebar-app`            | Sidebar + topbar + content area chrome to host any of the above.                      |
| Carbon-parity console shell (icon-rail side nav) | `block/console-app`                         | `ShellHeader` + icon-rail `SideNav` + content area — denser, IDE-like console chrome. |

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

## Composing a KPI tile with a sparkline

The canonical dashboard tile — a number, a trend, and a tiny chart — is either:

```tsx
// Layout-only Stat, with a sparkline in its trailing `visual` slot
import { Stat } from '@cascivo/react'
import { Sparkline } from '@cascivo/charts'
;<Stat
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
;<Kpi label="Requests / min" value={1200} delta={4.3} sparkline={requestsPerMinute} />
```

Use `Stat` when the tile is pure layout and you want full control of the trailing
visual; use `Kpi` when you want the chart-library tile with the sparkline baked in.

## Don't hand-roll the behavior layer

`Dropdown`, `Menu`, `ContextMenu`, `Combobox`, `CommandMenu`, `MultiSelect`, and
`Tabs` ship with keyboard navigation, focus management, and outside-click
dismissal already implemented (native `<dialog>`/Popover APIs plus
`@cascivo/core` primitives). If you find yourself writing a `document
.addEventListener('mousedown', ...)` outside-click handler or your own arrow-key
`switch` statement for a menu, stop — the component you're wrapping already does it.
