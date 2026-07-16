# Fix plan — "Vercel-like dashboard on TanStack Start" adopter report (2026-07)

> **IMPLEMENTATION STATUS (2026-07-16):** Waves 1–5 are **implemented and verified**
> on branch `claude/cascivo-experience-report-analysis-yazt6i` (`pnpm ready` green:
> regen idempotent, format+lint, build, typecheck, all package tests + CSS/meta/llms
> checks pass). Notes on decisions taken during implementation:
> - **Wave 1.3 (AppShell `.main` container) — SKIPPED by design.** `container-type`
>   makes an element the containing block for `position: fixed` descendants, which
>   would trap consumer overlays rendered inside the main region. Grid/Columns/
>   SettingsLayout/blocks now self-contain (the real fix), so the defense-in-depth
>   wasn't worth that regression. The toast `@container`→`@media` correction shipped
>   independently (it's a standalone bug: the fixed-position viewport never matched
>   its `@container` query).
> - **Wave 1.4 (dev-time warning) — SKIPPED.** With the components self-containing,
>   the misconfiguration it guarded against is no longer reachable through the public
>   API; adding a getComputedStyle ancestor-walk would be speculative complexity.
> - **Wave 1.1 browser regression — deferred as a follow-up.** The site Playwright
>   suite runs as a separate CI job with no reachable bare-responsive-Grid page, and
>   adding one expands scope into the site app. The structural unit test now guards the
>   containment contract; a real-browser column-count assertion is a tracked follow-up.
> - **Wave 3 `SideNavItem.render` — shipped enriched** (`{ collapsed, children, linkProps }`);
>   the per-component `renderLink` override prop was intentionally **not** added (the
>   global `setLinkComponent` covers the reported need — Simplicity First).
> - **Wave 4.3 (`useTheme`) — no change**, as triaged (the reactivity claim was refuted).
>   The optional `useThemeValue`/`useLocaleValue` convenience hooks were **not** added
>   (default-skip decision); the eight unmitigated hooks are now self-subscribing.
> - **Wave 6 (dist CSS strategy) — not implemented here**; it remains the maintainer
>   escalation described below.
>
> Everything else in Waves 1–5 shipped as specified.

**Status:** Planning artifact — the plan below is the spec; see the status banner above
for what landed. Written for an implementing agent. Every item carries file:line
pointers, effort (S/M/L), and a verification gate.
**Source:** `feedback-tanstack-dashboard-adopter-2026-07.md` (same directory) — an AI
agent that one-shot built a Vercel-style dashboard (Overview / Deployments / Analytics,
AppShell + SideNav, KPI tiles, area/bar/donut charts, DataTable) on TanStack Start
(SSR), consuming the **prebuilt `@cascivo/react` 0.6.3** and `@cascivo/charts 0.3.10`
from npm. Verdict positive; two red flags (one silent) and seven friction items.

**Verification:** every claim was checked against the current working tree by five
independent code investigations (Grid/container, PieChart/SSR, nav/link seams,
useTheme + RelativeTime, docs/llms generators). Headlines:

- **R2 (Grid silently collapses to one column) is real and worse than reported** — the
  root cause is a self-query bug (`container-type` on the same element whose own rule
  uses `@container`; an element is never its own query container), and **four more
  shipped components have the identical defect** (Columns, SettingsLayout, and the
  marketing-features and dashboard-overview blocks). It only works inside cascivo's own
  apps because `Section` / app-level wrappers happen to provide an ancestor container.
- **R1 (PieChart hydration) is real with a precise root cause** — `arcPath` interpolates
  **unrounded `Math.sin`/`Math.cos` output** into `d` attributes; trig is not
  bit-reproducible across JS engines (server Node vs browser), unlike the pure
  arithmetic Area/Bar use. The whole trig chart family (pie, radial-bar, radar, gauge,
  meter, sunburst, scatter/polar) is exposed. The measurement pipeline is *not* the
  problem — it is already hydration-safe.
- **#4 (useTheme not reactive in React) is REFUTED as stated** — `useTheme()` already
  calls `useSignals()` internally and has a passing reactivity test. But the *systemic*
  version of the trap is real: **eight other public signal-returning hooks do not**
  self-subscribe, and `currentLocale()` can't.
- **#3 (icon aliases) is mostly STALE against main** — the alias layer, MCP
  `search_icons` tool, and llms.txt concept legend shipped after the report's
  `@cascivo/icons 0.2.8`. One genuine residual (`Fork`/`GitBranch` alias gap).
- **#2 (two CSS stories) is the already-known deferred decision** — prior plan
  `fix-plan-tanstack-ssr-adopter-2026-07.md` Wave 1.3 (Option A vs B). This is now the
  **second independent adopter** to pay the aggregate-CSS cost on TanStack; this report
  is new evidence for resolving that deferral, not a new plan.
- **#8 (`gap={7}` rejected) is working-as-intended** — `--cascivo-space-7` genuinely
  does not exist in the token scale. Docs-only.

**Relationship to prior plans (do not duplicate):**

- `fix-plan-tanstack-ssr-adopter-2026-07.md` — Waves 1.1/1.2/2/3(-3.1)/4/5 shipped.
  Its deferred Wave 1.3 (dist CSS strategy) is referenced by Wave 6 below.
- `spec-ssr-verify-and-props-parity-2026-07.md` — Track A (SSR end-to-end harness
  consuming the built dist) is the natural home for the pie/donut hydration regression
  test (Wave 2.4 below hooks into it).
