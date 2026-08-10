# Experience report — Vercel-like dashboard, Vite + React Router (no TanStack)

**Date:** 2026-08-08
**Prompt:** "create a vercel like dashboard with vite and react router, no tanstack"
**Stack:** Vite 7 · React 19 · React Router 8.3 (`createBrowserRouter`, library mode, CSR/SPA) · TypeScript 5.9
**cascivo:** `cascivo` CLI 0.7.1 · `@cascivo/react` 0.16.0 · `@cascivo/charts` 0.16.0 · `@cascivo/icons` 0.3.7 · `@cascivo/themes` 0.4.10 · registry v0.16.0
**Consumption path:** B (prebuilt npm package), scaffolded with `npx cascivo create`
**Result:** 5 routes, builds clean, `typecheck`/`lint`/`format` clean, verified rendering + interaction in a real browser.

---

## Summary

This was a genuinely fast build. From `npx cascivo create` to a five-route dashboard with a
command palette, a sortable/searchable data table, three chart types, an app shell with routed
navigation, and a persisted light/dark toggle took one pass, and **the first `tsc --noEmit` was
clean** — no prop guessing, no API archaeology. The `.d.ts` really is the best artefact in the
project; it repeatedly answered questions the published docs did not.

The friction was almost entirely **not** in the components. It was in (a) the scaffold the CLI
generates, which ships a lint setup that crashes and then lints nothing, (b) a genuine charting
bug that makes any sub-day time series unreadable, and (c) small gaps between the published
docs and the shipped types.

---

## What went well

### The CLI's `create` gets you to a running app immediately

`npx cascivo create <name> --theme dark --pm pnpm --yes` produced a working Vite + React + TS app
with `AppShell` + `ShellHeader` + `SideNav` already wired, the theme CSS imported, `src/vite-env.d.ts`
present (so the bare `.css` side-effect imports typecheck), and an `AGENTS.md` restating the CSS
layer contract. In a pnpm workspace it correctly detected the root lockfile. Non-interactive
`--yes` worked. This is a better cold start than most design systems offer.

### The shipped `.d.ts` is the documentation

Every time I had a question, the answer was in `node_modules/@cascivo/react/dist/index.d.ts` or
`@cascivo/charts/dist/index.d.ts`, usually with the rationale and a warning about the exact mistake
I was about to make. Examples that saved me real time:

- `Flex.direction` defaults to `vertical` — flagged in the type doc, so I never wrote the bug.
- `Stat.card` exists specifically so a `Stat` row and a `Kpi` row read as one system.
- `Stat.delta` is a **pre-formatted string**; `Kpi.delta` is a **number** and `Kpi` owns the sign
  and unit. Two different contracts, both explained where I'd see them.
- `goodDirection="down"` for errors/latency/cost — I'd never have looked for this prop, and it is
  exactly right for a deploy console.
- `AppShell`'s doc comment warns that the shell is `100dvh` with an internal scroll container, so
  a Playwright `fullPage: true` screenshot captures only the viewport. I hit that within five
  minutes of writing my screenshot script — and the answer was already sitting in the type.

### `llms.txt` / `llms-full.txt` are excellent agent surfaces

One `curl` of `llms-full.txt` (~19k lines) gave me the full component index, per-component props,
examples, tokens and a11y notes offline. The `RECIPE-DASHBOARD.md` guide is exactly the document
I needed: it maps "project card grid", "KPI tile", "usage sparkline", "deployments table",
"command palette" each to a specific component, and warns about `DataTable` column sizing and
the react↔charts `Text` name collision _before_ they bite. The icon-name mapping table
(`LayoutDashboard→Dashboard`, `Rocket→Spaceship`) meant zero wasted compiles on icon imports —
all 26 names I checked against the catalog were right first try.

### Router integration is a one-liner and it actually works

```tsx
setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href ?? '#'} {...rest} />)
```

That single call routed `SideNav`, `ShellHeader` brand, and `Breadcrumb` through React Router.
Verified in-browser: clicking a `SideNav` item does **not** reload the page, `aria-current="page"`
lands on the right item, the `Projects` sub-group expands and highlights the active project, and
links stay real `<a href>`s (middle-click still works). The `LinkComponentProps` bag being
spreadable — with cascivo's computed `className`/`data-state`/`aria-*` carried along — is the
right design, and `LinkComponentProps` is re-exported from `@cascivo/react`, so I never needed
`@cascivo/core` as a direct dependency.

For in-content links the `<Link asChild><RouterLink/></Link>` pattern is documented in the `.d.ts`
right where you'd look, and it works.

### The behavior layer is genuinely done

