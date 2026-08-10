# Experience report — Vercel-like dashboard on TanStack Start + cascivo

**Date:** 2026-08-08
**Stack:** TanStack Start 1.168 (Router 1.170, Vite 8, React 19.2, SSR) + cascivo 0.16
**Install path:** B — prebuilt `@cascivo/react` / `@cascivo/charts` / `@cascivo/icons` npm packages (no `cascivo init`, no copied source)
**Scope built:** app shell (ShellHeader + SideNav + AppShell), overview with project cards, deployments table, analytics with 4 chart types, runtime log viewer, settings, project detail route
**Result:** builds, typechecks, lints clean; SSR renders real markup; all six routes verified in a real browser in both themes.

Everything below is first-run experience. No prior cascivo knowledge, no other app in this repo consulted.

---

## Summary

This went well. From `pnpm add` to a screenshot-worthy Vercel-like console took one pass, and the parts I expected to be expensive — command palette, virtualized log viewer, sortable/selectable/paginated table, four chart types, light/dark with no FOUC under SSR — were all one component each with sensible defaults. **I wrote 60 lines of CSS for the entire app.**

The friction is concentrated in one place: **prop-name discoverability**. Nine of my first-draft prop guesses were wrong, and each one is a compile-fail-and-retry cycle. None were hard to fix, but they were all avoidable. The one genuine bug is a React 19 setState-in-render violation in `DataTable`'s controlled-selection API.

---

## What went well

### Documentation is genuinely built for this

- `llms.txt` is the best agent-facing docs surface I have used. It gave me the install command, the SSR contract, the layer contract, the icon-name gotchas, and a complete component index with intent summaries in **one 780-line fetch**. I never needed to open the human docs site.
- The `.d.ts` really is documentation-grade, and `llms.txt` telling me to treat it as authoritative was correct advice. Reading `dist/index.d.ts` directly resolved every API question faster than any web page would have. Several prop docs read like postmortems (`Stat.goodDirection` explaining why error-rate tiles used to render bad news in green; `Column.width` explaining the `table-layout: fixed` cliff). That is unusually high-signal.
- The icon-name warning ("Names differ from Lucide/Radix — resolve via the catalog") plus `icons.catalog.json` meant **zero wasted compiles on icon names**. `LayoutDashboard→Dashboard`, `Rocket→Spaceship` were both mappings I would have gotten wrong. This mitigation works — keep it.
- `⚠` markers on the traps that matter (`Flex.direction` defaults to vertical; `AreaChart.title` is not a visible heading; omit `width` for responsive charts) all landed before I hit the trap.

### SSR under TanStack Start is genuinely zero-config

The claim is accurate. `@cascivo/react` 0.16, no `ssr.noExternal`, no `cascivoSsr()` plugin, no `<ClientOnly>` wrappers, no `'use client'` handling on my side. Charts server-render and hydrate. The only SSR-specific thing I did was import three stylesheets in `__root.tsx`. **This is a real differentiator** — every other design system I have wired into Vite SSR needed at least one config escape hatch.

### Theming under SSR is a solved problem

