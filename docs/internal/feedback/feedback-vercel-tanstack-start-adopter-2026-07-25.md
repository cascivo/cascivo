# Experience report — Vercel-like dashboard with TanStack

**Date:** 2026-07-25
**Framework:** TanStack Start 1.168 (SSR) + TanStack Router 1.170 + TanStack Query 5.101 + TanStack Table 8.21
**cascivo:** `@cascivo/react` 0.11.1, `@cascivo/themes` 0.4.6, `@cascivo/charts` 0.5.1, `@cascivo/icons` 0.3.4, `@cascivo/core` 0.5.3 (registry v0.11.1)
**Adoption path:** B (prebuilt npm package), React 19.2, `@preact/signals-react` 3.11
**Outcome:** shipped. Five routes, SSR working, `typecheck`/`lint`/`build` clean. Four library bugs found, three of which needed workarounds to get a working app.

---

## Red flags and blockers

### 1. 🚩 BLOCKER — `useSignal` / `useComputed` do not make components reactive, and the docs say they do

This is the single biggest problem of the run. The whole app was silently frozen: every filter, every segmented control, every table sort, every pagination click did nothing. Handlers fired, signals updated, the UI never moved.

`docs/HEADLESS.md` and `docs/AI-RULES.md` both state:

> You do **not** need `useSignals()` when the signal comes from a cascivo hook — `useSignal`, `useComputed`, `useControllableSignal`, `useDisclosure`, … all call `useSignals()` for you, so reading their returned signal in render is reactive on its own.

That is false for the two primitives the reactivity contract tells you to reach for first. `@cascivo/core@0.5.3` re-exports them **unwrapped**:

```js
// @cascivo/core/dist/index.mjs, line 1
import { batch, computed, effect, signal, useComputed, useSignal, useSignal as useSignal$1, useSignalEffect } from "@preact/signals-react";
// …and the export statement passes useSignal / useComputed straight through.
```

There is no wrapper function in the bundle — only `useMachine` actually calls `useSignals()`. Without the Babel signals transform (which no cascivo doc mentions installing, and which the TanStack Start / Vite SSR guide does not set up), a component reading `mySignal.value` in render never re-renders.

**Severity is amplified by three things:**

- The failure is **silent**. No error, no warning. It looks like your event handlers are broken.
- The docs describe this exact symptom ("handlers fire but the UI freezes") in the paragraph *immediately above* the incorrect claim, while pointing the reader away from the fix.
- `AI-RULES.md` is explicitly meant to be pasted into an agent's system prompt. An agent following it produces a dead UI every time.

**Workaround applied:** call `useSignals()` from `@cascivo/core` as the first statement of every component that reads a signal in render — see `src/routes/projects.tsx:37`, `deployments.tsx:103`, `analytics.tsx:32`.

**Suggested fix:** either wrap the re-exports in `@cascivo/core` so they genuinely call `useSignals()`, or correct HEADLESS.md/AI-RULES.md to say `useSignals()` is *always* required outside the transform, and document installing `@preact/signals-react-transform` in the Vite/TanStack Start guide.

### 2. 🚩 BLOCKER — the reactivity contract is unreachable on the prebuilt path

`@cascivo/react` exports **no signal primitives at all**. Checked against the shipped `dist/index.d.ts`: no `useSignal`, `useComputed`, `useSignalEffect`, `useSignals`, `useDisclosure`, `useScope`, `useMachine`. They live only in `@cascivo/core`.

But `docs/USING-WITH-VITE-SSR.md` explicitly tells you not to depend on `@cascivo/core`:

> Import `setLinkComponent` and the `LinkComponentProps` contract type from `@cascivo/react` (both re-exported) on the prebuilt path — that way you never add `@cascivo/core` as a direct dependency (under pnpm, importing it directly would be a phantom-dependency error, since it is only a transitive dep).

Verified that it really is unreachable — under pnpm's strict layout, `import('@cascivo/core')` from the app throws `ERR_MODULE_NOT_FOUND`.

So a Path B adopter is stuck between two documented rules: the reactivity contract says "never `useState`, use `useSignal`", and the SSR guide says "never depend on `@cascivo/core`". There is no third option. Whichever you pick, you are off-book.

**Workaround applied:** added `@cascivo/core: 0.5.3` as an explicit direct dependency, contradicting the SSR guide. It works, but it means pinning two packages in lockstep and taking on a dependency the docs call a mistake.