I wrote **zero** ARIA, zero keyboard handlers, zero outside-click listeners. Verified by driving
a real browser:

| Behavior                                  | Result                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `CommandMenu` ⌘K global hotkey            | opens                                                                       |
| Palette fuzzy search + Enter navigates    | works, client-side                                                          |
| `Dropdown` (team menu) open/close/select  | works                                                                       |
| `DataTable` search filters rows           | works                                                                       |
| `DataTable` sort asc → desc               | works, and sorts the **raw** `durationSec`, not the rendered `"18s"` string |
| `DataTable` pagination + page-size select | works                                                                       |
| `Toggle` switches flip `aria-checked`     | works                                                                       |
| Theme toggle → `data-theme` on `<html>`   | works, **and persists across reload**                                       |

The `useTheme()` tuple `[theme, setTheme]` returning a plain string (not a signal) means a theme
toggle is ordinary React. `ThemeProvider defaultTheme="dark"` + `@cascivo/themes/light-dark.css`
was the entire theming setup, and both themes render correctly.

### Signals are opt-in, and the escape hatch is documented where it matters

The claim "consuming components requires no signals" holds — four of my five routes use plain
React (`useState` or nothing). On the one route where I _did_ use `useSignal`, the documented rule
(`useSignals()` as the first statement) was correct and the toggles worked on the first try. The
failure mode ("handlers fire, the UI freezes") is called out prominently enough that I never hit it.

### Charts are real charts

`AreaChart` multi-series with automatic per-series palette colors, `brush`, `tooltipMode="axis"`,
`annotations` (an SLO threshold line), horizontal `BarChart`, `Kpi` tiles with built-in sparklines,
and inline `Sparkline` in `Stat.visual` — all worked with no wrapper, no `ResizeObserver` code, and
no width math. Omitting `width` really does give a responsive chart. Axis margins auto-size to the
tick labels, so a `40,000` label is never clipped.

### Layout primitives cover a dashboard

`Grid cols={{ base: 1, md: 2, lg: 4 }}`, `GridItem span={{ base: 1, lg: 2 }}`, `AutoGrid min="20rem"`,
and `Flex` covered every layout in the app. I wrote **one** CSS rule in the whole project (page
padding, below). `Grid` establishing its own containment means responsive `cols` work with no
wrapper — that is a real ergonomic win over media-query grids.

---

## What went badly

### 🔴 The scaffold's ESLint config crashes on first run

`npx cascivo create` emits:

```js
reactHooks.configs['recommended-latest'],   // generated by the CLI
```

With `eslint-plugin-react-hooks@7.1.1` + ESLint 9, `pnpm lint` immediately dies:

```
A config object has a "plugins" key defined as an array of strings.
Flat config requires "plugins" to be an object […]
```

This is _the exact mistake cascivo's own `llms.txt` warns about_ ("FLAT CONFIG ENTRY POINT: …you
MUST use `reactHooks.configs.flat['recommended-latest']`"). The CLI generates the wrong one. Fix:

```js
reactHooks.configs.flat['recommended-latest'],
```

**Severity: high.** It is the first command a new adopter runs after `pnpm install`, and it fails
with an error that points at ESLint's migration guide, not at cascivo.

### 🔴 …and once it starts, it lints nothing

After fixing the entry point, `pnpm lint` exits 0 — because it checked **zero files**. The
scaffolded config is `js.configs.recommended` + react-hooks + `@cascivo/eslint-config`, none of
which register a TypeScript parser or `files` pattern, so every `.ts`/`.tsx` in a
TypeScript-only project is silently skipped:

```
$ npx eslint src/routes/settings.tsx
  0:0  warning  File ignored because no matching configuration was supplied
```

A green lint that inspected nothing is worse than a red one. I had to add `typescript-eslint`
myself. `cascivo create` scaffolds a TypeScript app; it should scaffold a TypeScript linter.

**Severity: high** — silent, and it makes the `@cascivo/eslint-config` dependency the CLI _does_
install pointless, since the rule it turns off can never fire on a file that is never linted.

### 🟡 `react-hooks/immutability` vs. signals — the mitigation works, but only if lint works

Once TS files were actually being linted, I confirmed the documented conflict is real. With the
cascivo config removed, my settings page produces:

```
error  Error: This value cannot be modified
> 72 |  <Button onClick={() => (saved.value = true)}>
                               ^^^^^ `saved` cannot be modified
```

…on every signal write. `@cascivo/eslint-config` suppresses it correctly, and its source file
carries an unusually honest explanation of _why_ it turns the rule off rather than narrowing it,
and what that costs. Credit where due. But note the ordering trap: this only surfaces after you
fix the two bugs above, so a fresh adopter's first encounter with the mitigation is likely to be
"why is this dependency here?".