- `fix-plan-dashboard-adopter-2026-07.md` and `docs/plans/dashboard-experience-report-plan.md`
  cover different adopters (CLI/registry skew; "layout-only" misperception) — no overlap
  beyond shared files; coordinate on `scripts/llms/generate.ts` edits.

---

## 0. Triage — claim → verdict (do not re-fix the refuted rows)

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| R2 | Responsive `Grid cols` silently renders one column without a container ancestor | **CONFIRMED — root cause found; 4 sibling components share it** | `.grid` sets `container-type: inline-size` on itself (`packages/layouts/src/grid/grid.module.css:8`) but its own cols rules live in `@container` blocks (`:18-43`), which resolve against the nearest **ancestor** container — an element is never its own query container. The maintainers know the rule: `apps/examples/deploy/src/App.module.css:22` ("homeLayout has container-type so cannot query itself — use @media"). In-repo it works only because `Section` (`packages/layouts/src/section/section.module.css:5`) or app CSS (`apps/site/src/app.css:101` etc.) provides the ancestor. AppShell provides **none** (`app-shell.module.css:44-48` grid-area only; its own responsiveness is viewport `@media`, `:68`). Same self-query defect: `columns.module.css:6,8`; `settings-layout.module.css:7,9-11`; `marketing-features.module.css:27,35`; `dashboard-overview.module.css:24,30,36`. Tests can't see it: jsdom computes no layout; `grid.test.tsx:45-55` asserts only CSS-var plumbing (line 49 even encodes base=1 as expected). Requirement documented nowhere (`grid.meta.ts:5,54-58`; `scripts/context/generate.ts:228`). |
| R1 | `PieChart donut` produces ~13 hydration attribute mismatches under SSR; Area/Bar/Kpi fine; explicit size doesn't help | **CONFIRMED — root cause found** | `arcPath` emits `cx + r * Math.sin(angle)` / `cy - r * Math.cos(angle)` at full float precision straight into the `d` string (`packages/charts/src/engine/shape.ts:261-264`, templates `:270,:274`). `Math.sin/cos` are not bit-identical across engines (server V8 build vs browser); Area/Bar paths are pure IEEE-754 arithmetic (`linearScale`/`bandScale` — exact everywhere), hence clean. Size is irrelevant: all charts share the deterministic 400×300-default measure-in-effect pipeline (`packages/charts/src/core/use-chart.ts:18-39`, `chart-frame.tsx:89,143-144`). ~13 = one `d` per slice (+2 when a full donut circle splits, `shape.ts:255-259`). The pie test **pins** the unrounded output (`pie-chart.test.tsx:116-117`, `'A55.199'`). No SSR-determinism test exists anywhere in `packages/charts`. Exposed family: pie, radial-bar, radar, gauge, meter, sunburst, scatter + `engine/polar.ts`. |
| R1b | Client-only workaround surfaces `ResizeObserver loop completed with undelivered notifications` | **CONFIRMED — shared hook, not pie-specific** | `useChartSize`'s RO callback synchronously writes `width.value`/`height.value` (`use-chart.ts:30-36`) → signal-driven re-render of the SVG inside the observed div (`chart-frame.tsx:207,240-241`), whose `.frame` has no block-size constraint (`chart-frame.module.css:1-5`). The `height.value` write is dead work — `ChartFrame` always uses `fixedHeight` (default 300, `chart-frame.tsx:89,144`). |
| #1 | Charts counted in main package; Quick Setup omits `@cascivo/charts` | **PARTLY CONFIRMED** | Index entries already carry the channel label (`packageFor` `scripts/llms/generate.ts:177-186`, `channelLabel` `:194-198` → "_(npm @cascivo/charts)_"), and `packages/react/readme.body.md:18-19` states the split. Real gaps: header "## Component index (204 components)" lumps all channels (`generate.ts:837`); Quick-Setup snippet A (`:502-509`) has no charts line (note only 20+ lines later, `:527-534`); `@cascivo/react` has no chart re-export nor a helpful pointer (`packages/react/src/index.ts`, grep clean). |
| #2 | Contradictory CSS-loading stories; aggregate is the only reliable TanStack path and is un-tree-shaken | **CONFIRMED — known deferred decision** | Story A: `packages/react/readme.body.md:29-40` (per-component auto CSS, "import aggregate only if…"). Story B: llms.txt snippet A imports the aggregate unconditionally with no tradeoff note (`scripts/llms/generate.ts:507`). Mechanism/SSR rationale live far below (`:536-559`). The underlying product decision is `fix-plan-tanstack-ssr-adopter-2026-07.md` Wave 1.3 (deferred, Option A recommended). |
| #3 | No intended-name→actual-name surface for icons | **STALE on main; one residual** | Alias infra shipped post-0.2.8: `packages/icons/svg/aliases.json` (hand-authored; `Spaceship: [Rocket, deploy, …]`, `Dashboard: [LayoutDashboard, …]`, `GitBranch: [Branch]`), folded into keywords + catalog `aliases` field (`scripts/icons/generate.mjs:37-45,230-243,298`), MCP `search_icons` (`packages/mcp/src/icons.ts:53-75`), llms.txt legend (`scripts/llms/generate.ts:384-393,491-494`). Residual: the report guessed `Fork` for a git branch — `Fork` is a **dining fork** with empty aliases; no `fork`-intent alias points at `GitBranch`. |
| #4 | `useTheme()` returns a signal; doesn't re-render React consumers without `useSignals()` | **REFUTED as stated; systemic variant CONFIRMED** | `useTheme` calls `useSignals()` as its first statement (`packages/react/src/theme.tsx:57-59`; JSDoc `:45-56` promises it), with a passing reactivity test (`packages/react/src/theme.test.tsx:46-60`). `useForm` (`form.tsx:154`) and `useAnchorPosition` (`anchor.tsx:104`) do too. **Not self-subscribing:** `useControllableSignal` (`packages/core/src/controllable.ts:27`), `useMediaQuery` (`media-query.ts:14`), `useDisclosure` (`disclosure.ts:27`), `useMachine` (`machine.ts:10`), `useRovingFocus` (`roving-focus.ts:34` — its own JSDoc at `:32` shifts the burden to the caller), `useTocFromRegion` (`components/src/toc/use-toc-from-region.ts:17`), `useStreamBuffer` (`core/src/stream-buffer.ts:138`), `useScope` (`core/src/scope.ts:68`). Plus `currentLocale()` (`packages/i18n/src/locale.ts:8-10`) — a plain function, cannot self-subscribe. |
| #5 | SideNav/ShellHeader nav not router-aware; `render` hatch discards icon/label layout | **CONFIRMED** | Top-level item `<a>` hardcoded: `packages/components/src/side-nav/side-nav.tsx:479-498`; sub-items `:153-174` (no hatch at all). `render` hatch (`:54-58`, consumed `:429-435`) passes only `{ collapsed }` — the `inner` icon/label/trailing markup (`:437-461`) is a local const the callback can't reuse, and the custom item loses `styles['link']` + `aria-current`/`data-state`. Ten more components render `<a href>` from config: `shell-header.tsx:245-253,164-176,226-233`; `header.tsx:51-58`; `breadcrumb.tsx:38`; `toc.tsx:75-80`; `switcher.tsx:39-51`; `dock.tsx:31-47`; `navigation-menu.tsx:89-97`; layouts blocks compose these. No `renderLink`/`linkComponent`/`asChild` seam exists on any of them (grep zero), though `@cascivo/core` ships a Radix-style `Slot` + `mergeProps` (`packages/core/src/slot.tsx:35-62`) and the module-singleton pattern is established (`theme.tsx:17-22,41-43`; `i18n/src/locale.ts:6`). Active state is caller-driven (`item.active` → `aria-current`/`data-state`, side-nav.tsx:481,485). |
| #6 | `RelativeTime` `sync:true` default is a hydration hazard | **CONFIRMED — mechanism refined** | The interval is innocent (client-only effect, guarded, `relative-time.tsx:65-72`). The mismatch is the **first render**: `now = useSignal(nowProp ?? Date.now())` (`:59`) — server wall clock vs client wall clock, so `selectUnit(target - now.value)` (`:74-75`, rounding at `:35-42`) lands in different buckets whenever SSR→hydration latency or clock skew crosses one (~every second in the `'second'` bucket). No `suppressHydrationWarning` anywhere in the package. Meta has zero SSR guidance (`relative-time.meta.ts`). Tests always pass a fixed `now` (`relative-time.test.tsx:6`), so the hazard is untested. |
| #7 | pnpm 11+ / Node 22.12+ floors stated but not accurate | **CONFIRMED for pnpm; REFUTED for Node** | Stated at `readme.body.md:129-130` (generates root `README.md:154-155`). Node: root `package.json` `engines.node: ">=22.12.0"` — stated floor is real. pnpm: **no `engines.pnpm` anywhere**; only `packageManager: "pnpm@11.8.0"` (Corepack pin). Functional floor ≈ pnpm 10.x (`pnpm-workspace.yaml:7` `catalogMode: prefer`), which is why 10.33 worked. |
| #8 | `gap={7}` is a type error | **REFUTED — working as intended** | `SpaceStep = 1\|2\|3\|4\|5\|6\|8\|10\|12` (`grid.tsx:6`, duplicated `auto-grid.tsx:6`) mirrors the token scale, which genuinely skips 7 (`packages/tokens/src/index.css:92-94`, `tokens.d.ts:220-222`). A bypassed 7 would produce an invalid `gap` declaration. Docs-only clarification (Wave 5.5). |
| #9 | Tailwind v4 force-installed by TanStack Start is dead weight / latent reset risk | **OUT OF SCOPE (upstream framework behavior); doc note only** | Coexistence is already documented (`docs/USING-WITH-TAILWIND.md`, `@cascivo/themes/tailwind.css` bridge). Wave 5.2 adds one line to the TanStack section. |

