# Experience report — Vercel-like dashboard with TanStack + cascivo

**Date:** 2026-07-23
**Framework:** TanStack Router (file-based) + TanStack Query, Vite 7, React 19
**UI library:** cascivo (prebuilt packages `@cascivo/react`, `@cascivo/charts`, `@cascivo/themes`)
**Task:** Build a Vercel-style dashboard (overview KPIs, projects table, deployments, analytics).

This documents the experience of adopting cascivo cold — no prior knowledge, learning
the API as a fresh adopter would. The dashboard builds, typechecks, lints, and renders
correctly in a browser across all four routes.

---

## Summary

cascivo delivered a genuinely production-looking dark dashboard with very little code:
`AppShell` + `ShellHeader` + `SideNav` gave the whole layout, `DataTable` gave a
searchable/sortable/paginated table for free, and `@cascivo/charts` produced polished
area/line/bar charts and gauges. The TypeScript declarations are excellent and were my
primary "documentation."

The single biggest problem: **the prebuilt path produces an unstyled, grayscale app and
nothing tells you why.** The semantic theme lives in a _separate, undocumented-at-the-
quickstart_ package (`@cascivo/themes`) that is not a dependency of `@cascivo/react`.
That cost a full debugging cycle and would badly confuse a real adopter.

---

## What went well

- **Prebuilt package "just works" with Vite + React 19.** `pnpm add @cascivo/react` +
  `@preact/signals-react` and the components rendered — no Tailwind, no PostCSS config,
  no build step, no babel plugin. The Preact-signals runtime worked from installing the
  peer dep alone; I never had to configure `@preact/signals-react/transform`.
- **The TypeScript declarations are the best part of the library.** Every prop has a
  JSDoc comment. The `setLinkComponent` doc _literally contains the TanStack Router
  recipe_ (`setLinkComponent(({ href, ...rest }) => <Link to={href} {...rest} />)`),
  which I copied verbatim and it worked first try. Router integration for SideNav /
  ShellHeader / Breadcrumb links is a first-class, documented concept.
- **`DataTable` is a huge time saver.** `searchable`, sortable columns, `pagination`,
  `density`, and per-column `render` are all built in. The Projects and Deployments
  tables were ~30 lines of column config each and came out looking like Vercel's.
- **Layout primitives are ergonomic.** `AppShell` wires the header burger to the nav
  open state automatically; `SideNav` takes a plain `items` array with `active` flags;
  `AutoGrid`/`Flex`/`Card`/`Stat`/`Status`/`Meter` composed cleanly.
- **CSS `@layer` architecture with a documented escape hatch.** The canonical layer
  order (`reset → base → tokens → component → theme → blocks → override`) is documented
  in the shipped stylesheet, and putting app-local rules in `@layer cascivo.override`
  let me add layout glue without specificity fights.
- **Design tokens are directly usable.** `var(--cascivo-color-accent)`,
  `--cascivo-space-6`, `--cascivo-radius-surface` etc. worked in my own CSS and as chart
  `color` props, so the demo stayed on-palette in both themes.
- **Accessibility is baked in.** Link prop bags carry `aria-current`/`data-state`,
  `IconButton` requires a `label`, and components ship `@media (forced-colors)` rules.

## What went badly (friction)

- **Semantic themes are a separate package with no cross-reference.** Getting a _styled_
  app requires THREE packages — `@cascivo/react` (components + token primitives),
  `@cascivo/charts` (all data-viz), and `@cascivo/themes` (the actual color values) —
  and none of them points you to the others at install time. I only found `@cascivo/
charts` and `@cascivo/themes` via `npm search cascivo`.
- **Charts require explicit pixel `width`/`height`; there is no intrinsic responsive
  sizing.** Dropping a chart into a responsive `Card` overflows or clips it — my
  BarChart card showed only 3 of 6 regions because `width={420}` exceeded the card. A
  `useChartSize` hook exists but isn't mentioned in any quickstart and needs manual
  wiring (measure container → pass width). For a _dashboard_ library this is surprising;
  responsive-by-default (or a `ResponsiveChart` wrapper) is what you reach for.
- **`AreaChart`'s `x` accessor must return a `number`** — no date or category x-axis
  (only `LineChart` accepts `Date`). I had to encode day-of-month as an integer, so the
  x-axis reads `10, 20, 30` instead of `Jul 10`. Splitting time-series capability across
  chart types is an easy trap.
