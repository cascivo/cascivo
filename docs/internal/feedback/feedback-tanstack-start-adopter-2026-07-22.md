# Experience report — cascivo × TanStack Start

**Prompt:** "create a vercel like dashboard with tanstack"
**Framework:** TanStack Start (React 19, Vite 8, file-based routing) — scaffolded with `@tanstack/cli create --blank`.
**UI library:** cascivo — prebuilt packages `@cascivo/react@0.9.0`, `@cascivo/charts@0.3.14`, `@cascivo/icons@0.3.1`, `@cascivo/themes@0.4.3`.
**What got built:** A five-route dashboard — Overview (KPI stats + gradient area chart + recent-deployments list), Deployments (`DataTable` with search/sort/pagination/custom cells), Analytics (multi-series area + line + horizontal bar charts), Projects (card grid), Settings (form with fields/select/toggles). Dark theme, sidebar shell, theme toggle.

**Final state:** `typecheck`, `lint`, `build`, and `format` all pass; all five routes render server-side and hydrate (HTTP 200, verified with curl + Playwright screenshots) — **but only after working around a hard SSR blocker and a theme-FOUC issue (see Red flags).** Out of the box, following the getting-started guide verbatim, the app returned HTTP 500 on every route.

---

## What went well

- **AI-first discovery is genuinely excellent.** `npx cascivo list` prints every component with category + description. `cascivo.com/llms.txt` indexes every component to a fetchable `llms/<name>.md` with the full prop table + a usage example. There's also `registry.json`, `icons.catalog.json`, `tokens.catalog.json`, and an MCP server. I could build the entire app from these without ever opening a browser DevTools. This is the strongest part of the library.
- **Breadth covers a dashboard end-to-end.** AppShell, ShellHeader, SideNav, Stat, Status, Badge, Card, DataTable, Separator, Field/Input/NativeSelect/Toggle, plus 25 chart types — every piece a Vercel-style dashboard needs existed. Nothing had to be hand-rolled.
- **Plain-React consumer API.** Despite being signals-based internally, components take normal React props. `DataTable` in particular is a highlight: sort + client search + pagination + per-column `render` cells + sticky header + zebra from one declarative prop object, and it rendered correctly server-side.
- **Types are thorough and self-documenting.** The `.d.ts` files carry rich JSDoc — a11y notes ("mark it `aria-hidden` yourself…"), `@deprecated` markers (`Toggle.onChange` → `onValueChange`), and precise unions (`Column<Row>`, `AreaChartSeries<Datum>`). Autocomplete alone was enough to use most components correctly.
- **Icons are frictionless.** `@cascivo/icons` exposes 480+ named exports with a simple `size` prop and `currentColor` inheritance; the llms doc even lists rename aliases (`LayoutDashboard`→`Dashboard`, `Rocket`→`Spaceship`).
- **Accessibility is baked in.** Skip-nav target (`#cascade-main`), required accessible names (`IconButton.label`), and motion-gated animation (`Status pulse`) are defaults, not opt-ins.
- **Router integration hook exists.** `setLinkComponent()` let me route every cascivo internal link (SideNav, ShellHeader brand) through TanStack Router's `<Link>` with a single one-line adapter.
- **It looked right immediately.** With the dark theme token set, the result read as a credible Vercel dashboard with essentially no custom CSS beyond layout scaffolding.

## What went badly (friction)