**Suggested fix:** re-export the state/behavior hooks from `@cascivo/react` the same way `setLinkComponent` already is. The link-component note proves the pattern is already understood — it just wasn't applied to the primitives the reactivity contract is built on.

### 3. 🚩 `Search` breaks SSR hydration — module-level id counter, not `useId`

Every server-rendered page containing a `<Search>` produced a React hydration error:

```
A tree hydrated but some attributes of the server rendered HTML didn't match…
+  htmlFor="cascade-search-1"   (client)
-  htmlFor="cascade-search-6"   (server)
```

Cause, from `@cascivo/react/dist/search/search.js`:

```js
var u = 0;
// …inside the component:
k.current === "" && (u += 1, k.current = `cascade-search-${u}`);
```

A module-scoped mutable counter. On the server it keeps incrementing for the lifetime of the process, so it diverges from the client's fresh counter on essentially every request — the mismatch gets worse the longer the server runs.

This directly violates cascivo's own documented rule in HEADLESS.md:

> `useId(prefix?)` — Stable, SSR-safe, colon-stripped id for aria wiring… One per instance — **never hardcode aria ids or use `Math.random()`**.

Notably `useId` in `@cascivo/core` is implemented correctly (it wraps React's `useId`), and `Combobox`, `DatePicker`, `PasswordInput` and `Radio` all use it properly. `Search` is the one component that doesn't — and it's the one every dashboard toolbar reaches for.

React says the mismatch "won't be patched up", so the `<label for>` ↔ `<input id>` association can end up broken on the client — an accessibility regression, not just console noise.

**Workaround applied:** pass an explicit `id` to every `<Search>` (`src/routes/projects.tsx:66`, `deployments.tsx:148`). This resolved the mismatch completely.

**Suggested fix:** one-line change — swap the counter for `useId('cascade-search')`.

### 4. 🚩 `CommandMenu` writes signals during render

Opening the command palette logs, on every open:

```
Cannot update a component (`v$2`) while rendering a different component (`v$2`).
```

From `@cascivo/react/dist/command-menu/command-menu.js`, in the render body:

```js
let F = a(m);      // a = useSignal, m = the `open` prop
F.value = m;       // ← signal write during render
let I = a(x);
I.value = x;       // ← and again for `hotkey`
```

This is the controlled-prop-to-signal sync done in the render phase. cascivo ships a primitive for exactly this case — `useControllableSignal({ value, defaultValue, onChange })`, which HEADLESS.md documents as "codifies the controlled↔uncontrolled bridge once, with no effect" — but `CommandMenu` doesn't use it.

The same pattern appears in `Search` (`j && (M.value = f)`) and `PasswordInput` (`typeof h == "string" && (b.value = h)`), so any controlled usage of those is on the same footing; `CommandMenu` is simply the one that surfaced a warning.

Not a functional blocker — the palette works correctly — but it is a rules-of-React violation in shipped library code, and it is noisy in exactly the way that trains developers to ignore console errors. Under React's concurrent rendering it is the kind of thing that becomes a real bug later.

**Suggested fix:** route these through `useControllableSignal`.

### 5. 🚩 `cascivo audit --ai` cannot run in a consumer project

`docs/AI-RULES.md` builds a whole override-escalation ladder around this command, including a `/* cascivo-audit: allow <rule> */` suppression syntax. In a normal app it fails immediately:

```
$ pnpm exec cascivo audit --ai src
Contract unavailable: token catalog not found (apps/site/public/tokens.catalog.json)
```

From `cascivo@0.5.4/dist/audit-*.mjs`:

```js
function findDocsPublic(startDir) {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, "apps", "site", "public");
    if (existsSync(candidate)) return candidate;
    dir = join(dir, "..");
  }
  return null;
}
```

It walks up looking for `apps/site/public/` — a directory that only exists inside the cascivo source monorepo. There is no network fallback to `https://cascivo.com/tokens.catalog.json` (which exists and is public), and `--help` exposes no flag to point it anywhere else.

Confirmed this is purely path resolution: after manually downloading `tokens.catalog.json`, `context.json` and `registry.json` into a fake `apps/site/public/` tree, the audit ran perfectly and reported **0 errors, 1 warning, 2 info** on this codebase. So the analysis engine is fine and genuinely useful — it's just unreachable.

**Workaround applied:** the app's `lint` script runs `cascivo doctor --ci` instead (which works fine and passes).

**Suggested fix:** fetch the catalog from `cascivo.com` with a local cache, ship it inside the `cascivo` package, or add a `--contract <path>` flag.

---

## What went badly (friction, not blockers)

### `Flex` defaults to `direction="vertical"`

`<Flex justify="between">` silently produced a centered vertical stack. From `flex.js`: `{ direction = "vertical", … }`.

Every comparable primitive — CSS's own `flex-direction`, Chakra's `Flex`, MUI's `Stack` in row mode, Radix Themes' `Flex` — defaults to row. The props table in `/llms/layout/flex.md` lists `direction?: 'vertical' | 'horizontal'` with **no default column**, so there was nothing to read that would have prevented the mistake; I had to open the shipped JS. Cost three wrong layouts before I noticed.

Suggested fix: at minimum document the default. Ideally reconsider it — this is the kind of default that will bite every new adopter once.

### Inconsistent prop naming across components

Guessing from one component's API to another's is unreliable:

| Concept              | `IconButton` | `OverflowMenu` | `SideNav`   | `Sparkline` | `CommandMenu` |
| -------------------- | ------------ | -------------- | ----------- | ----------- | ------------- |
| accessible label     | `label`      | `ariaLabel`    | `ariaLabel` | `label`     | `label`       |
| menu item identity   | —            | `value`        | —           | —           | `id`          |

I wrote `<OverflowMenu label=… items={[{ id, label }]}>` by analogy with `CommandMenu` and `IconButton`; both were wrong and produced TS errors. The docs *were* correct — this is purely an API-consistency cost, but with 192 components it compounds.

### `layout/*` is split between "importable" and "copy-paste only" with no signal

`docs/RECIPE-DASHBOARD.md` lists `layout/grid`, `layout/auto-grid`, `layout/flex` and says "All exported from `@cascivo/react`". `layout/page-header` and `layout/dashboard-layout` look identical in the component index but are copy-paste only — you only find out by opening the per-component page and spotting the italic line, or by getting an import error.

Since I was on Path B, I hand-wrote a 25-line `PageHeader` (`src/components/page-header.tsx`). Fine, but avoidable. Suggested fix: mark the channel in the recipe's component-map table, not just on the detail page.

### llms.txt contradicts the SSR guide on `ssr.noExternal`

`https://cascivo.com/llms.txt` — the file explicitly aimed at AI agents — says:

> SSR SETUP … an unconfigured SSR build throws `Unknown file extension ".css"` … **Two required steps:** 1. In vite.config: `ssr: { noExternal: [/^@cascivo\//] }` …

`docs/USING-WITH-VITE-SSR.md` says the opposite for the version actually on npm:

> **As of `@cascivo/react` 0.10, SSR works with zero Vite config.**

The docs page is right — I built and server-rendered on 0.11.1 with a completely untouched `vite.config.ts`. But llms.txt is the file most likely to be a single-fetch context source, and it carries the stale instruction. An agent reading it adds dead config.

### `CardHeader` is `flex-direction: column`, which fights the common card pattern

A card with a title on the left and an action menu on the right is the single most common dashboard card layout. `CardHeader` hard-codes `flex-direction: column`, so setting `justify-content: space-between` on it does nothing until you also re-set `flex-direction: row`. Took a screenshot to notice — it renders as a centered stack, which looks intentional. Worked around in `src/styles.css`.

### `Kpi` delta formatting is not controllable

`<Kpi delta={25.6} deltaLabel="vs previous 7d" />` renders `▲ +25.6` with no unit — there's no `deltaFormat` or `deltaSuffix` prop, so a percentage delta can't be shown as `+25.6%`. The `deltaLabel` also wraps awkwardly inside a narrow tile in a 4-up `AutoGrid` (visible in the overview screenshots). `Stat` takes `delta` as a pre-formatted `string` and has neither problem — the two tile components disagree about who owns formatting.

### The app's own CSS layer slot isn't in the canonical order statement

AI-RULES.md says to put page styles in "the app's own slot (e.g. `cascivo.example`, declared in the order statement)" but the canonical order statement it gives immediately below contains no app slot:

```
@layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.theme, cascivo.blocks, cascivo.override;
```

So where the slot goes is left to guessing. I put `cascivo.console` between `blocks` and `override` (`src/styles.css:7`), which behaves correctly, but a one-line worked example would remove the doubt.

### Minor

- `RelativeTime` needed no SSR handling at all, but I still had to make all mock timestamps derive from a fixed epoch to keep server/client output stable. The `now` prop is documented for this — worth surfacing in the dashboard recipe, since every deploy console has a "3 minutes ago" column.
- `DataTable`'s `Column.width` is easy to miss; without it the commit-hash column wrapped mid-hash. Default column sizing doesn't respect content shape.
- The `Search` component renders its `label` as visible text by default, which showed up as a stray "Search" in the deployments toolbar until it was styled around.

---

## What went well

**The SSR story is genuinely solved.** The headline 0.10+ claim holds: I built and server-rendered a five-route TanStack Start app with a completely unmodified `vite.config.ts`. No `noExternal`, no `cascivoSsr()` plugin, no `<ClientOnly>` wrappers. Charts server-render and hydrate cleanly. This is the part of the docs I most expected to fight and didn't.

**`setLinkComponent` is the right abstraction.** One line in `src/router.tsx` wired `ShellHeader`, `SideNav` and `Switcher` to TanStack Router's `<Link>`, with hover-preloading and `aria-current` intact and no `onClick` interception. Every other design system I've wired to a router needed per-component render props. The `LinkComponentProps` contract type made it a two-minute job.

**The shell components are a real head start.** `AppShell` + `ShellHeader` + `SideNav` gave a collapsible sidebar, a working hamburger with correct `aria-expanded`, a skip-to-content link, and an icon rail — for about 40 lines of config. Nothing hand-written, nothing to debug.

**Density of coverage is excellent.** Everything a Vercel clone needs already existed: `Status` with a `pulse` gated behind `prefers-reduced-motion`, `RelativeTime` that's hydration-safe by default, `LogViewer` with virtualization and level colouring, `CommandMenu` with a full keyboard model and native `<dialog>` focus trap, `Sparkline`, `Kpi`, `AreaChart` with `dataZoom`. I wrote **zero** custom SVG and zero ARIA event handling.

**Themes are the strongest single feature.** `import '@cascivo/themes/all.css'` plus `themePreloadScript({ defaultTheme: 'dark' })` gave a persisted, no-flash dark/light toggle in under 15 lines. `useTheme()` returning a tuple of plain strings (not a signal) is a good call — and the docs pre-empt exactly the `theme.value` and `{ theme, setTheme }` mistakes an agent would make. Both themes render well with no per-theme work (see screenshots).

**The docs are unusually good where they're right.** The `/llms/<component>.md` per-component pages are excellent — props, object types, real examples, tokens, a11y, all machine-readable. `RECIPE-DASHBOARD.md` mapped this exact task ("Vercel's project dashboard") to components need-by-need. The `npx @cascivo/docs` offline channel is a genuinely good idea. Small touches paid off repeatedly: the icon-name mapping table (`LayoutDashboard→Dashboard`, `Rocket→Spaceship`) meant all 25 icon imports compiled first try, and the ⚠ name-collision callout on `AppShell` prevented a wrong import.

**The shipped `dist/index.d.ts` is documentation-grade**, exactly as advertised. When docs and reality diverged, reading the flat 104 KB rollup was faster than fetching another page — that's where I found `IconButton`'s `icon` is an alias for `children`, and the real `OverflowMenuItem` shape.

**`cascivo doctor` works out of the box** and is a sensible CI gate.

**The audit engine is good, when you can reach it.** Once manually pointed at a contract it reported 0 errors on this codebase and flagged genuinely useful things — an untranslated button string, and two components whose props it couldn't verify through a spread. Fixing finding #5 would make this a real asset.

---

## Summary for maintainers

Ranked by what would most improve the next adopter's experience:

1. **Fix `useSignal`/`useComputed` reactivity** (#1) — wrap them, or correct the docs. Everything else is cosmetic next to a silently frozen UI.
2. **Re-export the state hooks from `@cascivo/react`** (#2) — the prebuilt path currently cannot follow its own reactivity contract without violating the SSR guide.
3. **`Search` → use `useId`** (#3) — a one-line fix for a guaranteed hydration mismatch in every SSR app.
4. **Make `cascivo audit` runnable outside the monorepo** (#5) — the engine works; only the file lookup is broken.
5. **`CommandMenu` → `useControllableSignal`** (#4).
6. **Document (or change) `Flex`'s vertical default**, and mark copy-paste-only entries in the dashboard recipe's component table.
7. **Reconcile llms.txt's SSR section with USING-WITH-VITE-SSR.md** — the agent-facing file is the stale one.

The library is substantially better than the friction list suggests. Coverage, theming, SSR and the router-link integration are all strong, and the finished console needed no custom SVG, no ARIA code, and no second UI dependency. But findings #1 and #2 together mean a developer following the documented happy path on the prebuilt package ends up with an app whose UI doesn't respond to input — and no error telling them why.
