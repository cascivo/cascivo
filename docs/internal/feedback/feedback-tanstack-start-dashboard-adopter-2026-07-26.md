# Experience report — Vercel-like dashboard with TanStack Start + cascivo

**Date:** 2026-07-26
**Stack:** TanStack Start 1.168 / TanStack Router 1.170 / TanStack Query 5.101 / Vite 8 / React 19 / TypeScript 6
**cascivo:** `@cascivo/react` 0.12.0, `@cascivo/themes` 0.4.7, `@cascivo/charts` 0.6.0, `@cascivo/icons` 0.3.5 (prebuilt path, "Path B")
**Scope built:** console shell (header + side nav + ⌘K palette + theme toggle), overview, projects grid, project detail (tabs), deployments table, analytics, runtime logs, domains, settings — 8 routes, all server-rendered.

**Outcome:** the app builds, typechecks, lints and formats clean, all 8 routes SSR at HTTP 200, and the browser console is free of hydration warnings and page errors. Time to a credible-looking dark Vercel-style console was short. Every finding below was hit during that one build.

---

## What went well

### The docs are the best part of this library

- `https://cascivo.com/docs/getting-started.md` is fetchable **as markdown**. No JS-rendered docs site to fight, no scraping. This alone saved several rounds.
- The docs anticipated my exact stack. `USING-WITH-VITE-SSR.md` has a **TanStack Start section by name**, with the correct answer ("0.10+ needs zero Vite config") _and_ the historical footgun it replaced (`ssr.noExternal`, `Unknown file extension ".css"`). I never hit that error because the doc told me why I wouldn't.
- That same page warns about two **TanStack Start** potholes that aren't cascivo's fault at all (`getRouter` export name, `vite build` emitting a handler not a server). Being told about the framework's sharp edges by the _design system's_ docs is unusual and genuinely useful.
- `RECIPE-DASHBOARD.md` is a need → component → registry-id → channel table. "Data table of deployments" → `DataTable`, and it pre-warns that identifier columns need an explicit `width`. I built the deployments table straight off that table.
- `AI-RULES.md` states the reactivity contract explicitly ("`useSignal`, never `useState`"; "`useSignalEffect`, never `useEffect`"; "`useSignals()` only for signals you didn't get from a cascivo hook"). Without it I would have reached for `useState` and concluded the system had no state story. Rule 9 in particular — _don't_ sprinkle `useSignals()` — is the kind of thing normally learned by debugging a UI that silently doesn't move.
- `npx @cascivo/docs` ships the whole reference through npm. A real answer to "the docs site is down / blocked".

### The shipped `.d.ts` is documentation-grade

`@cascivo/react/dist/index.d.ts` is a flat 3.5k-line rollup where every `…Props` interface is real and carries prose comments. I built most of this app by reading it rather than the website — faster and guaranteed to match the installed version. `CardHeader.actions` even documents _why_ it exists ("`justify-content: space-between` alone does nothing"). More libraries should do this.

### SSR genuinely needed no configuration

Install, add three `@import`s, render. The server HTML contained the fully-styled shell, nav, command palette and charts on the first try. No `<ClientOnly>` wrappers, no `noExternal`, no dynamic-import dance. For a signals-based library under React 19 SSR this is better than I expected.

### `setLinkComponent` is the right shape for router integration

```tsx
setLinkComponent(({ href, ...rest }: LinkComponentProps) => (
  <Link to={href} {...rest} />
))
```

One call, and `SideNav`, `ShellHeader` and `Breadcrumb` all became client-side-navigating TanStack links with `aria-current` and active `data-state` preserved. This is a much better contract than per-item `render` hatches or `onClick` interception. (Its blind spot is the big finding below.)

### Batteries that were actually charged