`themePreloadScript({ defaultTheme: 'dark' })` in `<head>` + `<ThemeProvider defaultTheme="dark">` + `suppressHydrationWarning` = correct dark paint on the first byte, persisted across reloads, zero hydration warnings, and all 25 chart series colors recolor for free. `useTheme()` returning a tuple `[theme, setTheme]` was pre-warned in `llms.txt` (I would have destructured `{ theme, setTheme }` — next-themes' shape — and gotten `undefined`).

### `setLinkComponent` is the right router integration

One three-line adapter at module scope, and every `SideNav` item, `ShellHeader` nav link, and `Breadcrumb` crumb becomes a client-side TanStack Router `<Link>`. Verified: clicking through the sidebar and header never reloads the document. The `LinkComponentProps` contract type being re-exported from `@cascivo/react` (so I did not have to add `@cascivo/core`) is exactly right for the prebuilt path.

### The heavy components carry their weight

- **`CommandMenu`** — I passed three groups of items and got a working ⌘K/Ctrl+K palette with fuzzy matching, match counts, group headings, `↑↓ navigate / ↵ open / esc close` keyboard hints, a scrim, and focus management. Both hotkeys verified working in a headless browser. This is the single biggest time save in the app.
- **`LogViewer`** — 400 lines, virtualized, per-level coloring, a filter box, a follow-tail pin toggle, a copy button, and a line counter. One component, one `lines` prop.
- **`DataTable`** — sorting, search, pagination with page-size options, multi-select, batch actions, and expandable rows for a 48-row deployments table with a six-element `columns` array. `Column.width` with an automatic content floor is a nicer sizing model than most table libraries ship.
- **`@cascivo/charts`** — `AreaChart` with `secondAxis` + `tooltipMode="axis"`, `BarChart` with an SLO `annotations` line and `categoryLabelEvery` thinning, donut `PieChart`, and inline `Sparkline` in `Stat.visual`. All responsive with no width math, all themed, all with the accessible-name requirement enforced *by the type system* rather than by a lint rule I would have ignored.
- **`Stat`** with `card` + `visual` + `goodDirection` collapses the whole KPI-tile pattern into one element. `goodDirection` separate from `trend` is the correct model and I have not seen another system get it right.

### The CSS layer contract worked as documented

Declaring `cascivo.app` in my own `@layer` order statement and putting all page CSS inside it meant I never fought specificity, never wrote `!important`, and never needed `cascivo.override`. Styling with `--cascivo-*` tokens meant my custom CSS themed itself in light mode for free.

### Tooling was frictionless

`pnpm add` in a pnpm workspace resolved cleanly. No peer-dependency warnings from cascivo. TypeScript resolved `@cascivo/core` types transitively through `@cascivo/react`'s `.d.ts` under pnpm's strict layout with no `moduleResolution` tweaking. `eslint-plugin-react-hooks@7`'s `react-hooks/immutability` rule — the one `llms.txt` warns about at length — **never fired**, because on the prebuilt path consuming components needs no signals. The doc's own framing ("consuming components requires no signals") is accurate and the warning is scoped correctly.

---

## What went badly

### 1. Prop names are not predictable from the type names next to them — 9 wrong guesses

Every one of these compiled-failed on the first attempt. Listed in the order I hit them:

| I wrote | Actual | Why I guessed wrong |
|---|---|---|
| `<Badge shape="outline">` | `variant="outline"` | The d.ts declares `type BadgeShape = 'secondary' \| 'outline' \| 'primary'` **directly above** `BadgeProps`. A type literally named `BadgeShape` that is not the `shape` prop is a trap of the library's own making. Hit in 4 files. |
| `gap="4"` | `gap={4}` | `SpaceStep` is `1\|2\|3\|4\|...`. Every other size prop in the catalog is a string union (`size="sm"`, `padding="md"`), so a numeric one breaks the pattern. **20 type errors in one run** — by far the biggest single cost. |
| `<Notification action={{label, onClick}}>` | `actions={<ReactNode>}` + `description` | `Alert` right next to it takes `action?: { label, onClick }`. Two adjacent feedback components, two different shapes for the same idea. |
| `<Notification>{body}</Notification>` | `description={body}` | Notification takes no children; passing them silently renders nothing. |
| `<Card interactive>` | (does not exist) | Reasonable guess for a clickable dashboard card; no such prop. |
| `<Toggle pressed onPressedChange>` | `checked` / `onValueChange` | Radix muscle memory; the d.ts is clear once read. |
| `<StructuredList rows={…}>` | `items={…}` | `DataTable` next door takes `rows`. `Timeline`, `DataList`, `StructuredList` all take `items`; `DataTable` alone takes `rows`. |
| `<DataList items={[{term, description}]}>` | `[{label, value}]` | It renders a `<dl>`, so `term`/`description` mirrors the HTML. `label`/`value` does not. |
| `annotations={[{type: 'line', …}]}` | `{kind: 'line', …}` | Discriminant is `kind`, not `type`. |

**This is the single highest-leverage thing to fix.** The event-handler naming table in `llms.txt` (`onValueChange` vs `onChange` vs `onSelect`) is excellent and saved me several errors — the same treatment is needed for *data* props. A short "prop vocabulary" table (`items` vs `rows`, `variant` vs `shape`, `kind` as the discriminant everywhere, numeric `SpaceStep`) would have eliminated all nine.

### 2. `DataTable`'s controlled selection violates React 19's render rules — genuine bug

```tsx
const [selected, setSelected] = useState<string[]>([])
<DataTable selection={{ mode: 'multi', selected, onChange: setSelected }} … />
```

Checking any row logs:

> `Cannot update a component (…) while rendering a different component (…). To locate the bad setState() call inside (…), follow the stack trace as described in https://react.dev/link/setstate-in-render`

Isolated to this API by bisection: dropping to `selection={{ mode: 'multi' }}` (uncontrolled) makes the warning disappear entirely; everything else on the page is identical. `DataTable` is calling the consumer's `onChange` **during its own render**, not in an effect or an event handler. Under React 19 this is a correctness bug, not a style issue — with concurrent rendering it can produce a torn or dropped update.

**Workaround shipped:** dropped to uncontrolled selection, since `batchActions` already receives the selected ids. That is fine for this demo but it is not fine for a real app, which needs the selection to drive a header count, an inspector pane, or a URL param. As written, the controlled API is unusable without console noise.

### 3. `AppShell`'s `<main>` has zero padding

Verified via computed style: `main#cascade-main { padding: 0px }`. On first render every page sat flush against the viewport edge — the "Add new" and "Redeploy latest" buttons were visibly **clipped at the right edge** in the first screenshot pass. `AppShell` is the one component whose entire job is page frame, `PageHeader` does not add outer padding either, and nothing in `llms.txt`, `AppShellProps`, or the `AppShell` context page mentions that the caller owns content padding.

**Workaround shipped:** a `.page` wrapper div with `padding: var(--cascivo-space-6)` inside `AppShell`. Every adopter will write this same div. Either give `AppShell` a `padding` prop defaulting to a token step, or say so loudly in the docs.

### 4. `Card` is not `position: relative` — the stretched-link pattern silently breaks the whole page

"Whole card is a link" is *the* dashboard card pattern (it is exactly what Vercel's project grid does). The standard implementation is an anchor with `::after { position: absolute; inset: 0 }`. Because `Card` establishes no containing block, that overlay resolved against the **viewport** and covered the entire application — the sidebar and header became unclickable. It failed silently: nothing looked wrong, and I only found it because a Playwright click timed out with `<a class="stretched-link" …> intercepts pointer events`.

A human would have found this by clicking around and being very confused. `Card` should either be `position: relative` (harmless, and what every other card system does) or document that it is not.

### 5. `AreaChart` with `secondAxis` renders two opaque overlapping fills

Plotting requests (left axis) and errors (right axis) as areas produces two solid fills stacked on top of each other; the smaller series is largely hidden behind the larger. There is a `fill` prop (`solid | gradient | pattern`) but it is chart-level, not per-series, so I cannot make the second series a translucent gradient while the first stays solid. The obvious fix — make the errors series a *line* — is not expressible, because `AreaChart` has no per-series mark type and `ComboChart` is bar+line, not area+line. Result: a chart that is technically correct and visually muddy.

Per-series `fill`, or a `type: 'line' | 'area'` on `AreaChartSeries`, would fix this.

### 6. `Switcher` keys its rows by `href` and has no `id` escape hatch

Three sibling teams that all link to `/` produced React duplicate-key warnings on every render. `SwitcherLink` is `{ label, href, active?, icon? }` — no `id`. Notably, **`SideNavItem`, `ShellHeaderNavLink`, `ShellHeaderNavMenuItem`, `HeaderLink`, and `CommandItem` all have exactly this `id` field, with a doc comment explaining it exists for placeholder `#` links.** `Switcher` was missed in whatever sweep added it.

**Workaround shipped:** made the hrefs artificially distinct (`/?team=acme` etc.).

### 7. `SideNav` active state must be computed by hand

There is no "match the current path" behavior — I map over my nav config on every render comparing `item.href === pathname`. That is correct for a config-driven component and I do not want it to know about my router, but it means exact-match-only: `/projects/storefront` lights up no nav item at all, and `/analytics?view=speed` needed a hand-written exception. Every router integration will write the same prefix-matching helper. A note in the router docs showing the canonical version would help.

### 8. Smaller friction

- **`Card padding="none"` does not remove the padding** when the content is a `CardContent` — `CardContent` brings its own. For an edge-to-edge table inside a card you have to skip `CardContent` entirely. Not documented.
- **`DataTable zebra` had no visible effect** in the dark theme. Either the token is too subtle to perceive or the prop is not wired; I could not tell which without reading the CSS.
- **`density="compact"` is barely distinguishable** — my rows were tall because of a two-line cell, so the row padding change is invisible next to content height.
- **`Button` wraps its children in an inner `<span>`.** My `.palette-trigger > span` flex rule hit the wrapper, not my label, and the icon/text/`Kbd` collapsed with no spacing. Not wrong, but the internal DOM shape is not documented, so any layout CSS against a Button's children is guesswork.
- **Icon + text inside a `Button` gets no automatic gap** in some compositions (`<ExternalLink />Visit` rendered touching). Inconsistent with `<Plus />Add new`, which did have a gap.
- **`Select` inside `CardHeader.actions` needs `aria-label`, not `label`** — `label` renders a visible label that breaks the header row. Fine, but `Field`/`Select`/`Search` each handle labelling differently (`label` on Search is the accessible name; on Select it is a visible `<label>`).
- **The visually-hidden checkbox inside `DataTable` is covered by a decorative `<span aria-hidden>` that intercepts pointer events**, so Playwright's `.check()` times out and needs `{ force: true }`. Real users click the label so this is not a UX bug, but it makes every table-selection E2E test in every adopter's suite fail confusingly. Worth a note in the testing docs — or `pointer-events: none` on the decoration.

---

## Red flags and blockers

**Nothing blocked the build.** Every problem had a workaround inside one file. Ranked by what would actually stop or bite a real adopter:

1. **`DataTable` controlled selection triggers setState-in-render (React 19).** The only genuine correctness bug found. It makes the documented controlled API unusable without console noise, and under concurrent rendering it is a real hazard, not just a warning. Highest priority.

2. **`Card` not being `position: relative` breaks the whole page silently.** The failure mode — a full-viewport invisible overlay swallowing every click outside the card — is severe and gives the adopter no clue where it came from. A one-line CSS change removes an entire class of bug reports.

3. **`AppShell` content padding.** Not a bug, but *every single adopter* writes the same wrapper div, and the first screenshot of any app built this way has clipped content. It is the first thing you see and it looks broken.

4. **Prop-name unpredictability, especially `BadgeShape` → `variant` and numeric `SpaceStep`.** Nothing here is unfixable, but 9 wrong guesses in one small app is a real tax, and `gap="4"` alone cost 20 type errors. For an AI-first system this is the highest-frequency friction, and it is a docs/naming problem rather than a code problem.

5. **`vite build` succeeds with type errors.** Not cascivo's doing, but worth flagging for anyone reading this: my first build passed green while 37 type errors sat in the tree. The prop-name mistakes above are only caught by `tsc --noEmit`, which is not part of `vite build`. Any cascivo starter/scaffold should wire `typecheck` into `build`.

## Things I expected to be problems and were not

Recording these because they are the loud warnings in the docs, and on this stack they were all non-events:

- **Signals.** Never called `useSignals()`, never touched `useSignal`. Plain `useState` throughout. The "consuming requires no signals" framing holds.
- **The `react-hooks/immutability` ESLint trap.** Never fired. Did not need `@cascivo/eslint-config`.
- **SSR `.css` extension errors.** Did not happen on 0.16.
- **Theme FOUC.** Did not happen; the preload script works exactly as advertised.
- **CSS layer conflicts.** Zero. Wrote no `!important`, used no `cascivo.override`.

---

## Verification performed

- `pnpm build` — clean (client + SSR bundles).
- `pnpm typecheck` (`tsc --noEmit`) — zero errors.
- `pnpm lint` (ESLint 10 + typescript-eslint + react-hooks 7 flat config) — zero warnings.
- `pnpm format` (Prettier) — clean.
- SSR HTML inspected via `curl` — full component markup, not an empty shell.
- All six routes screenshotted in a real Chromium at 1440×1200, dark and light.
- Interaction tested in-browser: SideNav and ShellHeader navigation are client-side (no document reload), ⌘K and Ctrl+K both open the palette, palette selection navigates via the router, theme toggle flips `data-theme` and persists, toasts fire from batch actions, notifications and team-switcher panels open.
- Console error audit per route — clean after the fixes above.
