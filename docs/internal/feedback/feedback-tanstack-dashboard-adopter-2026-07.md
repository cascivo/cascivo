# cascivo experience report — Vercel-like dashboard with TanStack Start

> Source: external AI adopter report, received 2026-07-16. Reproduced verbatim.
> Fix plan: `fix-plan-tanstack-dashboard-adopter-2026-07.md` (same directory).

One-shot build. Goal: experience the **cascivo** UI library from a clean slate
while building a Vercel-style dashboard on **TanStack Start**. This document is
the deliverable; the code is the vehicle. Findings are recorded to be fixed
upstream in cascivo, not worked around silently here — every workaround I wrote
is also logged below as a finding.

## Environment

| Thing | Version |
| --- | --- |
| cascivo CLI | 0.4.2 (via `npx`) |
| @cascivo/react | 0.6.3 |
| @cascivo/charts | 0.3.10 |
| @cascivo/themes | 0.4.0 |
| @cascivo/icons | 0.2.8 |
| @preact/signals-react | 3.10.3 |
| TanStack Start (`@tanstack/react-start`) | 1.168.28 |
| React | 19.2.7 |
| Vite | 8.1.5 |
| Node | 22.22.2 |
| pnpm | 10.33.0 |

## What I built

A three-route dashboard (Overview / Deployments / Analytics) with an app
shell + side nav, dark theme with a working light/dark toggle, KPI tiles with
sparklines, an area chart, a bar chart, a donut chart, and a full deployments
data table (sort + search + pagination). All UI is cascivo; the framework is
TanStack Start (SSR + file-based routing). Consumption path: the **prebuilt
`@cascivo/react` package** (not the copy-paste CLI flow).

Final state: `tsc`, `eslint`, and `vite build` (client + SSR) all pass with zero
errors/warnings; all routes server-render; 0 React hydration mismatches after
the workarounds below.

---

## What went well

1. **`llms.txt` / `llms-full.txt` are a genuinely good AI-first entry point.**
   Clear install paths, a component index by role, the theming model, and —
   critically — an explicit **SSR caveat for Vite/TanStack/Remix**: add
   `ssr: { noExternal: [/^@cascivo\//] }` and import the aggregate stylesheet.
   That instruction was correct and prevented the documented
   `Unknown file extension ".css"` SSR crash on the first try.

2. **The prebuilt package ships a complete inline API reference.**
   `@cascivo/react/dist/index.d.ts` has every component's props with JSDoc on
   individual fields (e.g. `Stat.visual`, `AppShell.header` burger wiring,
   `DataTable` selection/batch actions). I built the entire app from the types
   alone, without opening the docs site once. Excellent for typed adopters and
   for agents.

3. **Component breadth is real and high quality.** `DataTable` gave sortable
   columns, search, pagination, density, sticky header, selection, and batch
   actions out of the box, styled correctly with zero CSS from me — a huge time
   saver for a dashboard. `Stat`/`Kpi` render label + value + trend delta +
   sparkline with a couple of props. `Status` (pulsing dot), `Badge`, `User`
   (avatar + name), `RelativeTime`, `Separator`, `Card` all did exactly what a
   dashboard needs.

4. **Theming is clean and worked first try.** `data-theme` attribute +
   `ThemeProvider`; 12 first-party themes; a controlled `value` prop let me
   drive dark/light from React `useState`. Toggling recolored every component
   *and* the charts via tokens — no per-component theme wiring.

5. **Charts have a thoughtful, accessor-based API.** `AreaChart`/`BarChart`/
   `PieChart` take `series` + `x`/`y` functions (echarts/visx-like), plus
   gradient fills, tooltips, curves, annotations, brush/zoom/toolbox. They also
   render as real SSR SVG. `AreaChart`, `BarChart`, and `Kpi` sparklines
   hydrate cleanly under SSR (see the pie caveat below for the exception).

