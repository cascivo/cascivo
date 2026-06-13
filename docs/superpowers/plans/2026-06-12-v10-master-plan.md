# v10 Master Plan — Proof Pages (A11y Page, Performance Page, Landing Upgrades, Catalog Gaps)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-12-v10-tranche-1.md` … `2026-06-12-v10-tranche-6.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Execute `docs/ROADMAP-V10.md` — give the landing app real pages at
`/accessibility` and `/performance` whose every number is generated from `registry.json`
and `apps/bench/results/results.json`, upgrade the home page with the strongest patterns
from chakra-ui.com and bulma.io (hero feature chips, stats band, proof-page teasers, footer
columns), and close the catalog gaps those libraries expose (batch A: copy-button, stat,
status, visually-hidden, skip-nav, progress-circle; batch B: heading, text, code,
blockquote, list, prose; 8 more queued to the factory backlog).

**Architecture:** No new packages. New components live in `packages/components/src/*`
(house anatomy: `.tsx` + `.module.css` + `.meta.ts` + `.test.tsx`, exported from
`packages/react`). The landing app gains a dependency-free pathname route map (extending
the existing `/og` pattern), two page components under `apps/landing/src/pages/`, and a
build-time virtual module (`virtual:bench`) defined in `apps/landing/vite.config.ts` that
imports `apps/bench/results/results.json`, strips raw sample arrays, and exposes a typed,
bundle-light view of the bench data to all pages.

**Tech stack:** unchanged — React 18+ landing (real React + `@preact/signals-react`, NOT
Preact — `useSignals()` rule applies), `@cascivo/charts` for all charts (already a
landing dependency; source-exported, no Vite alias needed), CSS with `--cascivo-*` tokens,
vitest + @testing-library/react, vp (vite+) toolchain.

---

## Research findings (ground truth for all tranches — verified 2026-06-12)

### Landing app today

- `apps/landing/src/App.tsx`: single page; the only routing is
  `window.location.pathname === '/og'` → `<OgCard />` (App.tsx:18). Section order: Header,
  Hero, Principles, RelayConsole, SignalsDemo, AgentLayer, ThemeDemo, QuickStart, CtaBand,
  Footer. `useSignalEffect(() => initReveal())` starts the v9 scroll-reveal observer.
- `sections/Header.tsx`: `ShellHeader` with `nav={[Components → /docs, Storybook →
/storybook, GitHub]}` and the theme-dot picker (calls `useSignals()` — house pattern).
- `sections/Hero.tsx`: Badge (`{componentCount}+ components · 5 themes · MIT` from
  `registry.components.length`), title, sub, two CTA Buttons, and an existing
  `<CopyCommand command="npx cascade add button" />` — the Chakra "install command in
  hero" pattern is already half-present; v10 adds the missing chips + stats band, not a
  second command.
- `sections/Footer.tsx`: flat link row (GitHub, Docs, Storybook, Benchmarks, llms.txt,
  registry.json) — upgrade target.
- `sections/CopyCommand.tsx`: app-local copy-pill (signal + `useSignals()` since v9).
  Batch A's `CopyButton` component generalizes this; the landing keeps `CopyCommand`
  (different anatomy: full-width pill vs. icon button) — do NOT rip it out in v10.
- Landing deps already include `@cascivo/charts`, `@cascivo/icons` (+ vite alias),
  `@cascivo/components`, `@cascivo/render`. Playwright + @axe-core/playwright run
  `test/a11y.spec.ts` (WCAG 2.1 AA tags, light/dark sweeps).

### Bench suite (the performance data source)

- Runner: `apps/bench/runner/src/` — `bundle.ts` (gzip sizes + per-component incremental
  matrix + treeshake), `runtime.ts` (trace-based click→paint, 8 scenarios), `renders.ts`
  (React Profiler commit counts), `lighthouse.ts` (FCP/LCP/TBT/transfer, 5 runs),
  `a11y.ts` (axe WCAG 2.1 AA, 4 app states). Three identical apps: cascade, shadcn,
  Carbon. Root script: `pnpm bench` → `pnpm --filter bench-runner bench all`.
- **`apps/bench/results/results.json` is a placeholder today** — only a `meta` block with
  `"cpu": "placeholder — run pnpm bench to populate"`. T1 must run the bench and commit
  real results, or every downstream chart renders nothing.