- `AppShell` + `ShellHeader` + `SideNav` produced the whole console chrome — sticky header, full-height nav, single scroll container, animated collapse, mobile drawer + scrim, skip-to-content link, `inert` on the hidden nav — from config objects. No layout CSS written.
- `CommandMenu` gave a working ⌘K palette with fuzzy search, roving keyboard nav and a native-`<dialog>` focus trap from one `groups` array.
- `LogViewer` was a standout: virtualized, level-colored, with a filter box, follow/pause toggle, copy button and line count, all free. This would have been a day of work.
- `DataTable` search + multi-column sort + pagination + page-size selector, wired from props.
- `RelativeTime`'s `now` prop exists precisely for SSR determinism, and the recipe doc tells you to use it. Somebody had already been bitten by this and fixed it upstream.
- `useTheme()` returning a plain `[string, setter]` tuple (not a signal you must `.value`) is the right call, and the doc pre-empts the `{ theme, setTheme }` mistake by name.
- `themePreloadScript()` + `suppressHydrationWarning` gave flash-free dark-by-default theming under SSR, first try.
- `cascivo doctor --ci` passed cleanly and checks real things (e.g. a `@preact/signals-react` 2.x pin under React 19).
- Icon names are non-obvious (`Rocket` → `Spaceship`, `LayoutDashboard` → `Dashboard`) but `icons.catalog.json` plus the docs' explicit mapping table meant zero wrong guesses.

---

## What went badly

### 1. `Flex` defaults to a **column** — [high friction]

```ts
function Flex({ direction = 'vertical', ... })
```

CSS `flex-direction` defaults to `row`. A component named `Flex` defaulting to a column inverts the platform default. Neither the `FlexProps` interface nor `AI-RULES.md` ("`Flex` — the gap-based flex container (`direction`, `gap`, `align`, `justify`, `wrap`)") states the default, so the only way to learn it is to render a row of badges and see them stacked. I hit this three separate times in one build (badge row, button pair, page actions) before I read the shipped bundle to confirm.

Either flip the default to `horizontal`, or document the default loudly in the prop docs.

### 2. There is no supported way to style a router link — [red flag]

The exported `Link` renders a **literal `<a>`**:

```js
function Link({ variant, size, external, className, children, ...c }) {
  return jsx('a', { 'data-variant': variant, ..., ...c })
}
```

It ignores `setLinkComponent`, and `LinkProps` has **no `asChild`** (unlike `Button` and `IconButton`, which both have it). So for any router-based app there are exactly three options for a link in page content — a project name in a card title, a branch name in a table cell:

1. cascivo `Link href="/x"` → correct styling, but a **full page reload** on click. Unacceptable in an SPA.
2. Router `<Link>` → client-side navigation, but **raw browser anchor styling** (measured: `color: rgb(158,158,255)`, `text-decoration: underline`) — visibly wrong against the theme.
3. Re-implement cascivo's link CSS from tokens in your own layer.

I took option 3 ([`src/components/router-link.tsx`](src/components/router-link.tsx) + `.app-link` in `src/styles.css`), duplicating `--cascivo-link-color`, `--cascivo-color-accent-hover`, `text-underline-offset` and the focus ring by hand. That duplication will drift from upstream, and every adopter using any router will write it independently.

`setLinkComponent` covering only the config-driven nav components — while the one component whose entire job is "a link" is excluded — is the sharpest inconsistency I found. **Adding `asChild` to `Link` would close this completely.**

### 3. `Button asChild` on an anchor keeps the UA underline — [bug]

```tsx
<Button asChild>
  <Link to="/projects">New Project</Link>
</Button>
```

The anchor correctly receives `data-variant="primary"` and the button class, and background/color resolve right. But the label renders **underlined**: nothing in the button CSS sets `text-decoration`, so the browser's `a[href]` default survives. Measured side by side:

|                 | background         | color              | text-decoration |
| --------------- | ------------------ | ------------------ | --------------- |
| real `<button>` | `oklch(0.922 0 0)` | `oklch(0.205 0 0)` | `none`          |
| `asChild` `<a>` | `oklch(0.922 0 0)` | `oklch(0.205 0 0)` | **`underline`** |

