# v6 Master Plan — Prove It (Benchmark Suite)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-11-v6-tranche-1.md` … `2026-06-11-v6-tranche-6.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Execute `docs/ROADMAP-V6.md` — a reproducible benchmark suite comparing cascade against
shadcn/ui and IBM Carbon on bundle size, runtime interaction latency, re-render counts,
Lighthouse metrics, and a11y, published as `BENCHMARKS.md` + docs page + methodology doc.

**Architecture:** New `apps/bench/` workspace family: three identical consumer apps
(`bench-app-cascade`, `bench-app-shadcn`, `bench-app-carbon`) implementing one shared scenario
protocol, plus a `bench-runner` package that builds/serves the apps and runs four measurement
suites (bundle, runtime, lighthouse, a11y) into one `results.json`, from which all published
artifacts are generated. Deterministic metrics (bundle, render counts, a11y) gate CI; timing
metrics come from a disclosed dedicated machine.

**Tech stack:** vp (vite+) + Vite/Rolldown builds, Playwright + CDP (tracing, CPU throttle),
React Profiler, `@lhci/cli`, `@axe-core/playwright`, `node:zlib` gzip, vitest for runner unit
tests. Competitor stacks: Tailwind v4 + shadcn components + Radix + TanStack Table;
`@carbon/react` + Sass.

---

## Research findings (ground truth for all tranches)

### Current state (verified 2026-06-11)

**Existing perf infra:**

- `apps/docs/test/perf.spec.ts` (31 lines): Playwright budgets on a 10k-row DataTable page
  (`/perf/data-table`, `apps/docs/src/pages/PerfDataTable.tsx`): initial <3000ms, sort <100ms,
  keystroke <50ms, scaled by `PERF_SCALE`. Runs in `.github/workflows/perf.yml` (PR-triggered on
  components/core/docs paths, ubuntu-latest, Node 22, `PERF_SCALE: 1`).
- `scripts/quality/bundle-check.ts`: enforces gzip budgets — `@cascade-ui/react` 50KB,
  `@cascade-ui/charts` 80KB. Wired as `audit:bundle` in root package.json, runs in CI `verify`.
- Playwright config pattern: `apps/docs/playwright.config.ts` — port 4173 via `vp preview`,
  animations disabled, 900×700.

**Measured sizes (local build, gzip):** `@cascade-ui/core` 1.67KB (4.8KB raw, zero runtime deps,
peers `react`/`react-dom`/`@preact/signals-react`). `@cascade-ui/react` 32.89KB JS
(135.2KB raw, single flat `index.js`) + 134.7KB raw `cascade.css`; runtime deps
`@cascade-ui/core` + `@cascade-ui/i18n`. **No `sideEffects` field in any package.json** —
treeshaking of the flat dist is unverified and likely broken (top-level i18n catalogs/signals).

**DataTable** (`packages/components/src/data-table/data-table.tsx`, 513 lines): no
virtualization; pagination slice + CSS `content-visibility: auto` with `contain-intrinsic-size`
on rows; 9 signals (`rowsSignal`, `sortSignal`, `selectedSignal`, `querySignal`, `pageSignal`…),
computed chain `entries → filtered → sorted → paged`, `batch()` for multi-signal writes.
Re-render contract from v2: ≤1 table-body re-render per interaction.

**Registry:** 97 components. **Workspace:** `pnpm-workspace.yaml` globs `packages/*`, `apps/*`,
`apps/examples/*` — `apps/bench/*` must be added. Node >=22.12. Catalog (key):
react 19.2.7, `@preact/signals-react` 3, `@playwright/test` 1.60.0, vite-plus 0.1.24,
vitest = vite-plus fork. `apps/examples/react-vite` and `react-next` are placeholder shells
(echo scripts) — not usable as benchmark hosts.

**Perf claims published today:** landing Hero says "quality, performance, or developer
experience" — no numbers anywhere.

### External research (2026 state of the art)

**Methodology (krausest/js-framework-benchmark):** table app, ops = create 1k (cold), replace
1k (5 warmups), partial update every 10th of 10k (5 warmups), select row (5 warmups), swap rows,
remove row, create 10k (cold), append, clear. Measures **event start → paint end from Chrome
trace events via CDP**, never JS timers. Per-benchmark CPU throttle factors; results = mean ±
stddev with significance coloring; overall = weighted geometric mean. Rules: DOM structure
parity, no virtual scrolling, keyed/non-keyed declared.