- **`useTheme()` returns a Preact `Signal`, not a value.** `const [theme, setTheme] =
useTheme()` gives `[Signal<string>, setter]`. Reading `theme.value` inside a React
  component's render does **not** subscribe without the signals-react transform, so a
  theme-toggle icon won't re-render. I worked around it by mirroring the choice in local
  `useState` and calling the cascivo setter for its side effect. A plain
  `[string, setter]` tuple would be far more idiomatic for a React-first API.
- **`gap` (and similar) props are numeric unions, not strings.** `gap="4"` fails
  typecheck — it must be `gap={4}` (`SpaceStep = 1|2|3|4|5|6|8|10|12`). Reasonable once
  you know, but the error message names the _aliased_ type (`SpaceStep$3`), which is
  cryptic.
- **Aliased type names leak into errors.** The bundled `.d.ts` renames collisions
  (`SpaceStep$3`, `SpaceStep$4`, `Tag$1 as Tag`). These `$N` suffixes show up in
  compiler errors and make them harder to read than the public names.
- **`Sparkline` appears in a JSDoc comment but is NOT exported from `@cascivo/react`.**
  `Stat.visual`'s doc says "e.g. a `Sparkline` from `@cascivo/charts`", but the react
  package's export list has no `Sparkline` — it's in `@cascivo/charts`. A grep for the
  name inside `@cascivo/react` gives a false positive from the comment. Mildly
  misleading when you're hunting for the component.
- **No hosted API reference I could read.** `npmjs.com/package/@cascivo/react` returned
  HTTP 403 to a fetch, and cascivo.com's docs weren't crawlable page-by-page. I learned
  the entire API by `npm pack`-ing the tarballs and reading `dist/index.d.ts`. The
  declarations are great, but a browsable component reference (props + examples) would
  shorten first-adoption a lot.
- **No icon set ships.** Every `SideNav` item, `IconButton`, and `Button` icon needs a
  consumer-supplied `ReactNode`. Expected, but it means a fresh dashboard needs an icon
  dependency or hand-rolled SVGs (I hand-rolled a handful) before it looks complete.

## Red flags / blockers

- **RED FLAG (closest to a blocker): the prebuilt quickstart silently renders an
  unstyled app.** Following the obvious path — `pnpm add @cascivo/react`, `import
'@cascivo/react/styles.css'`, wrap in `<ThemeProvider defaultTheme="dark">` — produces
  a fully-functional but **grayscale, borderless, colorless** UI. Cause: `@cascivo/
react/styles.css` ships the `cascivo.component` and token layers but **no
  `@layer cascivo.theme`** and **no `--cascivo-color-*` values**. `ThemeProvider`
  happily sets `data-theme="dark"` on `<html>`, but no stylesheet defines what "dark"
  means, so every color token falls back to a bare default. **Nothing errors or warns.**
  A first-time adopter sees "the components render but everything is black/gray" and has
  no signal pointing at the missing `@cascivo/themes` import. The fix in this demo was to
  add `@cascivo/themes` and `import '@cascivo/themes/base'` + `'/dark'` + `'/light'`.

  Suggested upstream fixes (any one would help): make `@cascivo/themes` a dependency of
  `@cascivo/react` and re-export a default theme from `styles.css`; **or** have
  `ThemeProvider` emit a dev-mode console warning when it sets a `data-theme` for which
  no `--cascivo-color-*` custom property resolves; **or** put the required
  `@cascivo/themes` import in the very first line of the prebuilt quickstart.

## Notes on the build

- Stack pinned for a stable one-shot: Vite `^7.3.6` + `@vitejs/plugin-react` `^5.2.0`
  (latest are Vite 8 / plugin-react 6 / TypeScript 7, intentionally avoided to keep the
  focus on cascivo rather than bleeding-edge tooling churn).
- `@tanstack/router-plugin` generates `src/routeTree.gen.ts`; since it's generated +
  gitignored, `typecheck`/`build` run `tsr generate` (from `@tanstack/router-cli`) first
  so `tsc` has the file.
- Verified in Chromium (Playwright) across all four routes: no runtime/page errors, the
  signals runtime works, theme + charts + table all render.
