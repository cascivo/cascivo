# Experience report — Vercel-like dashboard on Vite + React Router

**Date:** 2026-07-26
**Stack:** Vite 8.1.5, React 19.2.8, React Router 8.3.0 (data router, CSR only), TypeScript, pnpm workspace
**cascivo:** `@cascivo/react` 0.12.0, `@cascivo/charts` 0.6.0, `@cascivo/icons` 0.3.5, `@cascivo/themes` 0.4.7
**Path taken:** B — prebuilt npm packages, no copied source
**Result:** six routes, all rendering, `tsc --noEmit` clean, `eslint` clean, `vite build` clean. Zero library workarounds were needed to _ship_; two chart components had to be swapped out for readability.

This is a first-contact report: I started from zero knowledge of cascivo and read only its own published docs.

---

## Headline

This went unusually well. From `pnpm add` to a six-route dashboard, cascivo produced **exactly three TypeScript errors across ~1,100 lines of app code**, and all three were my fault for guessing a prop instead of reading the type. Nothing was blocked. Nothing needed a workaround to function.

The friction that remains is concentrated almost entirely in **`@cascivo/charts`** — and specifically in the two chart types that are _supposed_ to be the dashboard workhorses.

---

## What went well

### 1. The offline docs package is the single best thing here

`npx @cascivo/docs` shipping the entire documentation surface as an npm tarball is the right call, and it worked first try:

```sh
npm pack @cascivo/docs   # → package/content/{llms.txt,llms/*.md,guides/*.md,*.catalog.json}
```

428 files, 4.9 MB, greppable. I never needed to load `cascivo.com` at all. `llms.txt` is genuinely written for an agent: it front-loads install steps, names the traps, and tells you where the machine-readable indexes are. The self-aware framing ("cascivo has no training-data footprint yet") is exactly the right reason for this to exist.

**This should be advertised harder.** It is buried under "Start here" in `llms.txt` but it is the thing that makes the library usable by an agent with no web access.

### 2. `guides/recipe-dashboard.md` mapped my whole task to components before I wrote a line

A guide that says "you're building Vercel's project dashboard, here is the component for each part" is worth more than a hundred prop tables. The need → component → registry id → **channel** table meant I knew up front that:

- charts are a separate install (`@cascivo/charts`),
- `layout/page-header` has no npm export and must be composed or copied,
- `AutoGrid min="16rem"` is the answer for a card grid.

The `channel` column (with a note saying it is CI-checked against `registry.json`) is a small, high-trust detail. I trusted it and it was correct every time.

### 3. Documented traps were real traps, and the warnings saved me

Every "⚠" in the docs earned its place:

- `Flex direction` defaults to **`vertical`**, unlike CSS/Chakra/MUI. Called out in `llms.txt`, in the component index naming note, _and_ in the prop table. I would have shipped broken rows without it.
- `Stack` overlaps children (card pile), it is **not** a vertical spacer. Documented in the index.
- `CardHeader` is a column, so `justify-content: space-between` does nothing — use `CardHeader actions={…}`. This is exactly the mistake I was about to make.
- `useTheme()` returns a **tuple** `[theme, setTheme]`, not next-themes' `{ theme, setTheme }`. Documented three separate times. Worked immediately.
- The `--cascivo-space-*` scale skips steps 7/9/11, so `gap` is a closed union `1|2|3|4|5|6|8|10|12`. The type enforces it; no guessing.
- TS needs `vite-env.d.ts` for the bare CSS side-effect imports, or `tsc` fails with TS2307/TS2882. I had `noUncheckedSideEffectImports: true` on and hit exactly zero problems because the doc told me first.

### 4. `setLinkComponent` + React Router took one line and behaved perfectly

```tsx
setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href ?? '.'} {...rest} />)
```

That's it. `SideNav`, `ShellHeader`, `Breadcrumb` and `Switcher` all became client-side navigations, `aria-current="page"` and active styling carried over, and middle-click/open-in-new-tab still work because the props bag is spread onto a real `<a>`. `LinkComponentProps` is documented as the contract type _and_ re-exported from `@cascivo/react`, so prebuilt users don't have to add `@cascivo/core` — the doc claim matched reality.

