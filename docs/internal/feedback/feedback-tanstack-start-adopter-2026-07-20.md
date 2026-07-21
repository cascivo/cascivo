# Experience report — Vercel-like dashboard with TanStack (Start) + cascivo

**Date:** 2026-07-20
**Framework:** TanStack Start (`@tanstack/react-start` 1.168, TanStack Router 1.170, Vite 8, React 19.2)
**UI library:** cascivo — `@cascivo/react` 0.8.0, `@cascivo/charts` 0.3.13, `@cascivo/themes` 0.4.2, `@cascivo/tokens` 0.5.1
**Outcome:** ✅ Built. Dark, Vercel-style dashboard with an app shell, three routes (Overview / Deployments / Analytics), stat cards + sparklines, an area/line/bar chart set, and a searchable/sortable/paginated data table. Production build, typecheck, lint, and SSR runtime (screenshotted) all green — **after clearing three SSR blockers that a fresh adopter would hit before seeing a single pixel.**

This is a one-shot report: the findings below are the first honest attempt, warts and order-of-discovery included.

---

## What went well

1. **The component catalog is enormous and dashboard-complete.** `@cascivo/react` ships ~150 components. Everything a Vercel-style dashboard needs was in-box — `AppShell`, `ShellHeader`, `SideNav`, `Stat`, `DataTable`, `Status`, `Badge`, `Tabs`, `SegmentedControl`, `EmptyState`, `Button` — plus a full `@cascivo/charts` package (`AreaChart`, `LineChart`, `BarChart`, `Sparkline`). I never once reached for another library or hand-rolled a component.