6. **SSR was considered in the component design.** `RelativeTime` has a `now`
   override "mainly for deterministic tests" that also makes SSR deterministic;
   charts default to a fixed 400×300 and only measure in a post-hydration
   effect (so most hydrate cleanly). These are the right primitives — they're
   just not defaulted safely everywhere (see friction #7, #8).

7. **CSS-module + cascade-layer architecture.** Hashed class names
   (`_card_hb4jd_2`), everything in `@layer`. It coexisted with the Tailwind v4
   preflight that TanStack Start force-installs, with no visible reset conflict.

8. **Install is frictionless.** `pnpm add @cascivo/react @cascivo/themes
   @cascivo/icons @preact/signals-react` just worked; peer deps are clearly
   documented. No codegen/config step beyond one stylesheet import.

---

## What went badly (friction)

1. **Charts are a separate package that Quick Setup never mentions.**
   `llms.txt` lists "204 Components → Display: Chart (25 types)" as if charts
   ship in the main package, and the Quick Setup install line is only
   `@cascivo/react @cascivo/themes @preact/signals-react`. But `@cascivo/react`
   has **no chart export at all** — charts live in `@cascivo/charts` (0.3.10). I
   only found this from a passing docstring ("a `Sparkline` from
   `@cascivo/charts`") and by checking npm. A fresh adopter writing
   `import { AreaChart } from '@cascivo/react'` for a dashboard hits a wall
   immediately. *Fix upstream: put `@cascivo/charts` in the Quick Setup install
   for any data/dashboard use case, and stop counting charts in the main
   package's component total.*

2. **Two different, unreconciled stories for how to load CSS.** The
   `@cascivo/react` README (Next.js-centric) says with a bundler you should
   **not** import `styles.css` — per-component CSS is auto-included and
   tree-shaken. `llms.txt` says for TanStack import the **aggregate**
   `@cascivo/react/styles.css`. Under TanStack Start the per-component path
   trips the SSR loader, so the aggregate is the only reliable option — but it
   ships **every** component's CSS (297 KB / ~41 KB gzip) with no tree-shaking.
   Net: on TanStack you pay full CSS weight, and the per-framework guidance
   isn't spelled out in one place. *Fix upstream: a TanStack Start setup page
   that states the tradeoff explicitly.*

3. **Icon names must come from the catalog; guessing is a compile error.**
   `Rocket`, `LayoutDashboard`, and `GitBranch` don't exist; the real names are
   `Dashboard`, `Spaceship`, `Fork`, etc. `llms.txt` does warn ("resolve via the
   catalog rather than guessing") and lists a few mappings, but nothing in the
   package surfaces intended-name → actual-name, so the natural first guess
   (`Rocket` for deployments) fails to import. Mild for a human, a real tax for
   an agent typing from memory.

4. **`useTheme()` returns a Preact signal, not a value.** Its shape is
   `readonly [Signal<string>, (next) => void]`. Reading `.value` in a React
   component only triggers re-renders if signals-react tracking is active
   (babel transform / `useSignals()`), which a plain TanStack Start component
   doesn't have by default. I sidestepped it entirely with React `useState` +
   `<ThemeProvider value={...}>` (a controlled mode the library supports), but
   the signal-returning hook is a surprising shape for a React consumer and the
   signals/React reactivity boundary is an unstated gotcha.

5. **`SideNav` (and `ShellHeader` nav) aren't framework-router aware.** Nav
   items are config objects that render plain `<a href>`; there's no `asChild`
   or Link-component slot. To keep navigation client-side through TanStack
   Router I had to intercept each item's `onClick` with `preventDefault()` +
   `navigate()`. It works, but it's boilerplate and it forfeits the router's
   `defaultPreload="intent"` hover-preloading. *Fix upstream: an `asChild`/
   `renderLink` escape hatch on nav items (SideNav has a `render` hatch but it
   discards the item's own icon/label layout).*

6. **`RelativeTime` defaults to a live-syncing value (SSR hazard).** `sync`
   defaults to `true` (a running interval), so server and client render
   different strings and it re-renders on a timer — a hydration hazard unless
   you pass a fixed `now`. The escape hatch exists; the *default* is the unsafe
   one. I pass a fixed `now` everywhere.

7. **`pnpm 11+` / `Node 22.12+` floors are stated but not enforced/accurate.**
   Docs say pnpm 11+; pnpm 10.33 worked with no issue. Minor, but the stated
   floor is stricter than reality.

8. **`Grid gap` is a constrained token scale.** `gap` only accepts
   `1|2|3|4|5|6|8|10|12`; `gap={7}` is a type error. Fine once you read the
   type, surprising if you expect an arbitrary number.

9. **Tailwind is dead weight on a cascivo project.** TanStack Start force-
   installs Tailwind v4 (opt-out is deprecated and ignored). cascivo is
   CSS-native, so you carry an unused Tailwind toolchain + preflight reset. No
   visible conflict here, but it's a latent cascade/reset risk against a
   CSS-native library and pure bloat.

---

## Red flags & blockers

No hard blockers — the dashboard shipped. Two issues rise to **red flag**
because they cost real debugging time and one of them **fails silently**:

### R1. `PieChart` (donut) can't be SSR-hydrated cleanly

Rendering `<PieChart donut>` inline under TanStack Start SSR produced **~13
React hydration attribute mismatches** ("A tree hydrated but some attributes …
This won't be patched up"), i.e. React throws away the server markup for the
donut. `AreaChart`, `BarChart`, and `Kpi` sparklines do **not** have this
problem, so it's specific to the pie.

- Passing an explicit `size` / `width` / `height` did **not** fix it.
- The only thing that cleared it was rendering the chart **client-only** (mount
  gate), which then surfaces a benign but noisy
  `ResizeObserver loop completed with undelivered notifications` console error
  on mount.

Net: today the donut effectively cannot be server-rendered on TanStack Start
without either console errors or a client-only boundary. *Fix upstream: make
`PieChart`'s first render deterministic between server and client the way
Area/Bar already are.*

### R2. Responsive `<Grid cols={{...}}>` silently collapses to one column

`<Grid cols={{ base: 1, sm: 2, lg: 4 }}>` rendered as a **single stacked
column at every viewport width**, with **no error or warning**. Root cause: the
responsive column counts are implemented with `@container` queries, so they
only apply when an ancestor establishes a containment context
(`container-type: inline-size`). Nothing in `AppShell` / the page does that by
default, so the container queries never match and the grid falls back to the
base column count.

This is the most dangerous finding precisely because it's **silent** — I only
caught it by screenshotting the running app; types, build, lint, and SSR all
pass while every responsive grid is quietly broken. A fresh adopter would
reasonably conclude "cascivo responsive grids don't work." *Fix upstream:
either establish the container context inside `AppShell`/`Grid` itself, document
the `container-type` requirement prominently, or fall back to `@media` so grids
work without a container ancestor.*

---

## Workarounds applied (each is also a finding above)

| Finding | Workaround in this repo | Where |
| --- | --- | --- |
| R1 PieChart SSR mismatch | `ClientOnly` mount-gate around the donut | `src/components/client-only.tsx`, `src/routes/analytics.tsx` |
| R2 Grid single-column | `container-type: inline-size` on the content wrapper | `src/components/dashboard-layout.tsx` |
| #5 SideNav not router-aware | `onClick` → `preventDefault()` + `navigate()` | `src/components/dashboard-layout.tsx` |
| #6 RelativeTime live sync | fixed `now` constant on every `RelativeTime` | `src/lib/format.ts`, routes |
| #4 useTheme signal shape | controlled `ThemeProvider value` + React `useState` | `src/components/dashboard-layout.tsx` |
| SSR `.css` crash (documented) | `ssr.noExternal` + aggregate `styles.css` import | `vite.config.ts`, `src/styles.css` |

## Bottom line

cascivo is pleasant and productive for a dashboard: the component set is broad,
the types are a first-class reference, `DataTable`/`Stat`/theming are standout,
and the documented TanStack SSR caveat was accurate. The rough edges are
concentrated in **framework integration under SSR**: charts split into an
undocumented-at-setup package (#1), a `PieChart` that can't hydrate cleanly
(R1), and — worst — responsive `Grid` that **fails silently** without a
container ancestor (R2). Fixing R2's silent failure and R1's pie hydration, and
adding a first-class TanStack Start setup page (charts package + CSS strategy +
router-aware nav), would remove most of the friction a real adopter hits.