This is the integration most design systems get wrong. cascivo gets it right.

### 5. Icon names were guessable, and the catalog exists for when they aren't

I guessed 44 icon names from Lucide muscle memory and **40 hit**. `llms.txt` pre-empts the misses with a mapping table (`LayoutDashboard→Dashboard`, `Trash2→Trash`, `Bolt→Zap`). Misses in my run: `CircleCheck`, `Play`, `Refresh` (it's `RefreshCw`), `Alert`/`Warning` (it's `AlertTriangle`). Every icon takes `size`, renders `currentColor`, and tree-shakes.

### 6. Behavior-complete overlays, as advertised

`CommandMenu` with `hotkey` gave me a working ⌘K palette — fuzzy search, grouped items, arrow-key navigation, `↑ ↓ navigate / ↵ open / esc close` footer hints, focus trap, scrim, outside-click dismissal — from a `groups` array and an `open`/`onOpenChange` pair. Same story for `Dropdown`, `OverflowMenu`, `Tabs`. I wrote no `addEventListener('mousedown')`, no arrow-key `switch`, no ARIA by hand. The docs' "don't hand-roll the behavior layer" claim holds.

### 7. `DataTable` is the real thing

`columns` + `rows` + `getRowId` and I had sort, search, pagination with page-size options, sticky header, compact density, and per-cell `render` escape hatches. The recipe's advice to set `Column.width` on identifier-shaped columns was correct — the commit-hash column wraps mid-hash without it.

### 8. Signals are genuinely opt-out

The docs promise "consuming components requires no signals," and that held completely. `useState` everywhere in my app code, plain props into cascivo, zero `useSignals()` calls, no "state fights the DOM" bugs. Under React 19 + StrictMode, no double-render artifacts and no signals-runtime warnings.

### 9. CSS is layered, tree-shaken, and honest about its cost

The layer contract (`@layer vendor, cascivo.reset, … cascivo.blocks, <your slot>, cascivo.override`) is documented precisely enough to follow mechanically. I declared one app slot (`cascivo.deploys`), put ~25 lines in it, and never fought specificity once — not even when overriding shell sizing tokens.

Per-component CSS auto-inclusion works: **137 KB / 19 KB gzip** shipped for ~45 components, against the 273 KB / 37 KB documented for the aggregate `styles.css`. Half the sheet, correctly dropped.

### 10. Zero build configuration

`vite.config.ts` is five lines (`plugins: [react()]`). No `optimizeDeps`, no `ssr.noExternal`, no plugin, no transpile allowlist. Dev server cold start 328 ms, production build 580 ms.

---

## What went badly

### 1. `ComboChart` is the dual-axis component and it does not work at dashboard scale — **the worst finding in this run**

`recipe-dashboard.md` sends you to `ComboChart` for "two related metrics with different scales (e.g. volume bars + rate line)". That is precisely "requests + bandwidth" on an analytics page. I used it with 30 days of data and got:

- **Left-axis labels clipped to garbage.** `60,000` rendered as `),000`. The chart uses the default margin object and only widens `right` when `secondAxis` is set.
- **X-axis labels overlapping into a solid smear** — `Jun 27Jun 28Jun 29Jun 30Jul 1…`.
- **Right-axis labels clipped** at the SVG edge (`120` → `12⌐`).

The library _already ships the fixes for both problems_, as exported helpers with docstrings describing exactly these failures:

- `leftMarginForLabels(labels, plain)` — _"Left margin sized to the widest left-axis label so wide ticks (e.g. `40,000`) aren't clipped past the SVG's `0` origin. The default 36px only fits ~4 glyphs."_
- `autoLabelStride(labels, axisLength)` — _"Stride for a crowded categorical (band) axis: render every Nth label so they stop colliding."_

`AreaChart`, `BarChart` and `LineChart` call them. `ComboChart` calls **neither** — I confirmed this in `dist/index.js`: its margins are `{...DEFAULT_MARGINS, right: secondAxis ? 60 : DEFAULT_MARGINS.right}` and it renders the band axis with no `labelEvery`. This is a two-line fix in one file.

I had to abandon dual axes and split the metrics across two charts.

### 2. `ComboChart`'s API is inconsistent with every other chart, and its a11y fallback is incomplete