2. **TypeScript types are the best part of the DX.** Every component exports a real `…Props` interface, so the shipped `dist/index.d.ts` doubled as the API reference (which was good, because it was more reliable than the website — see friction #9). `DataTable<Row>` and the chart generics infer cleanly from the data you pass; I described a table column set and the `render` callbacks were fully typed against my row type with zero annotations.

3. **`DataTable` is genuinely batteries-included.** `sortable`, `searchable`, `pagination`, `density`, `selection`, `batchActions`, `defaultSort`, per-column `render`/`align` — all declarative props. The screenshot of the Deployments page (search box, sort arrows, colored status dots, "1–5 of 6" pager) came from ~15 lines of config and rendered correctly under SSR.

4. **Charts render server-side as real SVG with an accessible `<table>` fallback.** No canvas, no client-only bailout. The dual-axis line chart (`secondAxis` + per-series `axis: 'right'`) and the gradient area chart worked on the first try, and the no-JS fallback table is a nice SEO/a11y touch that most chart libs skip.

5. **Cross-package composition is anticipated in the API.** `Stat` has an explicit `visual` slot whose JSDoc literally says "e.g. a `Sparkline` from `@cascivo/charts`." Dropping a charts component into a react-package component's prop just worked — the two packages are clearly designed to interoperate.

6. **Theming is pure CSS `data-theme` + token layers, and it looks polished for free.** One attribute on `<html>` themed the entire app; the dark theme (stat cards, chart colors, status indicators) looked production-quality with **zero** custom component styling from me. The only CSS I wrote was page padding and a grid.

7. **`AppShell` has thoughtful ergonomics.** Its type documents that it auto-binds the `ShellHeader` burger to the nav open/close state, so the mobile menu toggle works without wiring. Small thing, well done.

8. **Vite production build was clean on the first attempt** — both client and SSR environments, ~114 kB gzipped main chunk, built in well under a second. Typecheck passed with `strict` + `noUncheckedIndexedAccess`.

---

## What went badly (friction)

> The through-line: **cascivo builds and typechecks flawlessly, but getting it to render under SSR took three separate, undocumented fixes.** Each one produced a 500 or a hydration warning with an error message that doesn't point at the real cause.

### 🚩 1. SSR crashes out of the box: `ERR_UNKNOWN_FILE_EXTENSION` on `.css`
cascivo's component modules do side-effect CSS imports (`import './spinner.css'`). Under TanStack Start's dev SSR, `@cascivo/*` is externalized and loaded through Node's native ESM loader, which throws `ERR_UNKNOWN_FILE_EXTENSION: Unknown file extension ".css"` and returns a bare `500 HTTPError`. The build succeeds (Vite transforms the CSS), so this only bites at runtime.
**Fix a fresh adopter has to discover themselves:**
```ts
// vite.config.ts
ssr: { noExternal: [/^@cascivo\//] }
```
Nothing in the getting-started guide mentions this, and the error names a file deep in `node_modules`, not cascivo. Any SSR framework (Next, Remix, TanStack Start) will hit it. **This is the single biggest blocker for SSR adopters.**

### 🚩 2. The signals peer-dependency floor admits a React-19-incompatible version
`@cascivo/core` declares `@preact/signals-react >=2.0.0`. Resolve that floor to the 2.x line and SSR dies with:
```
SyntaxError: The requested module 'react' does not provide an export
named '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'
```
That React internal was **removed in React 19**; only `@preact/signals-react@^3` supports React 19. cascivo's own devDependencies pin React 19.2, so the library clearly targets React 19 — but the published peer range still lets you install a version that can't run on it. The docs' unpinned `pnpm add … @preact/signals-react` happens to grab 3.x and work, but **any pin to the documented floor is a trap.** The peer range should be `>=3` for React 19, or the constraint should be documented.

### 🚩 3. `themePreloadScript()` + SSR = hydration mismatch, and silently ignores your default theme
Using the recommended anti-flash `themePreloadScript()` produced a React hydration error:
```
data-theme="dark" (client) vs data-theme="light" (server) … won't be patched up
```
The preload script mutates `<html data-theme>` **before** hydration, which trips React's attribute check unless you add `suppressHydrationWarning` to the themed element — not shown in any docs example. Worse: `themePreloadScript({ defaultTheme: 'dark' })` is **overridden by the visitor's OS `prefers-color-scheme`**, so my "dark by default" dashboard rendered *light* for light-OS visitors (visible in my first screenshot). `defaultTheme` is really "fallback only when there's no OS preference and nothing persisted" — surprising, undocumented precedence. I ended up dropping the preload script and using a controlled `<ThemeProvider value="dark">` + `suppressHydrationWarning`.

### 4. Getting-started omits the component stylesheet entirely
The docs "basic usage" imports only `@cascivo/themes/all` and shows a styled `<Button>`. But I verified the shipped CSS: `@cascivo/themes` provides **only tokens** (`base.css` has 2 reset rules), while the actual component rules — 134 of them, hashed CSS-module classes like `._accordion_9ch4s_2` — live in **`@cascivo/react/styles.css`**. Import themes alone and every component is structurally unstyled. The full required set (`themes/all` + `@cascivo/react/styles.css` + `@cascivo/charts/styles.css`) is never stated together anywhere I could find.

### 5. `@cascivo/tokens` is a hidden required dependency
`@cascivo/themes/all` does `@import '@cascivo/tokens'`, but `@cascivo/tokens` is only a **peer** of themes and is **not** in the documented `pnpm add` line. It resolved for me only because pnpm's default `auto-install-peers` pulled it in. On npm, yarn-classic, or with that setting off, the CSS `@import` would fail to resolve. It should be a direct dependency of `@cascivo/themes` (or listed in the install command). I added it explicitly to be safe.

### 6. No first-class router-`Link` integration is exposed in the public types
For a design system that ships an `AppShell`/`SideNav`, wiring it to the router is central — but it's under-served. `setLinkComponent` is re-exported, yet its `LinkComponent` contract is defined in `@cascivo/core` and **isn't spelled out in `@cascivo/react`'s `.d.ts`**, so integrating TanStack Router's `<Link>` (which uses `to`, not `href`) means either spelunking core's types or bridging by hand. `SideNavItem.render` is offered as an escape hatch, but its `linkProps.onClick` is **required**, which fights routers that own their own click handling. I bridged navigation manually per item:
```ts
onClick: (e) => { e.preventDefault(); void navigate({ to }) }
```
Works, but loses middle-click/open-in-new-tab, and it's exactly the boilerplate `setLinkComponent` is supposed to remove.

### 7. Inconsistent change-handler naming across components
`Tabs` and `SegmentedControl` use `onValueChange`; inputs/`Slider` use `onChange`; `SideNavItem` uses `onClick`. I typed `onChange` on `SegmentedControl` out of habit and got a type error. Minor, but you lean on TS to correct muscle memory more than you'd expect.

### 8. `exports` map subpath mismatch in `@cascivo/react`
`package.json` maps `exports["."].import` → `./dist/react/src/index.js` but `types` → `./dist/index.d.ts` (different subtrees). It resolves under `moduleResolution: bundler`, but the non-parallel layout is the kind of thing `publint`/`arethetypeswrong` and stricter bundlers flag.

### 9. The website is thin; the `.d.ts` was the real documentation
The public docs pages returned only high-level excerpts — install snippets and a theme list, but not per-component prop tables. The fastest reliable way to learn any component's API was `npm pack` + reading `dist/index.d.ts`. Twelve themes are advertised, but I couldn't fetch per-theme or per-component reference docs. Great types partly compensate, but a fresh adopter without the tarball open is flying blind.

---

## Red flags / blockers summary

| # | Severity | Issue | Would it stop a real adopter? |
|---|----------|-------|-------------------------------|
| 1 | **Blocker** | `.css` side-effect imports crash SSR without `ssr.noExternal` | Yes — instant 500 on any SSR framework, cryptic error |
| 2 | **Blocker** | Peer floor `signals-react >=2` installs a React-19-incompatible build | Yes — SSR `SyntaxError` if you pin to the documented floor |
| 3 | High | `themePreloadScript` → hydration mismatch + ignores `defaultTheme` vs OS | Wrong theme in prod + console errors; confusing to debug |
| 4 | High | Docs omit `@cascivo/react/styles.css` → components render unstyled | Yes — "why is everything broken?" on first run |
| 5 | Medium | `@cascivo/tokens` required but not in the install command | Breaks on npm/yarn or without auto-install-peers |
| 6 | Medium | No documented router-`Link` integration in public types | Friction wiring the shipped nav/shell to any router |
| 7 | Low | Inconsistent `onValueChange` vs `onChange` vs `onClick` | Papercut, caught by TS |
| 8 | Low | `exports` types/import subpath mismatch | Papercut, tooling-dependent |
| 9 | Medium | Website lacks per-component API docs | Slows every adopter; mitigated by strong types |

**Net:** The components, types, charts, and theming are excellent and delivered a polished dashboard fast. But the **SSR story is where cascivo hurts** — three of the top-five findings are SSR/hydration blockers with unhelpful errors and no documentation, and two of those (`.css` externalization, the signals peer floor) will stop *every* SSR adopter before they render anything. For a "signal-driven, AI-first React design system," first-class, documented SSR support (and a single copy-pasteable "SSR setup" section covering `ssr.noExternal`, the signals-v3 requirement, the full CSS import set, and `suppressHydrationWarning`) would remove the entire cliff.

---

## Notes (not cascivo)
- `/favicon.ico` 404 — TanStack Start scaffolding, not cascivo.
- TanStack Start's production `dist/server/server.js` isn't a standalone HTTP listener without a server preset; I verified runtime via the dev SSR server + Playwright screenshots instead.