**Bundle:** convention is **min+gzip** (Bundlephobia reports gzip; quoting brotli against a
competitor's gzip is a documented dark pattern — thoughtspile "bundle size lies"). size-limit
(esbuild-based) measures *import cost to consumer*; `preactjs/compressed-size-action` and
`andresz1/size-limit-action` are the CI patterns. agadoo proves treeshakeability (bundle a bare
import, expect ~empty). For copy-paste vs npm comparisons, the only defensible method is
**identical consumer apps measured whole** (the andreipfeiffer/css-in-js format: one directory
per library, exhaustive criteria, admits trade-offs).

**Re-render counting:** React `<Profiler>` `onRender` commit counts — deterministic integers;
no-op in production builds, so counts run against dev builds (disclosed) while timings run
against production builds. react-scan `getReport()` is a good demo but deferred.

**Lighthouse:** `@lhci/cli` with `numberOfRuns: 5`, median aggregation (Google: median-of-5 ≈ 2×
more stable than single run). **INP cannot be measured in lab** — report TBT explicitly labeled
"lab INP proxy" plus scripted click→paint latency. Applied throttling beats simulated for
credibility; disclose exact settings.

**Statistics:** ≥10 samples for timing benchmarks; median + IQR (mean ± stddev secondary); 5
warmups for warm ops, none for cold ops, labeled; Mann-Whitney U for "X is faster" claims —
**no significance ⇒ report a tie** (publishing ties/losses is the single biggest credibility
booster). GitHub-hosted runners: ~45% false-alarm probability at 2% regression gates (CodSpeed
data) — headline timings must come from one dedicated machine with full hardware disclosure and
pinned lockfile.

**Competitors:**

- `@carbon/react` v1.109.0: 4.54MB unpacked, 1856 files, 17 runtime deps (`downshift`,
  `flatpickr`, `@floating-ui/react`, `classnames`, `prop-types`, `@ibm/telemetry-js`…), peer
  `sass` ^1.33. Styles via `@use '@carbon/react'` Sass — compile time and shipped CSS both
  measurable. Historical treeshaking issues (carbon#5980).
- shadcn/ui: base deps `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`,
  Tailwind v4. Dialog → `@radix-ui/react-dialog` ≈ 11.2KB min+gz with 14 transitive deps;
  data-table → `@tanstack/react-table` v8 ≈ 10–15KB gz. Tailwind v4 production CSS is small
  (<10KB gz typical) — **do not pick a CSS-size fight with Tailwind**; the honest comparison is
  JS-per-interactive-component and re-render behavior.
- Published bundle landscape (Makers' Den 2025): shadcn-style apps ~35–50KB, Mantine ~80–120KB,
  MUI ~120–180KB gz. No published shadcn-vs-Carbon runtime comparison exists.

**Signals caution (Electric UI benchmark):** `@preact/signals-react` (the React adapter, which
patches React internals) measured *slower* than plain `useState` in micro-benchmarks. Defensible
claims: deterministic re-render counts and measured click→paint of real components. Forbidden
claim: "signals make React N× faster".

**a11y:** axe-core detects ~57% of WCAG issues by Deque's own figure (20–40% per independent
assessments). Comparative *scoring* invites attack — especially vs Carbon, IBM's a11y flagship.
Frame: zero-violations parity gate for cascade; competitor numbers as context only.

---

## Decisions

| #   | Decision                                                                                                                                                                                                  | Rationale                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | New workspace family `apps/bench/{runner,app-cascade,app-shadcn,app-carbon}` (private packages `bench-runner`, `bench-app-*`); add `apps/bench/*` to pnpm-workspace.yaml                                  | Isolates competitor deps (tailwind, carbon, sass, radix) from library packages             |
| 2   | One shared protocol (`apps/bench/PROTOCOL.md`): routes `/table` `/form` `/dialog`, `data-bench="<op>"` controls, `data-bench-root` containers, `body[data-bench-ready]` mount flag, all rows in DOM       | Apples-to-apples; conformance is testable (one Playwright spec runs against all 3 apps)    |
| 3   | Idiomatic usage per library: cascade = signals + DataTable; shadcn = useState + TanStack Table + Radix; Carbon = useState + Carbon DataTable. Each app mirrors the library's own docs examples            | "Real user code" is the only strawman-proof framing; disclosed in METHODOLOGY.md           |
| 4   | 8 runtime scenarios: create-1k (cold), create-10k (cold), update-every-10th (warm), select-row (warm), clear (warm), open-dialog (warm), type-20-chars (warm), toggle-50-checkboxes (warm)                | krausest core ops adapted to component-library reality + the three signal-showcase ops     |
| 5   | Timing = CDP trace parse (first matching `EventDispatch` → last `Paint`/`Commit` end), 4× `Emulation.setCPUThrottlingRate`, 5 warmups for warm ops, 12 samples, median + p25/p75, Mann-Whitney U vs cascade; p ≥ 0.05 ⇒ tie | js-framework-benchmark standard; ties reported honestly                                    |
| 6   | Re-render counts = `<Profiler onRender>` root-commit counters (`window.__commits`) read per scenario **against dev builds**, disclosed; timings always against production builds                          | Profiler is a prod no-op; counts are deterministic so dev mode doesn't taint them          |
| 7   | Bundle = build each app with its own Vite prod config, gzip level 6 over dist `.js`/`.css` separately + combined; per-component incremental matrix = 8 single-component entries + empty baseline per app, incremental = entry − baseline | min+gzip convention; CSS reported separately because "CSS-native" invites the hidden-CSS attack |
| 8   | Fix `@cascade-ui/react` + `core` `sideEffects` (`["**/*.css"]` / `false`) and add `scripts/quality/treeshake-check.ts` gate (bare import <1KB gz; `import { Button }` < 40% of full bundle, threshold tuned to measured) | A benchmark suite that exposes our own broken treeshaking is worse than no suite           |
| 9   | Lighthouse via `@lhci/cli` `collect --numberOfRuns=5`, median run per app on `/table`; report FCP/LCP/TBT/transferred bytes; TBT labeled "lab INP proxy"; no INP claims                                   | LHCI default median aggregation; lab-INP claims are the canonical callout                  |
| 10  | a11y via `@axe-core/playwright` sweep over all 3 routes × 3 apps; **gate**: cascade 0 violations (CI-enforced); competitor counts reported as parity context with detection-ceiling disclaimer            | Decision 6 in roadmap — never a scoreboard vs Carbon                                       |
| 11  | One results artifact: `apps/bench/results/results.json` (schema in `runner/src/types.ts`) with `meta` block (cpu/cores/mem/os/chrome/node/lockfileHash/throttle/date). Generated reports: root `BENCHMARKS.md`, docs page, landing link | Single source of truth; metadata makes runs auditable                                      |
| 12  | Report generator renders every measured metric — zero filtering logic; ties/losses shown with the same prominence as wins                                                                                 | Roadmap decision 8; the credibility feature                                                |
| 13  | CI `bench.yml`: workflow_dispatch + weekly cron; enforces deterministic metrics only (bundle ±2%, a11y zero, render counts exact); timing suite runs as informational artifact; committed `results.json` timings must come from a local disclosed machine | Hosted-runner variance makes CI timing gates dishonest                                     |
| 14  | Competitor versions pinned exactly in each app's package.json (not catalog): react 19.2.7 everywhere, `@carbon/react` 1.109.x, tailwindcss 4.x, shadcn-emitted radix versions; shadcn components are committed source | Reproducibility; shadcn model is owned code anyway                                         |

## Tranche map

| Tranche | File                         | Contents                                                                                                                | Risk                                                  |
| ------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| T1      | `2026-06-11-v6-tranche-1.md` | Workspace + PROTOCOL.md + cascade app (3 routes) + runner skeleton (app registry, build/serve lifecycle, stats lib + tests, results schema) + protocol conformance spec | Medium (foundations; DataTable API fit)               |
| T2      | `2026-06-11-v6-tranche-2.md` | shadcn app + carbon app implementing the protocol; conformance green ×3                                                  | Medium (third-party toolchains: tailwind v4, sass)    |
| T3      | `2026-06-11-v6-tranche-3.md` | Bundle suite: whole-app sizes, component matrix, `sideEffects` fix + treeshake gate                                      | Medium (treeshake findings may force build change)    |
| T4      | `2026-06-11-v6-tranche-4.md` | Runtime suite: CDP trace measurement + parser tests, scenario runner, render-count suite                                 | High (trace parsing, throttle, flake control)         |
| T5      | `2026-06-11-v6-tranche-5.md` | Lighthouse suite + a11y parity sweep                                                                                     | Low                                                   |
| T6      | `2026-06-11-v6-tranche-6.md` | Report generator (BENCHMARKS.md), METHODOLOGY.md, docs page, landing link, bench.yml, first real run, DoD                | Low                                                   |

## Cross-cutting rules (every tranche)

1. **CLAUDE.md applies to library code only.** `bench-app-shadcn` / `bench-app-carbon` are
   *competitor consumer apps* — `useState`/`useEffect` there is the point (idiomatic usage).
   `bench-app-cascade` uses signals (idiomatic cascade). None of the bench apps are components —
   the component authoring rules don't bind them, but lint/format must still pass.
2. **Gate before committing** (from CLAUDE.md): `pnpm exec vp check` → `pnpm build` →
   `pnpm exec vp run -r check` → `pnpm test` → regenerate
   (`pnpm registry:generate && pnpm readme:generate && pnpm llms:generate`) →
   `pnpm exec vp check --fix` → `git diff --exit-code`. Bench apps must not break the root
   gate; if `vp run -r` picks up bench packages, their `check`/`test` scripts must exist and
   pass (even if trivial).
3. **Determinism:** all generated data uses the seeded PRNG in each app's `data.ts`
   (mulberry32, seed 42). No `Math.random()`, no `Date.now()` inside measured paths.
4. **No timing thresholds in CI.** Only bundle/a11y/render-count assertions may fail a workflow.
5. **Version pinning:** competitor deps pinned exact in app package.json; never `^`. Lockfile
   committed. `results.json#meta.lockfileHash` = sha256 of `pnpm-lock.yaml`.
6. **Branch**: create `feature/v6-bench` off `main` (after v5 merges) or off
   `feature/v5-design` if v5 is still in review — record which in the first commit message.
7. **Honesty invariants:** report generator renders all metrics (no win-filtering);
   gzip level 6 everywhere; production builds for timings; dev builds only for commit counts
   (disclosed in output).

## Edge cases / risks registry

1. **cascade DataTable API fit**: the protocol needs "all N rows in the DOM". DataTable
   paginates internally — T1 must re-verify its props (`packages/components/src/data-table/
data-table.tsx`) and set page size = row count (or the documented "no pagination" mode). If
   `content-visibility: auto` rows skew paint timings vs competitors, that's *the library
   shipping CSS* — keep it, disclose it in METHODOLOGY.md.
2. **shadcn CLI is interactive/network-dependent**: run `pnpm dlx shadcn@latest init` +
   `add` with non-interactive flags; if that fails in the sandbox, vendor the component sources
   from the shadcn registry (they're owned code by design). Either way the result is committed.
3. **Carbon + React 19**: `@carbon/react` 1.109 peers may lag React 19. If peer warnings
   appear, document them; if runtime breaks, pin the bench apps to the newest React both Carbon
   and cascade support and use that version in ALL three apps (parity beats novelty).
4. **Sass compile in vp/Vite**: needs `sass` (or `sass-embedded`) dev dep and modern-compiler
   API; Carbon docs require `includePaths: ['node_modules']` equivalents (`loadPaths`).
5. **Trace parsing flake**: traces can contain stray `EventDispatch` events. Scope parsing to
   events after an explicit `performance.mark`-injected trace event or take the *last* click
   dispatch before the paint cluster; 200ms quiet window before `stopTracing`. The parser ships
   with fixture-based unit tests (T4).
6. **Profiler counts in dev mode**: dev builds double-invoke render functions in StrictMode —
   bench apps must NOT wrap in `<StrictMode>` (all three, for parity).
7. **vp vs raw vite for bench apps**: bench apps follow the repo standard (`vp dev` /
   `vp build` / `vp preview`, vite.config.ts) — mirror `apps/landing` (the React+Vite app). If
   a third-party plugin (`@tailwindcss/vite`) misbehaves under vp 0.1.24, fall back to raw
   `vite` bin **for that app only** and note it in the app README.
8. **Oxfmt/oxlint over vendored shadcn code**: copied components get formatted by `vp check
--fix` — fine (owned code). If oxlint rules fire on vendored patterns, add file-scoped
   disables, never repo-wide rule changes.
9. **Lint baseline is 10 warnings** (pre-existing). Do not add an 11th — new code lints clean.
10. **`@cascade-ui/react` may not treeshake** (flat 135KB ESM + top-level i18n side effects).
    T3 measures first. If `import { Button }` ≈ full bundle, the fallback is shipping
    `preserveModules: true` in `packages/react/vite.config.ts` rollupOptions — a real build
    change with its own verification (exports map intact, docs/storybook/examples still build).
    Do not silently skip: the per-import number is a headline metric.
11. **Port collisions**: bench apps preview on 4181 (cascade), 4182 (shadcn), 4183 (carbon),
    `strictPort: true` — docs keeps 4173.
12. **10k-row create on a 4×-throttled CPU can exceed default Playwright timeouts** — scenario
    runner sets per-op timeout 60s.
13. **Lighthouse needs Chrome**: reuse Playwright's chromium via `CHROME_PATH` env when invoking
    lhci; CI installs `playwright install chromium` already (perf.yml pattern).
14. **Results drift**: `BENCHMARKS.md` is generated — regenerating with an unchanged
    results.json must be byte-identical (no timestamps injected at generation time; the date
    lives in results.json#meta).