### 🔴 `timeScale` returns exactly one tick for any sub-day domain

The single worst component-level bug I hit. Passing `Date` values to `AreaChart`'s `x` accessor
switches it to a time scale — and for a 24-hour window that scale produces **one** tick, with a
date format, regardless of `xTicks`. Reduced to the primitive:

```js
import { timeScale } from '@cascivo/charts'
const s = timeScale([new Date(NOW - 23 * 3600e3), new Date(NOW)], [0, 800])
s.tickInterval() // 'day'      ← for a 23-hour domain
s.tickFormat() // { month: 'short', day: 'numeric' }
s.ticks(3) // 1
s.ticks(5) // 1
s.ticks(6) // 1
s.ticks(8) // 1
s.ticks(12) // 1
```

`ticks(count)` ignores `count` entirely here. The rendered result was a 24-point traffic chart
whose entire x-axis read `8/8/2026`. "Requests over the last 24 hours" is _the_ canonical deploy
dashboard chart, so this is squarely on the happy path.

The `.d.ts` for `format` even describes the symptom ("that format is fixed, so every bucket
narrower than a day collapses to the same label") — but `format` only restyles the one tick it
gets; it cannot create more. **Workaround I shipped:** drop the `Date` x entirely, use a numeric
hour index (`t: 0…23`) so the chart uses a linear scale that _does_ honour `xTicks`, and convert
back to a clock time in `format`. That works, but it means the documented "return a `Date` for a
time axis" path is unusable for the most common dashboard time range, and I had to denormalize my
data model around a charting bug.

### 🟡 `AppShell` gives its content region zero padding, and nothing ships to fix it

Straight out of `cascivo create`, every routed page renders flush against the side nav and the
viewport edge — the "New Project" button touches x=1440 on a 1440px viewport. `AppShell` has no
`padding` prop; its `<main>` computes `padding: 0px`.

The CLI's own generated `Dashboard.tsx` works around this with an **inline style**:

```tsx
<div style={{ display: 'grid', gap: 'var(--cascivo-space-6)', padding: 'var(--cascivo-space-6)' }}>
```

…which is the pattern the sibling generated `AGENTS.md` tells agents not to write ("CSS custom
properties only — no inline styles"). On the prebuilt path there is also no shipped page-padding
primitive to reach for: `layout/section` is copy-paste-only, and `Center` gives max-width, not
padding. I wrote the app's only stylesheet for this, in the `cascivo.example` layer as the
contract prescribes:

```css
@layer cascivo.example {
  .page {
    padding: var(--cascivo-space-6);
    padding-block-end: var(--cascivo-space-10);
  }
}
```

Small fix, but every single adopter will hit it, and the scaffold demonstrates the wrong answer.

### 🟡 The `format` prop is missing from the published chart docs

`AreaChart`/`BarChart` both accept `format?: (value: number | string | Date) => string` for axis
tick labels. It is **not** in the props table at `https://cascivo.com/llms/chart/area-chart.md`,
not in `llms-full.txt`, and not in `RECIPE-DASHBOARD.md` — I only found it by grepping the
`.d.ts`. The docs are explicit that the `.d.ts` wins when surfaces disagree, but here the docs
don't disagree, they simply omit a prop I needed. For an agent that fetches `llms-full.txt` and
builds from it (the workflow the docs recommend), the prop effectively does not exist.

Same class of gap: `AreaChart`'s registry page lists a `title` prop as `required` with no note
that it renders nothing visible; the `.d.ts` for other components does carry that warning.

### 🟡 `DataListItem` looks like a component and isn't

`@cascivo/react` exports `DataList`, `DataListItem`, `DataListProps` from one flat export list with
no marker separating components from types. `DataListItem` is an **interface**; `DataList` takes an
`items` array. I wrote the compositional form first:

```tsx
<DataList>
  <DataListItem label="Domain">{project.domain}</DataListItem> {/* ✗ */}
</DataList>
```

The mistake is natural because the catalog _does_ have `ListItem`, `ContainedListItem`,
`MenuItem`, `TabsTrigger` etc. as real components — `DataList` is items-prop-driven while its
neighbours are children-driven, and nothing in the name tells you which. `tsc` caught it, so it
cost a minute, but the inconsistency is real. `OverflowMenu` has a related papercut: it takes
`ariaLabel`, while sibling components in the same page (`Sparkline`) take `label` _and_
`ariaLabel` as aliases, and `Toggle` takes `label` as a **visible** label.

### 🟡 Route-level code splitting doesn't pay off, because sparklines are on the landing page

`RECIPE-DASHBOARD.md` recommends lazy-loading chart routes to escape Vite's 500 kB warning. I did
exactly that for `/analytics`. Result:

```
dist/assets/index-*.js        524.70 kB │ gzip: 172.13 kB   ← still over the limit
dist/assets/analytics-*.js      2.88 kB │ gzip:   1.25 kB   ← the "big" chart route
```

The analytics chunk is 2.9 kB because `@cascivo/charts` is already in the entry chunk — the
Overview page uses `Sparkline` in its KPI tiles and project cards, exactly as the recipe itself
recommends for a project grid. So the recipe's two pieces of advice work against each other: put
sparklines on your landing page _and_ split charts off the initial load are mutually exclusive.
Worth calling out in the guide, or worth a `@cascivo/charts/sparkline` subpath export that doesn't
drag the engine in.

(The measured totals — 525 kB / 172 kB gzip JS and 106 kB / 16 kB gzip CSS for a 5-route console —
are close to the ~540 kB / 177 kB the recipe predicts, so the documented number is honest.)

### 🟢 Minor / cosmetic

- **`DataTable` free-form column squeeze.** Following the recipe's advice I sized 6 of 8 columns
  and left two unsized. The two unsized columns then got squeezed hard enough that project names
  wrapped mid-token (`acme-`/`storefront`). The guidance ("leave at least one column unsized") is
  right in spirit but under-specifies: the leftover width isn't distributed sensibly when the sized
  columns nearly fill the table.
- **`Field` rows aren't baseline-aligned in a `Grid`.** In a 2-column `Grid` of `Field`s, a field
  with a `description` shifts its label/input relative to the field beside it. Needs manual work.
- **`GridItem` children don't stretch.** A `Card` inside a `GridItem span={2}` doesn't fill the row
  height next to a taller sibling, leaving a visible hole. `Grid`'s `align` prop didn't fix it for me.
- **Declared layer order omits `cascivo.platform`.** `index.html` from `cascivo create` declares
  `@layer vendor, cascivo.reset, …, cascivo.component, cascivo.theme, cascivo.blocks, cascivo.example,
cascivo.override;` while the canonical order in `llms.txt` includes `cascivo.platform` between
  `component` and `theme`. Harmless today (no shipped CSS uses that layer — I grepped), but an
  undeclared-but-used layer sorts _last_ and would beat `cascivo.override`, which is the precise
  failure mode the contract exists to prevent.
- **Unlayered CSS in the generated `index.html`.** The same file that declares the layer order and
  whose sibling `AGENTS.md` says "Every declaration goes inside an `@layer` block. Unlayered CSS
  beats all layers […] never emit it" then emits `html, body, #root { height: 100%; }` unlayered.
- **`cascivo create` scaffolds no formatter.** No prettier, no `format` script, despite emitting
  code in a consistent no-semicolon / single-quote / 100-col style. I added prettier by hand.
- **Peer-dependency noise.** `pnpm add` prints an unrelated peer warning from a sibling workspace
  package on every install; not cascivo's fault, but it buries any real cascivo peer warning.

---

## Red flags / blockers

Nothing blocked the build. Ranked by what would actually stop or mislead a real adopter:

1. **`pnpm lint` crashes out of the box, then silently lints nothing once fixed.** (2 bugs, one
   scaffold file.) A team that adopts cascivo via `cascivo create` and wires `pnpm lint` into CI
   has a green check that inspects zero files. Both fixes are one-liners in the CLI's template.
2. **Sub-day time-series charts have a one-tick x-axis.** Reproducible at the `timeScale`
   primitive, independent of any chart component. Any "last 24 hours" panel — the single most
   common thing on a deploy/monitoring dashboard — is unreadable until you abandon the documented
   `Date` x-accessor.
3. **Docs/`.d.ts` drift on chart props.** The project's stated model is "the `.d.ts` wins", and it
   does — but agents are explicitly steered to `llms-full.txt` as a single-fetch source of truth,
   and a prop that exists only in the `.d.ts` is invisible to that workflow. `format` is not
   obscure; it is the fix for the bug above.
4. **`AppShell` needs page padding you must supply yourself, and the scaffold models it wrong.**
   Cheap to hit, cheap to fix, but it means every cascivo app's first screenshot looks broken and
   the official answer is an inline style the house rules forbid.

## Things I expected to be painful and weren't

- Wiring a third-party router into a config-driven nav. One line.
- Making charts responsive inside a CSS grid. Nothing to do.
- Getting a keyboard-accessible ⌘K palette. Two props.
- Theme switching without a flash or a `useEffect` class toggle. `ThemeProvider` + one CSS import.
- Type errors from a design system's generics. Zero, across ~700 lines of TSX, first run.