Since `asChild` exists specifically so the styling can land on a real `<a>`, this is a one-line fix upstream (`text-decoration: none` in the button rule). I worked around it with an `.as-button` class in my app layer.

Careful when patching this locally: my first attempt used `color: inherit` alongside, which — because the app layer outranks `cascivo.component` — overrode the button's own `color` and produced near-white text on a near-white background. The layer system does exactly what it says; that makes app-layer overrides easy to over-apply.

### 4. `DataTable` starves any column without an explicit `width` — [high friction]

`RECIPE-DASHBOARD.md` correctly advises setting `Column.width` on identifier-shaped columns so a commit hash doesn't wrap mid-hash. Following that advice on 6 of 7 columns collapsed the **one remaining free-form column** (the commit message) to roughly 50px, wrapping the text one character per line and blowing every row up to ~120px tall.

So `width` is not "fix this track, let the rest flex" — it's closer to all-or-nothing. The workaround is to give _every_ column a width and scroll the table horizontally, which is what I did. Either document that `width` is all-or-nothing, or make unsized columns absorb the remaining space (`minmax(0, 1fr)`).

### 5. `cascivo audit --ai` fails a correct app with 6 false positives — [red flag]

The docs recommend `"lint": "cascivo doctor --ci && cascivo audit --ai src"` as a CI gate. On this app — which typechecks cleanly against cascivo's own `.d.ts`, passes `doctor`, and renders correctly — the audit **exits 1**:

```
src/components/shell.tsx:92    error  unknown-prop     <AppShell nav>
src/components/shell.tsx:92    error  missing-prop     <AppShell> requires "children"
src/components/shell.tsx:114   error  missing-prop     <SideNav> requires "items"
src/routes/index.tsx:60        error  unknown-prop     <Link to>
src/routes/settings.tsx:62     error  missing-prop     <Field> requires "children"
src/routes/settings.tsx:68     error  missing-prop     <Field> requires "children"
```

Every one is wrong:

- `AppShell.nav` **is** a documented prop (`AppShellProps.nav?: ReactNode`).
- `AppShell` and `Field` **do** have children — the checker appears not to see JSX children when they arrive as an expression (`{children}`) or as a component element.
- `SideNav.items` is **optional** (`items?: SideNavItem[]`); I pass `groups`, which is the documented alternative. The audit's manifest disagrees with the shipped types.
- `<Link to>` is **TanStack Router's** `Link`, not cascivo's. The audit matches on the bare component name, so any third-party component sharing a name with a cascivo one gets audited against the wrong contract. For router-based apps `Link` is close to guaranteed collateral.

Taking the recommended CI wiring would have made this repo red on day one. Suppressing with `/* cascivo-audit: allow */` would mean annotating correct code. I left the audit out of the lint script.

Related, lower severity: the audit flags `width: '3rem'` on a `DataTable` column as `hardcoded-value` and suggests `--cascivo-space-12` / `--cascivo-control-height-lg`. A spacing token is not the right unit for a table column width; this reads as pattern-matching on the literal rather than on the context.

### 6. Charts require hardcoded pixel dimensions — [medium friction]

`AreaChart`, `BarChart`, `LineChart` and `Sparkline` all take numeric `width`/`height` and have no fluid/container-query mode. In a responsive dashboard grid there is no correct number, so every chart in this app carries an invented literal (`width={720}`, `width={420}`, `width={900}`, `width={440}`) wrapped in a `.chart-scroll` overflow container so a too-wide chart scrolls its card instead of the page body.

`useChartSize` is exported from `@cascivo/charts` and looks like the intended answer, but it appears in no doc I read — not `RECIPE-DASHBOARD.md`, not the getting-started guide, not the chart prop docs. For a package sold on dashboards, "how do I make a chart fill its card" should be answered on the recipe page.

### 7. `AreaChart` clips its right-hand axis