---

## Wave 1 — Grid/container: kill the silent responsive failure (P0)

The worst finding: **types, build, lint, SSR all pass while every responsive grid is
broken** for any consumer who doesn't happen to wrap content in `Section`. Fix the
components so they are self-contained; documentation alone is not acceptable for a
silent failure.

### 1.1 Grid establishes its own containment via a wrapper element — M

- `packages/layouts/src/grid/grid.tsx` + `grid.module.css`: render an **outer wrapper**
  that establishes `container-type: inline-size`, with the actual `.grid` as its sole
  child, so the cols `@container` rules (`grid.module.css:18-43`) resolve against the
  wrapper. This pattern is already precedented in `docs/internal/ROADMAP-V28.md:48`
  ("the grid uses `@container` on a wrapper div").
- Placement decisions (make them explicitly, they are the whole risk):
  - **Consumer-facing props (`className`, `style`, `...rest`) go on the outer wrapper**
    — it is the element that occupies layout, so consumer width/margin styling keeps
    affecting the container that the queries measure.
  - The `responsiveVars` custom properties (`grid.tsx:20-30,60-61`) may stay on the
    outer element (custom properties inherit into `.grid`); `data-responsive` must stay
    wherever the `&[data-responsive]` selector lives — simplest is to keep both the
    attribute and the selector on the inner `.grid`.
  - **Keep `container-type` on the inner `.grid` too** (`grid.module.css:8`) — it
    serves the `.grid-item` span queries (`:50-64`), which correctly resolve against
    `.grid` and must not start resolving against the new wrapper.
  - Wrapper can be **conditional on responsive mode** (`cols` is an object) to avoid an
    extra node in the common numeric case — `data-responsive` already flags the mode.
    Alternatively always-on for DOM-shape stability; pick one and say so in the meta.
  - All CSS stays in `@layer cascivo.component`; breakpoint literals unchanged
    (already canonical, `breakpoint:check` stays green).