- Result shape (`apps/bench/runner/src/types.ts`): top-level keys `meta` (required) and
  optional `bundle { apps, matrix, treeshake }`, `runtime { [scenario]: { [lib]:
TimingStats, pVsCascade } }`, `renders`, `lighthouse`, `a11y { [lib]: { violations,
rules } }`. `TimingStats` includes a raw `samples: number[]` array — this is why the
  landing must NOT import results.json directly (bundle weight); the virtual module
  strips `samples`.
- Scenario ids: `create-1k`, `create-10k`, `update-every-10th`, `select-row`, `clear`,
  `open-dialog`, `type-20-chars`, `toggle-50-checkboxes`.
- Methodology: `apps/bench/METHODOLOGY.md` (CPU 4× throttle, pinned versions,
  Mann-Whitney U parity, axe ~57% detection ceiling disclosure). The docs app already
  imports the JSON relatively (`apps/docs/src/pages/Benchmarks.tsx:4`) — precedent for
  cross-app relative import.

### A11y raw material

- Every registry entry (106 total: 60 components, 16 charts, 14 layouts, 10 blocks, 6
  sections) carries `meta.accessibility = { role, wcag, keyboard[] }` — generated from
  each `component.meta.ts`.
- Existing proof points to assemble: landing axe suite (`apps/landing/test/a11y.spec.ts`),
  bench a11y parity gate (cascade CI fails on any violation), theme-parity vitest (v9),
  logical-properties/RTL rule, `prefers-reduced-motion` gates on all motion (v9),
  i18n-chrome rule, focus-visible styling across components.
- `Kbd` component exists (`packages/components/src/kbd/`) — renders keyboard keys in the
  matrix.

### House component anatomy (template for all 12 new components)

`packages/components/src/kbd/` is the smallest complete example: `kbd.tsx` ('use client',
`cn` from core, CSS module, typed props extending an HTML attributes interface),
`kbd.module.css` (tokens only), `kbd.meta.ts` (`ComponentMeta` from core), `kbd.test.tsx`.
Checklist per component (CLAUDE.md): no React state hooks; export from
`packages/react/src/index.ts`; chrome strings from `@cascivo/i18n` builtin catalog with
`labels` prop override; registry regen picks the component up via `pnpm registry:generate`.

### Competitive findings driving the design (from chakra-ui.com / bulma.io study)

- Chakra: a11y claim in hero + testimonials but **no per-component a11y docs in v3** →
  cascade's generated keyboard/ARIA matrix is a direct out-documenting move. **Zero
  performance claims** on their landing (Emotion runtime) → the performance page is an
  uncontested attack. Stats band (6.1M downloads / 40.4K stars / 7.8K Discord) → cascade's
  band uses honest build-time numbers instead. Skip Nav + Visually Hidden ship as
  components → batch A.
- Bulma: hero feature-chip list, 4-column value-prop band, show-don't-tell interactive
  demos, "No JavaScript required" positioning (no numbers anywhere) → cascade's analog is
  "no styling runtime, 1 commit per interaction" **with** numbers. Their "content" class
  (styles raw HTML) → `Prose`. Element/Component taxonomy and per-page token tables →
  already covered by cascade manifests/docs.

---