Every other chart is accessor-driven and uniform: `series: [{id, label, data}]` + `x`/`y` accessors. `ComboChart` is positional and untyped-by-domain:

```tsx
bars={[{ label: 'Jun 27', value: 42000 }]}   // categorical
line={[{ x: 0, y: 84.2 }]}                    // numeric index — must be aligned by hand
```

- No accessors, so you reshape your rows twice for one chart.
- The two collections are correlated **by array index**, with no compile-time or runtime check that they align. Silent wrong output if they don't.
- No `legend` prop, so a two-metric chart ships with nothing naming the two metrics.
- The screen-reader fallback `<table>` has only `Label` and `Bar value` columns — **the line series is absent from the accessible representation entirely.** That is a WCAG problem in a package that advertises 2.2-AA.

### 3. Two area series on different scales are unreadable, and the legend lies about it

My first Overview chart was requests (~50,000) + errors (~300) as two `AreaChart` series. The errors series is invisible, which is expected. What is not expected: **the second series' area fill is opaque enough to completely hide the first**, and the legend still shows both swatches in colors that appear nowhere in the plot. I had a chart whose legend said orange "Requests" and blue "Errors" over a plot that was solid grey with a blue outline.

`AreaChart` supports `axis: 'right'` + `secondAxis`, so this configuration is legitimate and reachable — it just renders wrong. Either the fill opacity needs to drop when series count > 1, or the docs need to say "two areas on a shared plot must share a scale; use `LineChart` for the second metric."

### 4. The final x-axis label is clipped on every time-axis chart

`AreaChart` and `LineChart` with a `Date` x-axis clip the last tick at the right edge: `7/26/2026` renders as `7/26/202`, and in a narrower card as `7/26/20.`. `leftMarginForLabels` has a sibling for the left side but nothing reserves right margin for the final label's overhang. Visible in three separate charts in this app.

### 5. `autoLabelStride` collides with the always-drawn final label

Separate from the `ComboChart` bug. On `BarChart` with 30 categories and **no** `xLabelEvery` — i.e. letting auto-stride do its job — the strided labels land on indices 0, 4, 8 … 28, and the final label at index 29 is drawn unconditionally, producing `Jul 21 JulJ2526` at the right edge. The stride is computed without accounting for the forced last tick.

Worth noting the trap I fell into first: I passed `xLabelEvery={Math.ceil(n / 8)}` thinking I was _helping_. An explicit stride overrides auto-stride (documented), so I made it worse. `xLabelEvery`'s doc should say "omit this — it is auto-computed; pass it only to override."

### 6. Same concept, three different state vocabularies

Three components model "step/event progress" and none of them agree:

| Component  | Prop     | Values                                                     |
| ---------- | -------- | ---------------------------------------------------------- |
| `Timeline` | `status` | `'complete' \| 'current' \| 'upcoming'`                    |
| `Steps`    | `state`  | `'pending' \| 'active' \| 'complete' \| 'error'`           |
| `Status`   | `status` | `'success' \| 'warning' \| 'error' \| 'info' \| 'neutral'` |

I used `Timeline` on Overview and `Steps` on the deployment page. Writing `state: 'upcoming'` for `Steps` was one of my three type errors, and I left a comment in the code because the next reader will hit it too. `current`/`active` and `upcoming`/`pending` are the same idea under two names. Pick one and alias the other.

### 7. Status-tone vocabulary is inconsistent across the display components too

Mapping one domain enum onto cascivo required three separate lookup tables:

- `Badge variant`: `default | secondary | success | warning | destructive | outline`
- `Status status`: `success | warning | error | info | neutral`
- `Notification variant`: `info | success | warning | error`
- `Tag variant`: `default | info | success | warning | error`

`destructive` vs `error`; `Badge` has no `info`, `Status` has no `destructive`, `Notification` has no `neutral`. A shared `Tone` type with per-component subsets would remove a whole class of guess-and-compile.

### 8. The docs' own example uses a prop that does not exist

`llms/data-table.md`, the "Custom cell content" example — the one an adopter is most likely to copy:

```tsx
render: (row) => <Badge tone={row.status === 'ready' ? 'success' : 'warning'}>{row.status}</Badge>
```