- **`useTheme()` docs contradict the actual API.** Getting-started shows `const { theme, setTheme } = useTheme()` (object). The real signature is a **tuple** `readonly [Signal<string>, (next: string) => void]`, and the first element is a Preact **Signal**, not a string. Code copied from the docs will neither compile nor behave correctly, and the signal leaks the internal reactivity model into consumer code. I sidestepped it entirely by driving `ThemeProvider` with a controlled `value` from React `useState`.
- **The documented theme-CSS import fails TypeScript.** The guide says `import '@cascivo/themes/all'`. Under `noUncheckedSideEffectImports` (which the TanStack scaffold enables by default), this is `error TS2882: Cannot find module or type declarations for side-effect import` — because the `./all` export maps to a `.css` file _without_ the `.css` extension, so TS won't treat it as a CSS module. The fix is the undocumented-in-the-quickstart `@cascivo/themes/all.css` variant.
- **Chart series share one `x`/`y` accessor across all series.** `AreaChart`/`LineChart`/`BarChart` take a single `x={fn}` / `y={fn}` applied to _every_ series. You cannot point series A at `row.requests` and series B at `row.errors` — my first attempt silently plotted the same field twice. You must pre-shape each series' `data` into a uniform `{x,y}` shape. This isn't called out in the chart docs and is easy to get wrong.
- **`DashboardLayout` (and other `layout/*`) are copy-paste-only, but their llms doc shows a package import.** `llms/layout/dashboard-layout.md` opens with `import { DashboardLayout } from '@cascivo/layout/dashboard-layout'` — but that package doesn't exist on npm; it's `npx cascivo add layout/dashboard-layout` only. The import line is misleading for anyone on the prebuilt track. I used `AppShell` (which _is_ in `@cascivo/react`) instead.
- **Spacing props are inconsistent.** `Flex` and `Grid` use `gap`; `Stack` uses `offset` (a number). Same concept, different prop name.
- **`Input` and `Field` both own a `label`.** Wrapping an `Input` in a `Field` (the natural form pattern) gives two label sources; you have to remember to drop `Input`'s own `label` to avoid duplicate labelling.
- **The integration seam is untyped.** `setLinkComponent`'s `LinkComponent`/`LinkComponentProps` types live in `@cascivo/core`, which is a transitive (not direct) dependency and doesn't resolve from app code, so the link adapter is effectively `any`. It works, but there's zero type safety on exactly the spot where a router integration is most error-prone.
- **Docs routing is uneven.** `cascivo.com/docs/components` returned 404 while researching; the machine-readable `llms/*` paths were the reliable source.

## Red flags and blockers

- **🔴 BLOCKER — runtime CSS imports break SSR on every route.** `@cascivo/react`'s compiled JS does runtime `import './spinner/spinner.css'` (the advertised "component CSS loads automatically per import" feature). TanStack Start externalizes `node_modules` for the SSR bundle, so Node's native ESM loader hits those `.css` imports and throws `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".css"` — **HTTP 500 on all five routes.** Critically, `build`, `typecheck`, and `lint` **all pass**; the failure surfaces only when a request is served. A fresh adopter following the quickstart with any SSR framework that externalizes deps gets a completely dead app and a cryptic Node error with no pointer back to cascivo. **Workaround:** `ssr: { noExternal: [/^@cascivo\//] }` in `vite.config.ts`. This needs to be either documented front-and-center for SSR users or fixed at the package level (don't ship runtime `.css` imports; provide an SSR-safe entry). This is the single biggest barrier to adoption.
- **🟠 Theme is not applied during SSR → FOUC.** `ThemeProvider` writes `data-theme` only via a client effect — even when driven by a controlled `value`. So the server response ships `<html>` with **no** theme attribute and the first paint is un-themed until hydration. The docs mention `themePreloadScript()` for the persisted/uncontrolled flow but don't note that controlled SSR still emits nothing. Worked around by hardcoding `data-theme="dark"` on `<html>` in the root document to match the initial state. A controlled `ThemeProvider` should render the attribute during SSR.

## Tooling / environment notes (not cascivo)

- `@tanstack/cli create` dropped a nested `pnpm-workspace.yaml` (with `allowBuilds`) inside the app directory. Inside an existing pnpm monorepo this makes pnpm treat the app as its own workspace root; it had to be deleted and `lightningcss` hoisted into the root `pnpm.onlyBuiltDependencies`. Framework-tooling friction, surfaced here only because the demo lives in a monorepo.

## One-line takeaway

cascivo's component breadth, type quality, and AI-first docs made building a polished dashboard fast and pleasant — but a fresh SSR adopter is dead on arrival until they discover the `ssr.noExternal` workaround, and two of the getting-started snippets (`useTheme`, `@cascivo/themes/all`) don't match reality. Fix the runtime-CSS/SSR story and reconcile the quickstart, and the on-ramp would be excellent.