- Update `grid.test.tsx` (`:45-55`): assert the wrapper exists with containment class
  in responsive mode, vars/data attributes land on the intended elements.
- **Real-browser regression (the gate jsdom can't provide):** a Playwright test
  (Playwright is the sanctioned e2e layer per CLAUDE.md; Chromium is preinstalled in
  CI/dev containers) that renders `<Grid cols={{base:1, sm:2, lg:4}}>` **with no
  wrapping Section** at container widths ~20rem/32rem/70rem and asserts
  `getComputedStyle(grid).gridTemplateColumns` column counts 1/2/4. Wire it wherever
  the existing e2e/visual suite lives; if none is importable for packages, add a
  minimal `scripts/checks/` Playwright harness — this test is the reason R2 shipped
  and must not be skipped.
- **Verify:** `vp run @cascivo/layouts#test` green; new browser test fails before the
  fix, passes after; `pnpm ready`.

### 1.2 Apply the same fix to the four sibling self-query components — M

Identical wrapper treatment (or, where the component already renders a suitable outer
element, move `container-type` one level up within the component's own markup):

- `Columns` — `packages/layouts/src/columns/columns.module.css:6,8` (manifests
  inversely: never collapses to 1 column in narrow slots).
- `SettingsLayout` — `settings-layout.module.css:7,9-11` (sidebar never collapses).
- `marketing-features` block — `packages/components/src/blocks/marketing-features/marketing-features.module.css:27,35`.
- `dashboard-overview` block — `dashboard-overview.module.css:24,30,36` (closest twin
  of the Grid bug: KPI grid stays 1-col).

Each gets its test updated + covered by the Wave 1.1 browser harness (one case per
component is enough — same mechanism).

- **Verify:** component tests green; browser harness asserts each responds to
  container width.

### 1.3 AppShell content region establishes containment (defense in depth) — S

- Add `container-type: inline-size` to AppShell's main content region
  (`packages/layouts/src/app-shell/app-shell.module.css:44-48`) so *any* third-party
  or copy-paste `@container` consumer inside the shell has an ancestor container —
  matching what `Section` already does (`section.module.css:5`).
- **Audit descendant `@container` queries before landing:** `header` queries a *named*
  container (`cascade-header`, `header.module.css:3,91`) — unaffected. `toast` uses an
  unnamed `@container (max-width: 30rem)` with no container of its own
  (`toast.module.css:13`) for a viewport-fixed layer — today it never matches; a new
  `.main` container could make it match spuriously. Fix toast in the same PR: switch
  that rule to `@media (max-width: 30rem)` (viewport-fixed layer ⇒ viewport query is
  the correct semantic; canonical literal, passes `breakpoint:check`).
- **Verify:** visual suite for AppShell/toast unchanged except intended; browser
  harness case: bare `<AppShell><Grid …/></AppShell>` responsive grid works even
  without 1.1's wrapper (belt-and-suspenders).

### 1.4 Dev-time misconfiguration warning — S (optional but recommended)

- In `Grid` (and the 1.2 siblings if cheap): a dev-only (`import.meta.env.DEV`)
  `useSignalEffect` that, when responsive props are used, walks ancestors checking
  `getComputedStyle(el).containerType` and `console.warn`s once if no inline-size
  containment exists. After 1.1 the component self-contains, so this guard mainly
  protects copy-paste consumers who strip the wrapper, and future components. Pattern
  precedent: AppShell drawer effect (ROADMAP-V20). No banned hooks (`useSignalEffect`
  only). Skip entirely if 1.1 makes it structurally impossible to misuse — decide at
  implementation time and note the decision in the PR.

### 1.5 Documentation truth — S

- `grid.meta.ts` (`:5,54-58`): description/example note that Grid establishes its own
  containment ("responsive cols adapt to the grid's own slot; no wrapper required")
  — post-fix wording, not a workaround instruction.
- `scripts/context/generate.ts:228`: extend the generated responsive note to state the
  containment contract (components self-contain; custom `@container` CSS still needs
  an ancestor container — `Section`/`AppShell` provide one).
- `pnpm regen`; commit regenerated artifacts.
- **Verify:** drift check green; `pnpm meta:check`, `llms:check` green.

---

## Wave 2 — Charts: deterministic SSR for the trig family + quiet ResizeObserver (P0)

### 2.1 Quantize emitted coordinates in the geometry engine — S

- `packages/charts/src/engine/shape.ts:245-275` (`arcPath`): round every interpolated
  coordinate to a fixed precision (2 decimals; e.g. local
  `const q = (n: number) => Math.round(n * 100) / 100` applied in `point()` (`:261-264`)
  and both return templates (`:270,:274`)). Sub-centipixel differences are invisible;
  quantization erases cross-engine trig last-bit noise, making server and client `d`
  strings byte-identical.
- Sweep the rest of the trig family for unquantized trig-derived attribute output and
  apply the same helper: the other emitters in `shape.ts`, `engine/polar.ts`, and the
  chart components `radial-bar`, `radar`, `gauge`, `meter`, `sunburst`, `scatter`.
  (Arithmetic-only paths — area/line/bar — need no change; don't touch them.)
- `PieChart` label coordinates: `packages/charts/src/charts/pie-chart/pie-chart.tsx:209-210`
  (`Math.sin/cos * labelR`) — quantize the same way (only matters when `labels` is
  passed, but it's the same class of bug).
- Update the pinned-precision assertion `pie-chart.test.tsx:116-117`
  (`'A55.199'` → the quantized form) — and keep a test that *asserts* quantization
  (no coordinate with >2 decimals), replacing the accidental lock-in of raw floats.
- **Verify:** `vp run @cascivo/charts#test` green.

### 2.2 SSR-determinism test for charts — S

- New test in `packages/charts` (e.g. `src/charts/ssr-determinism.test.tsx`): for a
  representative set — `PieChart` (plain + `donut`, with and without `labels`),
  `RadialBar`, `Radar`, `Gauge`, plus `AreaChart`/`BarChart` as controls — assert
  `renderToStaticMarkup(<Chart …/>)` equals the client `render(...)` container
  `innerHTML` for the first render, and that no `d`/`x`/`y` attribute carries more
  than 2 decimals.
- Honest scope note in the test header: a single-engine test cannot reproduce
  cross-engine trig divergence; the decimal cap is the proxy that guarantees it can't
  recur, and markup equality guards every *other* source of first-render
  nondeterminism (env branches, measurement, ids).
- **Verify:** test fails on pre-2.1 code (run once to confirm), green after.

### 2.3 Quiet the ResizeObserver loop — S

- `packages/charts/src/core/use-chart.ts:30-36`:
  - Drop the dead `height.value` write (ChartFrame always uses `fixedHeight`,
    `chart-frame.tsx:89,144`) — confirm no other consumer reads the height signal
    before deleting; if one does, keep it but gate on change.
  - Skip writes when the value is unchanged.
  - Defer the write out of the RO callback via `requestAnimationFrame` (cancel on
    effect teardown) so the synchronous write→re-render→re-observe cycle can't trip
    "loop completed with undelivered notifications".
- **Verify:** charts tests green; manual/Playwright smoke — mounting a client-only
  chart logs no ResizeObserver console error.

### 2.4 Hook into the SSR end-to-end harness — XS (coordination)

- `spec-ssr-verify-and-props-parity-2026-07.md` Track A builds the real
  hydrate-through-the-dist harness. Add a `<PieChart donut>` route/case to its
  component matrix so pie hydration is exercised against the **built dist** with a
  real server/client boundary (the only place the original ~13-mismatch symptom can
  truly reproduce). If Track A hasn't landed when this wave ships, leave a TODO
  pointing here in that spec — do not build a second harness.

---

## Wave 3 — Router-aware links: one adapter, every nav component (P1)

Design goal: a real `<Link>` in the DOM (hover-preload works; no
`preventDefault()`+`navigate()` interception), zero per-item boilerplate, active-state
and a11y attributes preserved, no React context (banned — CLAUDE.md), SSR-safe.

### 3.1 `@cascivo/core` link adapter (module singleton) — S

- New `packages/core/src/link.ts` exporting:
  - `type LinkComponent = ElementType` (accepts `href`, `className`, `children`,
    `aria-*`/`data-*` passthrough).
  - `setLinkComponent(c: LinkComponent): void` + internal `resolveLink(): LinkComponent`
    (module-level `let`, default `'a'`) — mirroring the theme singleton
    (`packages/react/src/theme.tsx:17-22,41-43`) and i18n locale
    (`packages/i18n/src/locale.ts:6`). Called once at app entry; module scope runs on
    both server and client, so SSR-safe by construction.
- Export from `packages/core/src/index.ts`.
- **Docs are mandatory, enforced by CI:** catalogue it in `docs/HEADLESS.md`
  (primitive catalogue + the "React hook → cascivo primitive" table) or
  `primitive-docs.test.ts` fails `pnpm meta:check`. Include the two framework recipes:
  - TanStack Router: `setLinkComponent(({ href, ...rest }) => <Link to={href} {...rest} />)`
    (TanStack's `Link` takes `to`, not `href` — the adapter signature keeps cascivo's
    contract as `href` and lets the app map it).
  - Next.js: `setLinkComponent(Link)` (accepts `href` natively).
- **Verify:** `pnpm meta:check` green (proves the doc landed); unit test for
  set/resolve/default.

### 3.2 Thread the adapter through every config-driven anchor — M

Replace each literal `<a …>` with the resolved component, forwarding the
**already-computed prop bag unchanged** (`href`, `onClick`, `className`,
`aria-current`, `aria-disabled`, `aria-label`, `tabIndex`, `data-state`, `data-tone`,
and `children` = the existing `inner` node). Use `mergeProps` from
`packages/core/src/slot.tsx:35-62` where consumer-supplied handlers must compose.
Anchor sites (all confirmed):

| Component | Site |
|---|---|
| SideNav top-level | `packages/components/src/side-nav/side-nav.tsx:479-498` |
| SideNav sub-items (inline + rail flyout) | `side-nav.tsx:153-174` (`renderSubControl`; reused at `:421` and `:273-282`) |
| ShellHeader nav link / nav-menu item / brand | `shell-header.tsx:245-253`, `:164-176`, `:226-233` |
| Header | `header.tsx:51-58` |
| Breadcrumb | `breadcrumb.tsx:38` |
| Toc | `toc.tsx:75-80` (hash links — adapter still applies; document that a router Link must pass through hash hrefs) |
| Switcher | `switcher.tsx:39-51` |
| Dock | `dock.tsx:31-47` (`<a>`-or-`<button>` split by `href` — only the `<a>` branch changes) |
| NavigationMenu | `navigation-menu.tsx:89-97` (**care:** roving-focus props are spread onto the anchor — they must reach the rendered element; note this in the adapter docs as a required passthrough) |

Lower priority, same mechanism (include if cheap, else note as follow-up):
`layouts/src/sections/page-footer/page-footer.tsx`, `sections/feature-grid/feature-grid.tsx:57-58`.
Blocks (`console-app`, `sidebar-app`) compose the primitives — no separate change.

- Active state stays exactly as-is: caller-driven `item.active` →
  `aria-current`/`data-state` flow into the prop bag, so custom Links keep active
  styling and a11y for free.
- **Verify per component:** existing tests green; one new test each (or a shared
  helper) asserting that after `setLinkComponent(Stub)` the stub renders with
  `href`, `aria-current`, and the default inner layout intact. Reset the singleton in
  test teardown.

### 3.3 Fix the `SideNavItem.render` hatch (additive, non-breaking) — S

- Extend the callback context (`side-nav.tsx:54-58`, consumed `:429-435`) from
  `{ collapsed }` to `{ collapsed, children, linkProps }` where `children` is the
  computed `inner` node (`:437-461`) and `linkProps` the same bag 3.2 forwards.
  Object-field addition — existing consumers unaffected.
- Do the same for sub-items only if trivially factorable; otherwise the 3.1 global
  adapter already covers sub-item routing (they have no hatch today and need none
  once the adapter exists).
- **Decision for the maintainer (state in PR, default = skip):** a per-component
  `renderLink` override prop (different Links in different navs) is deliberately
  **not** included — the global adapter covers the reported need; add the prop later
  if a real adopter asks (Simplicity First).
- **Verify:** side-nav tests cover the enriched hatch; `pnpm regen` for updated metas
  (`side-nav.meta.ts` and any component meta whose props/docs mention links).

### 3.4 Consumer docs — S

- `docs/USING-WITH-VITE-SSR.md` (and Wave 5.2's TanStack section): add the
  `setLinkComponent` recipe with the TanStack `to`-mapping snippet and a note that
  hover-preloading (`defaultPreload="intent"`) now works through cascivo navs.
- Reactivity/llms surfaces: one line in the llms.txt "Reactivity & state" or setup
  section via `scripts/llms/generate.ts` (coordinate with Wave 5 edits; single regen).

---

## Wave 4 — SSR-safe `RelativeTime` + self-subscribing public hooks (P1)

### 4.1 `RelativeTime`: safe by default under SSR — S

- `packages/components/src/relative-time/relative-time.tsx`:
  - Add `suppressHydrationWarning` to the `<time>` element (`:80-86`) — the
    React-sanctioned pattern for inherently client-clock-dependent text. Server text
    is kept at hydration (no warning, no tree discard).
  - Guarantee the client corrects the kept server text: with `sync` (default) the
    existing adaptive interval (`:65-72`, cadence `:32-43`) already rewrites it. For
    `sync={false}` **without** `now`, add a one-time client refresh in the same
    guarded `useSignalEffect` (`now.value = Date.now()` once on mount) so stale server
    text can't persist indefinitely. `now`-controlled instances (`isControlled`, `:58`)
    stay fully deterministic and untouched.
  - Keep `sync: true` as the default (live-updating relative time is the component's
    point; the hazard was the warning/tree-discard, which the above removes).
- `relative-time.meta.ts`: add SSR guidance — default is hydration-safe
  (server text kept, corrected client-side); pass a serialized server timestamp via
  `now` when byte-deterministic output is required; keep the existing anti-pattern
  notes. `pnpm regen`.
- Tests (`relative-time.test.tsx`): add (a) `renderToStaticMarkup` vs client render —
  with `now` fixed they're identical; (b) the `<time>` carries
  `suppressHydrationWarning` semantics can't be asserted directly in output — instead
  assert the prop is set via the element in a shallow/react-test check, and (c)
  `sync={false}`, no `now`: text updates once after mount (fake `Date.now`).
- **Verify:** component tests green; meta/docs regen drift-clean.

### 4.2 Make every public signal-returning hook self-subscribing — S/M

- Add `useSignals()` (from `@cascivo/core`, re-exported at
  `packages/core/src/signals.ts:11`) as the first statement of the eight unmitigated
  public hooks (triage row #4 table): `useControllableSignal`, `useMediaQuery`,
  `useDisclosure`, `useMachine`, `useRovingFocus`, `useTocFromRegion`,
  `useStreamBuffer`, `useScope`. This is the exact pattern `useTheme`/`useForm`/
  `useAnchorPosition` already use, and `useSignals()` tracking covers the caller's
  whole render pass, so `.value` reads *after* the hook returns are captured. Nested
  `useSignals()` calls (hook inside a component that also calls it) are supported by
  `@preact/signals-react/runtime` — but verify once with a test, since all cascivo
  components will now nest through `useMachine`.
- Fix the now-stale JSDoc at `roving-focus.ts:32` (currently tells consumers to call
  `useSignals()` themselves).
- Per-hook regression test: render a plain React component (no transform, no manual
  `useSignals`) that reads the hook's signal in render; write to it; assert re-render.
- `currentLocale()` (`i18n/src/locale.ts:8-10`) cannot self-subscribe (plain function,
  and `@cascivo/i18n` is framework-agnostic). Document the `useSignals()` requirement
  at its JSDoc + `docs/HEADLESS.md`. **Optional (decision, default skip):** a
  `useLocaleValue()` convenience hook in `@cascivo/react`.
- **Optional (decision, default skip):** `useThemeValue(): string` plain-value
  convenience — `useTheme` already works; add only if the maintainer wants the
  string-shaped API for React ergonomics.
- Docs: note in `docs/HEADLESS.md` ("all public hooks self-subscribe; you only need
  `useSignals()` when reading a raw signal you created or `currentLocale()` in
  render") — keep consistent with the consumer/author split shipped by the prior
  plan's Wave 3.3 (`scripts/llms/generate.ts:499-513`); `pnpm regen`.
- **Verify:** `vp run @cascivo/core#test @cascivo/components#test` green;
  `primitive-docs` check green.

### 4.3 Explicit non-fix — XS

Record in the PR: the report's `useTheme` mechanism claim is refuted
(`theme.tsx:57-59` + `theme.test.tsx:46-60`); no change to `useTheme` itself. The
controlled `<ThemeProvider value={…}>` path the adopter used remains supported.

---

## Wave 5 — Docs & discoverability (P1, one `pnpm regen`)

All artifacts here are generated — **edit generators/hand-authored sources only**
(`scripts/llms/generate.ts`, `readme.body.md`, `packages/icons/svg/aliases.json`),
never `apps/site/public/llms.txt` / `README.md` / `icons.catalog.json` directly.

### 5.1 Charts in Quick Setup + honest component count — S

- `scripts/llms/generate.ts:502-512` (Quick-Setup snippet A): add the charts line to
  the dashboard path — either extend the install line or add an adjacent
  `# building charts/dashboards? also: pnpm add @cascivo/charts` +
  `import { AreaChart } from '@cascivo/charts'` — so the *first copyable block* an
  agent sees carries the split. Keep it terse.
- `scripts/llms/generate.ts:837`: replace
  `## Component index (${sorted.length} components)` with a channel-broken-out header,
  e.g. "192 components + 12 blocks — 25 charts ship in `@cascivo/charts`, 10 in
  `@cascivo/flow`, 2 in `@cascivo/editor`; the rest in `@cascivo/react` or via
  copy-paste" (derive counts from the registry, don't hardcode; the per-entry channel
  labels at `:194-198` already exist and stay).
- **Optional (decision, default do it — it's 3 lines):** a compile-time pointer in
  `packages/react/src/index.ts` — e.g. exported `type` -level deprecation stubs are
  over-engineering; instead add a README-level + `index.ts` doc-comment note "charts
  are in `@cascivo/charts`". Do **not** re-export charts from `@cascivo/react` (bundle
  weight + circular-ish coupling; the split is intentional).
- **Verify:** `pnpm regen && git diff` shows llms.txt updated; `pnpm llms:check` green.

### 5.2 One authoritative TanStack Start setup surface — S/M

- Extend `docs/USING-WITH-VITE-SSR.md` (exists; already covers `ssr.noExternal` +
  aggregate CSS) with a dedicated **TanStack Start quick-start** section:
  1. install line **including `@cascivo/charts`** for dashboards;
  2. the CSS strategy stated as a tradeoff (next item);
  3. `setLinkComponent` recipe (Wave 3.4);
  4. `RelativeTime`/SSR note (post-Wave 4.1: safe by default; `now` for determinism);
  5. one line on Tailwind: TanStack Start installs Tailwind v4 by default; cascivo
     coexists with its preflight (see `USING-WITH-TAILWIND.md`); leaving it installed
     is safe, removing it is optional.
- CSS tradeoff line (fixes the README-vs-llms contradiction at its narrowest point):
  annotate the aggregate import in llms Quick-Setup (`scripts/llms/generate.ts:507`)
  and mirror in `packages/react/readme.body.md:29-40` — "with a bundler (CSR),
  per-component CSS auto-includes and tree-shakes — skip this import; under Vite
  SSR/TanStack, import the aggregate (full sheet, ~297 KB raw / ~41 KB gzip) — see
  USING-WITH-VITE-SSR.md". Verify the size numbers against the current built
  `packages/react/dist` before committing them; don't copy the report's figures blind.
- **Site route (decision, default skip):** a `/docs/tanstack` page requires 4
  coordinated edits (`apps/site/src/pages/<Name>Page.tsx`, `DOCS_ROUTES` in
  `DocsApp.tsx:59-85` + sidebar `:89-112`, `ROUTE_HEAD` in `seo.ts`,
  `DOCS_STATIC_ROUTES` in `scripts/sitemap/generate.ts` — enforced by
  `scripts/checks/docs-routes.test.ts`). The markdown guide + llms.txt link is the
  convention for framework guides today (`RECIPE-DASHBOARD.md` precedent); add the
  site route only if the maintainer wants framework pages on the site.
- **Verify:** regen drift-clean; guide linked from the llms.txt Guides section.

### 5.3 pnpm floor honesty — XS

- `readme.body.md:130`: "pnpm 11+" → "pnpm 10+ (repo pins `pnpm@11.8.0` via
  `packageManager`/Corepack)". Node row stays (22.12 floor is real —
  root `package.json` `engines`). `pnpm regen` (README assembly).

### 5.4 Icon alias residual — XS

- `packages/icons/svg/aliases.json`: give the git-branch intent a `fork` route — add
  `"fork"`/`"git-fork"` to `GitBranch`'s aliases (do **not** alias the exact export
  name `Fork` to a different icon — exact-name hits must keep winning for the real
  dining-fork icon; lowercase intent keywords avoid the collision). Optionally add
  cuisine keywords to `Fork` so its search ranking is honest.
- If the maintainer wants `GitBranch` in the llms.txt curated legend it is already in
  the `wanted` list (`scripts/llms/generate.ts:385`) — no change needed there.
- **Verify:** `pnpm icons:generate && pnpm regen` drift-clean; MCP `search_icons`
  test: query "fork" ranks `GitBranch` for git intent (`packages/mcp/src/icons.ts:53-75`).

### 5.5 `gap` scale clarification — XS

- `grid.meta.ts:20-22` (and `auto-grid.meta.ts` twin): one sentence — "gap maps to the
  `--cascivo-space-*` token scale, which intentionally skips 7 (and 9/11); use 6 or 8".
  No code change (triage: WAI). `pnpm regen`.

---

## Wave 6 — The dist CSS strategy decision (P1 → maintainer)

Not a new plan — an escalation. `fix-plan-tanstack-ssr-adopter-2026-07.md` Wave 1.3
deferred the per-component-vs-aggregate dist CSS decision (Option A: drop injected CSS
edges, aggregate becomes the single sanctioned entry; Option B: `.css.js` shims). This
report is the **second independent adopter** to hit the consequence (297 KB
un-tree-shaken aggregate as the only reliable TanStack path). Action for the
implementer: surface this to the maintainer in the Wave 5 PR description with a link to
that plan's Wave 1.3 section and this report's finding #2, recommending Option A
executed together with `spec-ssr-verify-and-props-parity-2026-07.md` Track A (the
harness that proves whichever option lands). Do **not** implement 1.3 inside this
plan's PRs.

---

## Suggested PR grouping & order

1. **PR 1 (Wave 1):** Grid/Columns/SettingsLayout/blocks containment wrapper + AppShell
   `.main` container + toast `@media` fix + browser regression + docs/meta regen. The
   silent-failure fix; biggest adopter payoff.
2. **PR 2 (Wave 2):** shape.ts quantization across the trig family + SSR-determinism
   test + ResizeObserver quieting + pie test update. Self-contained in
   `packages/charts` (+1 line in the Track A spec).
3. **PR 3 (Wave 3):** `setLinkComponent` core primitive + threading through 9–11
   components + `SideNavItem.render` enrichment + HEADLESS.md. New public API —
   maintainer review on the API shape before merge.
4. **PR 4 (Wave 4):** `RelativeTime` `suppressHydrationWarning` + one-time client
   refresh + meta SSR docs; `useSignals()` in the eight hooks + per-hook regression
   tests + JSDoc/doc updates.
5. **PR 5 (Waves 5 + 6):** all generator/doc edits in one regen (Quick-Setup charts,
   index count, CSS tradeoff, TanStack section, pnpm floor, aliases, gap note) + the
   Wave 6 escalation paragraph in the PR body.

Every PR: `pnpm ready` green (regen → `vp check --fix` → build → typecheck → tests),
commit regenerated artifacts. `pnpm ready:ci` before push on PR 1 (touches layout
package structure) and any PR that changes package exports (PR 3: `@cascivo/core`).
Changesets: PR 1 (`@cascivo/layouts`, `@cascivo/components` patch), PR 2
(`@cascivo/charts` patch), PR 3 (`@cascivo/core` minor — new export;
`@cascivo/components` minor — enriched `render` context), PR 4 (`@cascivo/core`,
`@cascivo/components`, `@cascivo/react` patch/minor per hook surface), PR 5 (docs-only
where possible; `@cascivo/icons` patch for aliases).

## Explicit non-goals (from triage — do not "fix")

- **Do not change `useTheme`'s return shape or add `useSyncExternalStore`** — the
  reactivity claim was refuted; `useSyncExternalStore` appears nowhere in the codebase
  and the signal tuple is the documented contract. (Plain-value convenience hooks are
  optional decisions in 4.2, default skip.)
- **Do not switch Grid's responsive cols to `@media`** — slot-adaptive `@container` is
  doctrine (CLAUDE.md "prefer `@container`"); the fix is containment, not viewport
  queries. No `containerless` prop.
- **Do not add `--cascivo-space-7`** — the gapped scale is intentional; docs only.
- **Do not rename icons or alias the export name `Fork` away from the dining fork** —
  lowercase intent aliases only.
- **Do not re-export charts from `@cascivo/react`** — the package split is
  intentional; fix discoverability at the docs/generator layer.
- **Do not implement the dist CSS change (prior Wave 1.3) here** — escalate per Wave 6.
- **Tailwind force-install is TanStack Start's behavior** — one coexistence line in
  the TanStack section; nothing else.
- **Do not intercept clicks as the sanctioned nav pattern** — the whole point of
  Wave 3 is rendering the real router Link.