`Badge` has no `tone` prop. It's `variant`. Two files apart in the same generated docs set. Since these docs are generated, this example is presumably not type-checked — worth adding to the same CI that checks the recipe's `channel` column.

### 9. `AppShell` has no `className`, so its own sizing tokens are awkward to set

`AppShell` documents `--cascivo-shell-aside-inline-size` and `--cascivo-shell-panel-inline-size` as its design tokens, but the component accepts no `className` or `style` (props are `header`/`nav`/`children`/`footer`/`open`/`defaultOpen`/`onOpenChange`). To narrow the sidebar from 18 rem to a Vercel-like 15.5 rem I had to set the custom properties on `#root` and rely on inheritance. It works, but it means the documented tokens have no documented application point. Every other layout primitive extends `HTMLAttributes`; `AppShell` is the odd one out.

### 10. `layout/page-header` is copy-paste-only, and it's the one layout piece every page needs

Six routes, six page headers. `layout/page-header` (title + description + breadcrumb + actions slots) exists in the registry but has **no npm export**, so a prebuilt-path adopter either runs `npx cascivo add layout/page-header` — mixing consumption paths and pulling in `cascivo.config.ts` for one component — or hand-composes it. I hand-composed it in 30 lines of `Heading`/`Text`/`Flex`.

Same applies to `layout/section`, `layout/dashboard-layout`, `layout/settings-layout`, `layout/split-view`, `skip-nav` and `toast`. Notably `Toast` itself is copy-paste-only but `ToastProvider` + `useToast` + `ToastOptions` **are** exported from `@cascivo/react` and work fine — so the registry's channel metadata and the actual package exports disagree for that entry.

### 11. `Card padding="none"` breaks its own subcomponents

I used `<Card padding="none">` to let a `LogViewer` sit flush. The result put `CardHeader`'s title flush against the card edge and let the log body overflow past the card's border radius. `padding="none"` appears to mean "no padding anywhere", which makes it unusable with `CardHeader`/`CardContent` — the composition it exists to hold. I reverted to the default.

### 12. `Sparkline` has a fixed default width that fights flex layouts

`Sparkline` defaults to 120 × 32 px with no intrinsic shrink. Inside a `Flex justify="between"` in a 19 rem card it refuses to compress, so the adjacent label wraps to three lines (`81.3K` / `requests /` / `24h`). I shortened my label. A `min-inline-size: 0` / percentage-width mode would make it composable; every other cascivo layout piece shrinks correctly.

### 13. Small things

- **`AppShell` is `100dvh` with an internal scroll container.** Correct for an app shell, but it means Playwright `fullPage: true` screenshots capture only the viewport. Not a bug — but worth a line in the `app-shell` docs for anyone doing visual regression.
- **`PieChart` has no `tooltip` prop** while `AreaChart`/`BarChart`/`LineChart`/`ComboChart` all do. It has `tooltipFormat`, so tooltips clearly exist. One of my three type errors.
- **`Toggle`'s `onChange` receives a `boolean`, not a `ChangeEvent`** — unlike `Checkbox`/`NativeSelect`. `llms.txt`'s event-naming rule ("a raw DOM `ChangeEvent` → `onChange(event)`") lists Checkbox/NativeSelect/PasswordInput but not Toggle, and `Toggle` `Omit`s `onChange` from its button attrs to redefine it. `onValueChange` is the right prop and is what the deprecation notice says to use — but a component that keeps a same-named prop with an incompatible signature is a sharp edge. My third type error.
- **`StructuredList` takes `items`, not children**, while `ContainedList` right next to it in the same `.d.ts` takes children. I initially wrote the children form. Both patterns exist in the package; neither is wrong, but the pairing is easy to get backwards.
- **`Search` renders full-width** with no width prop, so in a filter toolbar it pushes siblings to the next line. Wrapping it is the answer, but a `size`-adjacent width affordance would help.
- **`IconButtonProps` and `SparklineProps` are XOR unions** (`label` xor `ariaLabel`) — good design, enforced by the type — but the two names for the same idea across components (`ariaLabel` on `SideNav`/`OverflowMenu`/`Steps`, `aria-label` on `Filter`/`StructuredList`/`Progress`) is a coin flip every time. Two spellings of the same prop in one package.