With a second series on `axis: 'right'`, the right axis tick labels render **on top of the plot and clipped at the chart's right edge** — the layout reserves no margin for a right axis. Visible on the analytics page.

### 8. `Stat` and `Kpi` are visually incompatible siblings

The recipe presents `Stat` (`@cascivo/react`) and `Kpi` (`@cascivo/charts`) as two takes on the same tile, and documents the API difference (`Stat` takes a pre-formatted `delta` string, `Kpi` takes a number and owns formatting). What it does not say is that **`Kpi` ships card chrome and `Stat` ships none**. Put a `Stat` row and a `Kpi` row on adjacent pages of one dashboard and they look like different products. I had to wrap every `Stat` in a `<Card>` to match. Worth one sentence in the recipe.

### 9. Cross-package name collisions

`@cascivo/charts` exports `Text`, `Calendar`, `Row` and `Glyph`; `@cascivo/react` exports `Text` and `Calendar`; `@cascivo/icons` exports `Glyph` and `BarChart` — which collides with `@cascivo/charts`'s `BarChart`. Any dashboard file importing from two of these needs aliasing. Nothing breaks loudly, but `Text` silently resolving to the SVG-chart primitive instead of the typography component is a bad afternoon waiting to happen. Prefixing or namespacing the chart internals would help.

### 10. Smaller papercuts

- **`data-theme` scoping is undocumented at the point of use.** Getting-started shows `<main data-theme="light">`, but with `ThemeProvider` the attribute goes on `<html>`. Both are right; which applies when is only clear after reading `THEMING.md`.
- **No link-color token in the public catalog.** `tokens.catalog.json` (263 tokens) has no `--cascivo-link-color`, yet `Link`'s CSS reads `var(--cascivo-link-color, var(--cascivo-color-accent))`. I only found the name by grepping the shipped stylesheet — needed for finding #2's workaround.
- **`Input` overflows its grid cell** inside `<Grid cols={{base:1, md:2}}>`; the field's right edge crosses into the next column. Presumably an intrinsic min-width that doesn't yield to the track.
- **`IconButton`/`Sparkline` take `label` for an invisible name** while everything else uses `ariaLabel`. The docs are honest about this being historical and accept both aliases — good handling — but it is still a thing to remember.
- **`OverflowMenu` uses `value`, not `id`**, for item identity. Predictable only after reading the "accessible-name and item-identity props" table; the docs cite this exact confusion as a real adopter report.

---

## Red flags and blockers

**Blockers:** none. Nothing stopped the build.

**Red flags for a real adopter:**

1. **Router links have no supported styling path** (finding #2). Any app with a router — which is any dashboard — will hand-roll link CSS from tokens and carry that drift forever. This is the one finding I would fix first, and `asChild` on `Link` fixes it.
2. **The recommended CI gate fails correct code** (finding #5). A team following the documented `lint` script gets a red build on their first commit, with errors that contradict the library's own type definitions. Trust in the tool goes to zero after that, and `doctor` — which is genuinely useful — gets thrown out with it.
3. **`Flex` defaulting to a column** (finding #1) is small but corrosive: it is hit early, hit repeatedly, and each time costs a render-inspect-fix cycle before the cause is even suspected.
4. **The charts package has no responsive story in the docs** (finding #6). Dashboards are the stated use case and every chart in this app has an invented pixel width in its props. `useChartSize` may well be the answer; it needs to appear in the recipe.

## Summary

The core of the system is strong: SSR worked with no configuration, the component surface is unusually complete (`LogViewer`, `CommandMenu`, `AppShell`, `DataTable` all did real work), the docs are the best I have used from a component library, and the `.d.ts` is good enough to build from offline. The friction is concentrated at the **edges where cascivo meets a router** (`Link` styling, `asChild` underline, the audit's name collision) and in the **charts package's layout story**. Both are addressable without touching the core, and the router-link gap in particular is a small API addition away from resolved.