## Decisions

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Rationale                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | Routing: a `ROUTES` map in `App.tsx` keyed by `window.location.pathname` (`/`, `/accessibility`, `/performance`, `/og`), each entry = page component + document title. Plain `<a href>` navigation (full page loads). No router library, no history API                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Extends the proven `/og` pattern; landing pages don't need client-side nav                      |
| 2   | Deep-link support: a tiny inline Vite plugin in `apps/landing/vite.config.ts` copies `dist/index.html` → `dist/accessibility/index.html` + `dist/performance/index.html` on `closeBundle`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Host-agnostic; no rewrite-rule dependency; `/og` precedent shows SPA fallback isn't guaranteed  |
| 3   | Bench data via virtual module: `virtual:bench` resolved in the landing Vite config — reads `../bench/results/results.json` at build time, deletes every `TimingStats.samples` array, exports `{ meta, bundle?, runtime?, renders?, lighthouse?, a11y? }` + an ambient type in `apps/landing/src/types/bench.d.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Keeps multi-hundred-KB sample arrays out of the bundle of the page that brags about bundle size |
| 4   | Every bench-driven section guards its data (`if (!bench.bundle) return null` etc.). With placeholder results the proof pages render hero + methodology only — never fake numbers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Roadmap decision 1; placeholder state must stay shippable                                       |
| 5   | T1 runs `pnpm bench` on the dev machine and commits populated `results.json`; `meta` records provenance (cpu, throttle, lockfileHash, source: 'local'). If the bench cannot complete locally, STOP and escalate — downstream tranches assume real data                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | The entire performance page depends on it; honesty requires provenance                          |
| 6   | Batch A components + locked APIs — `copy-button` (inputs): `CopyButton { value: string; size?: 'sm'\|'md'; labels?: { copy?: string; copied?: string } }`, clipboard write + 2s revert, i18n keys `builtin.copyButton.copy/copied`; `stat` (display): `Stat { label: string; value: string\|number; delta?: string; trend?: 'up'\|'down'\|'flat'; helpText?: string }`; `status` (display): `Status { status?: 'success'\|'warning'\|'error'\|'info'\|'neutral'; pulse?: boolean; children }`; `visually-hidden` (display): `VisuallyHidden { children }`; `skip-nav` (navigation): `SkipNavLink { targetId?: string; labels?: { label?: string } }` + `SkipNavTarget { id?: string }`, default id `cascade-skip-target`, i18n key `builtin.skipNav.label`; `progress-circle` (feedback): `ProgressCircle { value: number; max?: number; size?: 'sm'\|'md'\|'lg'; showValue?: boolean; label?: string }` | One source of truth for names/props so T3–T5 dogfooding matches T2 reality                      |
| 7   | Batch B typography APIs — `Heading { level?: 1-6; size?: 'sm'\|'md'\|'lg'\|'xl'\|'2xl' }` (level = semantics, size = visual, decoupled); `Text { as?: 'p'\|'span'\|'div'; size?: 'sm'\|'md'\|'lg'; weight?: 'normal'\|'medium'\|'semibold'; muted?: boolean }`; `Code` (inline `<code>`); `Blockquote { cite?: string }`; `List { as?: 'ul'\|'ol'; marker?: 'disc'\|'decimal'\|'none' }` + `ListItem`; `Prose` (wrapper styling descendant h1–h6/p/ul/ol/code/blockquote/table/img)                                                                                                                                                                                                                                                                                                                                                                                                                      | First typography category in the catalog; all presentational — no signals, no FSMs              |
| 8   | A11y page sections (in order): hero (claim + topline `Stat`s: axe violations vs shadcn/Carbon, manifest coverage count, WCAG target), comparative axe `BarChart`, generated keyboard/ARIA matrix (filterable by category, keys as `Kbd`), engineering-practices grid (focus, reduced-motion, RTL/logical properties, i18n chrome, theme contrast tests), CI-gate section (the parity gate: build fails on any violation), CTA band (methodology + run-it-yourself)                                                                                                                                                                                                                                                                                                                                                                                                                                       | Assembles existing evidence; matrix out-documents Chakra v3                                     |
| 9   | The matrix filter is signal-driven (`useSignal` category filter + computed rows) and the a11y page itself mounts `SkipNavLink`/`SkipNavTarget` — the page about a11y dogfoods the a11y components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Show, don't tell, recursively                                                                   |
| 10  | Performance page sections (in order): hero (topline `Stat`s: total gzip vs competitors, re-renders for `type-20-chars`, p50 `create-1k` latency), bundle-size grouped `BarChart` (js/css gz per lib) + treeshake note, per-component incremental-cost `DataTable` from `bundle.matrix`, interaction-latency horizontal `BarChart`s per scenario (median; p25/p75 in a details table) with Mann-Whitney note, re-render `BarChart` (the signals story), Lighthouse `Stat` row + table, methodology section printing the full `meta` block + axe-ceiling/pinned-versions disclosures + link to METHODOLOGY.md                                                                                                                                                                                                                                                                                              | Charts dogfood `@cascivo/charts`; methodology beside numbers = honesty rule                     |
| 11  | Home upgrades: hero gains a feature-chip row (Badge-based: `@layer` CSS · signals · 5 themes · WCAG 2.1 AA · RTL · AI-native — final copy in T5); new `StatsBand` section after Principles (4+ `Stat`s: registry entries, total gzip, axe violations, commits-per-keystroke — all from registry/virtual:bench); new `ProofTeasers` section (two cards — a11y + performance — each one headline number + micro `plain` chart + link); footer becomes 3 link columns (Build / Proof / Machine) + note                                                                                                                                                                                                                                                                                                                                                                                                      | The Chakra/Bulma patterns worth stealing, with generated numbers instead of social proof        |
| 12  | Header nav grows to: Components (/docs), Accessibility (/accessibility), Performance (/performance), Storybook (/storybook), GitHub                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Proof pages must be reachable; ShellHeader nav is data-driven already                           |
| 13  | New landing sections that read signals call `useSignals()` first (CLAUDE.md rule; `audit:signals` grep gate must stay green)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | v9's bug class stays dead                                                                       |
| 14  | Landing axe suite extends to the new routes (light + dark each); new pages join the v9 reveal system (`data-reveal` on sections, hero excluded)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | New pages meet the same gates as the home page                                                  |
| 15  | Factory backlog gains 8 specs (tree-view, color-picker, carousel, timeline, data-list, collapsible, code-block, splitter) appended to `factory-backlog.json` with `status: 'pending'` (the factory's actual queued-entry convention — see `.claude/skills/factory/SKILL.md`), priorities after the existing max. The backlog already holds pending entries for some of these names (tree-view, collapsible, data-list, typography, copy-button) — T6 supersedes/removes the overlapping stale entries rather than duplicating them                                                                                                                                                                                                                                                                                                                                                                       | Catalog growth continues via the factory, not via roadmap scope creep                           |
| 16  | i18n: new builtin namespaces `copyButton` + `skipNav` added to the catalog in `packages/i18n` following the existing namespace pattern (verify shape in `packages/i18n/src` before writing). Typography components have no chrome strings (children only) — no i18n needed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | CLAUDE.md component-chrome rule; don't invent keys for content                                  |

## Tranche map

| Tranche | File                          | Contents                                                                                                                                        | Risk                                                                 |
| ------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| T1      | `2026-06-12-v10-tranche-1.md` | Route map + page stubs + titles, header nav, deep-link dist copies, `virtual:bench` module + types, run `pnpm bench` → commit real results.json | **High** (full bench run: 3 app builds + Chrome traces + Lighthouse) |
| T2      | `2026-06-12-v10-tranche-2.md` | Batch A: copy-button, stat, status, visually-hidden, skip-nav, progress-circle — tsx/css/meta/tests, i18n keys, react exports, registry regen   | Medium (6 components, 2 with i18n chrome)                            |
| T3      | `2026-06-12-v10-tranche-3.md` | `/accessibility` page: hero stats, axe comparison chart, manifest matrix + filter, practices grid, CI-gate section, axe suite extension         | Medium (data plumbing + filterable table)                            |
| T4      | `2026-06-12-v10-tranche-4.md` | `/performance` page: bundle/latency/renders/lighthouse charts, cost matrix table, methodology section, axe suite extension                      | Medium (chart data shaping; guards for absent sections)              |
| T5      | `2026-06-12-v10-tranche-5.md` | Home: hero chips, StatsBand, ProofTeasers, footer columns                                                                                       | Low                                                                  |
| T6      | `2026-06-12-v10-tranche-6.md` | Batch B typography (6 components), factory-backlog queue (8 specs), final gates + DoD walkthrough                                               | Low–medium (volume, not complexity)                                  |

Order rationale: T1 unblocks all data consumers; T2 before T3–T5 because the pages dogfood
batch A; T5 after T3/T4 because teasers link to pages that must exist; T6 last (independent
volume + the final gate).

## Cross-cutting rules (every tranche)

1. **Generated numbers only.** Any number a visitor sees on the new/changed surfaces comes
   from `registry.json` or `virtual:bench`. Hand-written numbers are a review-blocking
   defect.
2. **Guard absent bench sections** — every consumer null-checks its slice (decision 4).
3. **`useSignals()` first** in any React-app component reading `.value` during render;
   `pnpm audit:signals` must pass.
4. **Tokens only; logical properties only; reduced-motion gates all motion** (the v9 rules
   carry forward unchanged).
5. **i18n builtin catalog for component chrome**; landing page copy stays hardcoded
   (content, not chrome).
6. **Component checklist** (CLAUDE.md) for every new component: no React state hooks,
   manifest, tests, react export, registry regen.
7. **Gate before committing**: `pnpm exec vp check` → `pnpm build` → `pnpm exec vp run -r
check` → `pnpm test` → `pnpm registry:generate && pnpm readme:generate && pnpm
llms:generate` → `pnpm exec vp check --fix` → `git diff --exit-code`.
8. **Verify in production builds** (`vp build` + `vp preview`) — routing, virtual module,
   and dist copies are all build-path features; dev-only verification is insufficient.
9. **Surgical changes** — the home page has many v9 sections; touch only what each tranche
   names.

## Edge cases / risks registry

1. **The bench run is the long pole.** It builds three apps, drives Chrome traces, runs
   Lighthouse ×5×3 and axe ×4×3. Budget 30–60 min; prerequisites: Playwright Chromium
   installed, ports free. If any sub-suite fails, fix or rerun that sub-suite via the
   runner CLI (`apps/bench/runner/src/cli.ts` supports per-suite commands — verify with
   `pnpm --filter bench-runner bench --help`). Committing partial results is acceptable
   only if the missing slice's page section guard is verified to hide cleanly — and the
   DoD requires all five slices, so partial = escalate.
2. **Bench numbers will be machine-specific.** That's disclosed, not hidden: the
   methodology section prints `meta` verbatim. Do not round or prettify in the data layer;
   format at render time only.
3. **`virtual:bench` under vite+/Rolldown**: virtual-module plugins are standard Vite API
   (`resolveId`/`load`), but vp is alpha — if the virtual module misbehaves, fallback: a
   `scripts/` extractor that writes `apps/landing/src/data/bench-data.json` (gitignored)
   as a `vp build`/`vp dev` pre-step in the landing package scripts. Same trimmed shape,
   same ambient type.
4. **results.json size in the repo** (samples arrays make it several thousand lines) —
   fine for git, NOT fine for the bundle; the stripping in decision 3 is mandatory, and
   `pnpm audit:landing` (landing budget check) is the enforcement backstop.
5. **JSON import escaping the app root**: the docs app already imports
   `../../bench/results/results.json` with a comment warning about app-root escapes. The
   virtual module reads the file with `fs` inside the Vite config (node context), avoiding
   the import-root issue entirely.
6. **Axe on the new pages may find real violations** (charts are SVG-heavy; tables need
   scope/headers). Fix the components, don't filter the rules — the a11y page failing axe
   would be a credibility hole.
7. **Chart fallbacks**: `@cascivo/charts` components render a `<table>` fallback for
   screen readers — verify the perf-page charts pass meaningful `title`/`description`
   (they're part of the axe surface).
8. **`CopyButton` clipboard API**: `navigator.clipboard.writeText` needs a secure context;
   in tests, stub it (jsdom lacks it). Mirror however the landing's `CopyCommand` handles
   the revert timer (`setTimeout` in component — sanctioned, it's not a state hook).
9. **`SkipNavLink` must be the first focusable element** — on the a11y page it renders
   before `Header`. Its "visually hidden until focused" CSS is the component's whole
   point; test focus-reveal with `:focus-visible` styles and a keyboard-only assertion.
10. **Stat trend colors** must come from semantic tokens (`--cascivo-color-success` /
    `-destructive`) and pass contrast in all five themes — the theme-parity vitest
    guarantees token presence, not contrast; eyeball warm/flat/minimal.
11. **Heading level vs size decoupling**: default size must derive from level when `size`
    is absent (h2 ≠ h6 visually) — spell the mapping out in the tranche, it's the one
    subtle bit of batch B.
12. **Backlog priorities**: `factory-backlog.json` entries have `priority` numbers —
    append after the current max, don't renumber existing entries (the factory may be
    mid-queue).
13. **Registry/readme/llms drift**: 12 new components touch every generated artifact;
    run the full regen chain in T2 and T6 and commit the output, or the drift gate fails
    CI.
14. **`VisuallyHidden` name collision**: `@cascivo/core` already exports a
    `VisuallyHidden` helper that `packages/react/src/index.ts` re-exports. T2's catalog
    component takes over the react-surface export (core stays untouched); grep consumers
    before swapping.
15. **Route map + reveal interplay**: `initReveal()` runs once per page load from
    `App.tsx` — it queries `[data-reveal]` after the routed page renders, which holds for
    the static route map (no client-side nav). If a page ever renders content async,
    reveal must re-init — not a v10 case, noted for future routers.