---

## Red flags and blockers

**No blockers.** Nothing stopped progress. Ranked by what would actually cost a real adopter:

1. **`ComboChart` is broken for its stated use case** (§1, §2). The dual-axis dashboard chart clips its axis labels, smears its category labels, has no legend, and omits its line series from the screen-reader fallback — while the library ships the exported helpers that fix the first two problems and other charts already call them. An adopter who follows `recipe-dashboard.md` to `ComboChart` hits this immediately and concludes the charts package is unfinished. Highest-value fix in this report.

2. **Multi-scale `AreaChart` renders a plot that contradicts its own legend** (§3). Silently wrong data visualization is worse than an error. Either fix the fill opacity or make the docs forbid the configuration.

3. **Chart axis-label clipping is systemic** (§1, §4, §5). Wide left labels, overhanging final x labels, and stride/last-label collisions show up in _every_ chart in this app. Individually cosmetic; together they make token-perfect charts look unpolished, which undercuts the strongest selling point of a from-scratch charts package.

4. **A copied docs example does not compile** (§8). `Badge tone=` in `data-table.md`. Docs are the entire onboarding surface for a library with no training-data footprint; a broken example in the most-copied snippet is disproportionately expensive. Type-check the generated examples in CI.

5. **`registry.json` channel metadata disagrees with actual package exports for `toast`** (§10). The recipe table's channel column is CI-checked and was right everywhere I tested it — which is exactly why one wrong entry is dangerous: I trusted the column.

6. **Vocabulary drift across sibling components** (§6, §7, §13). `complete/current/upcoming` vs `pending/active/complete/error`; `destructive` vs `error`; `ariaLabel` vs `aria-label`. Each one is a guess-then-compile cycle. For a design system whose pitch is AI-first, prop-name predictability _is_ the product — an agent that can't predict the prop pays a compile round-trip for every component.

7. **Bundle size deserves a documented number.** 570 KB minified / 181 KB gzip of JS for one dashboard using ~45 components and 4 chart types. The CSS story is measured and published to the kilobyte (and tree-shakes well — 137 KB of a 273 KB sheet). The JS story is not documented at all. `@cascivo/react/dist` is 3.7 MB on disk, so something is tree-shaking, but an adopter comparing against shadcn will ask for this number and there is no answer in the docs. Publish it next to the CSS figures.

8. **Not a cascivo issue, but it bit this run:** `turbo run format` at the monorepo root reformats _every_ app, not just the one you're working on. I had to `git checkout` three sibling apps. Per-app `pnpm --filter` is the safe invocation.

---

## Verification

| Check              | Result                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsc --noEmit`     | clean (TS 6.0.3)                                                                                                                                                                                  |
| `eslint .`         | clean, 0 errors 0 warnings                                                                                                                                                                        |
| `prettier --check` | clean                                                                                                                                                                                             |
| `vite build`       | clean · 137 KB CSS / 19 KB gz · 570 KB JS / 181 KB gz                                                                                                                                             |
| Browser (Chromium) | all 6 routes render; routed navigation, ⌘K palette, DataTable sort/search/paginate, tab switching and theme switching all verified; **no console or page errors** (only a missing `/favicon.ico`) |

### Toolchain note

`typescript-eslint` 8.65 hard-refuses TypeScript 7.0 (`typescript-eslint does not support TS 7.0`), so this app pins `typescript@^6.0.3`. `tsc` 7.0 itself type-checked the project fine. Unrelated to cascivo.

---

## Would I adopt it?

For this task, yes — and that is not a close call. A Vercel-style console with an app shell, project switcher, command palette, sortable deployments table, virtualized build logs, KPI tiles, sparklines and five chart types, in one afternoon, with zero build config, zero hand-written ARIA, and three type errors total, is a strong result for a library with no training-data footprint.

The caveat is narrow and specific: **treat `@cascivo/charts` as beta.** `AreaChart`, `BarChart`, `LineChart`, `Sparkline` and `Kpi` are production-quality. `ComboChart` is not, and the axis-label clipping affects all of them. Budget time to check every chart visually rather than trusting that it compiled — which, notably, is the _only_ place in this build where "it compiled" wasn't enough.
