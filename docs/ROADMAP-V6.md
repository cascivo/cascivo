# cascade — Roadmap v6: Prove It

**Last updated:** 2026-06-11
**Status:** 📋 Planned
**Plan documents:** `docs/superpowers/plans/2026-06-11-v6-master-plan.md` + tranches 1–6

---

## Vision

v5 made cascade look the part. v6 makes the performance story **measurable, reproducible, and
publishable** — a benchmark suite that puts cascade side-by-side with shadcn/ui and IBM Carbon
(`@carbon/react`) on bundle size, runtime interaction latency, re-render counts, Lighthouse
metrics, and accessibility, with methodology rigorous enough to survive a Hacker News front page.

> Anyone must be able to clone the repo, run `pnpm bench`, and reproduce every number we publish.
> We publish ties and losses, not just wins. The methodology doc is as important as the results.

Research basis (2026-06-11): krausest/js-framework-benchmark methodology (CDP-trace click→paint,
warmups, throttling), size-limit/Bundlephobia conventions (min+gzip), Lighthouse CI median-of-5,
Electric UI's `@preact/signals-react` benchmark (caution: the React adapter is NOT faster than
`useState` in micro-benchmarks — our defensible claim is **re-render counts and click→paint
latency of real components**, never "signals make React N× faster"), andreipfeiffer/css-in-js
comparison format, axe-core's ~57% detection ceiling (a11y is a parity gate, not a scoreboard).
Full findings are embedded in the master plan.

## The diagnosis

Why current perf story doesn't convince anyone:

1. **Claims without numbers.** Tagline says "zero compromise on performance"; landing has no
   numbers. The only public evidence is an internal Playwright budget test
   (`apps/docs/test/perf.spec.ts`: 10k-row DataTable, 3s/100ms/50ms budgets) — self-referential,
   compares against nothing.
2. **No competitor baseline.** Nobody has published a credible shadcn-vs-Carbon-vs-anything
   runtime comparison. That's an opening — and it means we set the methodology bar.
3. **Bundle numbers exist but aren't comparative.** `audit:bundle` enforces 50KB gzip on
   `@cascade-ui/react`, but a consumer cares about *app cost*: what does the same page cost
   built with cascade vs shadcn vs Carbon?
4. **The re-render story is our strongest, least-told claim.** Signal-driven components commit
   ≤1 re-render per interaction; useState-world re-renders cascade through the tree. Re-render
   counts are deterministic integers — unimpeachable in a way timings never are. We don't
   measure them today.
5. **Treeshaking is unproven.** `@cascade-ui/react` ships no `sideEffects` field — bundlers
   likely can't drop unused components. A benchmark suite would surface this embarrassment;
   better we fix it first.

## Workstreams

| #   | Workstream             | Tranche | Summary                                                                                                                                                              |
| --- | ---------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Bench harness + protocol | T1    | `apps/bench/` workspace: shared scenario protocol (PROTOCOL.md), cascade reference app (table/form/dialog routes), runner skeleton (app lifecycle, stats lib, results schema), protocol conformance Playwright spec. |
| B   | Competitor apps        | T2      | `bench-app-shadcn` (Tailwind v4 + Radix + TanStack Table, components committed) and `bench-app-carbon` (`@carbon/react` + Sass) implementing the identical protocol. Pinned versions, idiomatic usage per library's own docs. |
| C   | Bundle suite           | T3      | Whole-app JS/CSS min+gzip per library; per-component incremental-cost matrix (app-with minus baseline); `sideEffects` fix + treeshake gate for `@cascade-ui/react`.   |
| D   | Runtime suite          | T4      | CDP-trace click→paint for 8 scenarios × 3 libraries, 4× CPU throttle, 12 samples, median+IQR, Mann-Whitney significance; React Profiler commit counts per scenario.   |
| E   | Lighthouse + a11y      | T5      | LHCI median-of-5 (FCP/LCP/TBT/transfer) per app; axe-core sweep — cascade gated at zero violations, competitors reported as parity context, never as a score.         |
| —   | Publish + CI + DoD     | T6      | `results.json` → `BENCHMARKS.md` + docs Benchmarks page + landing link + `METHODOLOGY.md`; `bench.yml` workflow (smoke on CI, headline numbers from a disclosed dedicated machine); DoD checklist. |

## Decisions baked in

1. **Identical consumer apps, not package-size comparisons.** A copy-paste library (shadcn) has
   no meaningful "package size"; Carbon's 4.5MB unpacked size isn't what ships. We build the
   same app three times — same bundler (Vite/Rolldown), same React, production mode — and
   measure what each one ships and how it behaves.
2. **Idiomatic usage per library, disclosed.** Each app uses the library's own documented
   patterns (cascade: signals + DataTable; shadcn: useState + TanStack Table; Carbon:
   useState + DataTable). We benchmark what a real user would write, not strawmen. DOM parity
   rules (all rows in the DOM, no virtualization) are in PROTOCOL.md.
3. **min+gzip (level 6), JS and CSS reported separately AND combined.** Hiding CSS cost is the
   first thing reviewers check on a "CSS-native" library. Brotli is a secondary column only.
4. **Timings from CDP traces (click→paint), never JS-side timers.** Captures style/layout/paint,
   the js-framework-benchmark standard. 4× CPU throttle, 5 warmups for warm ops, 12 samples,
   median + IQR, Mann-Whitney U; differences without significance are reported as ties.
5. **Re-render counts are the headline signals claim.** Exact Profiler commit integers per
   scenario ("typing 20 chars: cascade 0 root commits, shadcn 20"). We never claim
   "`@preact/signals-react` is faster than useState" in the abstract — published benchmarks
   contradict it and we don't need it.
6. **a11y is a parity gate, not a scoreboard.** Carbon is IBM's accessibility flagship; scoring
   a fight there is unwinnable and automated scores are known-misleading (~57% detection). We
   gate cascade at zero axe violations and present competitor numbers as context.
7. **Headline numbers come from one disclosed machine, not GitHub Actions.** Hosted runners have
   ~0.5–45% timing variance. CI runs the suite as a smoke test and enforces only deterministic
   metrics (bundle, a11y, render counts). `results.json` carries hardware/Chrome/lockfile
   metadata; CI-produced timings are never committed.
8. **Publish everything the suite measures.** The report generator has no filtering: every
   metric renders whether cascade wins, ties, or loses. At least one honest loss is a feature.

## Definition of Done

- [ ] `pnpm bench` builds all three apps and produces `apps/bench/results/results.json` +
      regenerated `BENCHMARKS.md` in one command on a clean checkout.
- [ ] Protocol conformance spec passes against all three apps (same routes, same
      `data-bench` controls, same row counts).
- [ ] Bundle table: whole-app JS gz / CSS gz / total per library + 8-component incremental
      matrix; numbers within ±2% across repeated builds.
- [ ] `@cascade-ui/react` ships `sideEffects` metadata; treeshake gate proves a bare import
      bundles to <1KB and `import { Button }` costs a fraction of the full bundle.
- [ ] Runtime table: 8 scenarios × 3 libraries with median + IQR from ≥12 samples at 4× CPU
      throttle; non-significant deltas (p ≥ 0.05) rendered as ties.
- [ ] Re-render count table: Profiler commit counts per scenario per library, deterministic
      across runs.
- [ ] Lighthouse table: median-of-5 FCP/LCP/TBT/transfer per app; TBT explicitly labeled as
      lab INP proxy.
- [ ] a11y: cascade app sweeps zero axe-core violations on all routes (CI-gated); competitor
      results shown as parity context with the detection-ceiling disclaimer.
- [ ] `BENCHMARKS.md`, `apps/bench/METHODOLOGY.md`, docs Benchmarks page, and a landing link
      exist; results include hardware/Chrome/lockfile metadata and at least one metric cascade
      does not win, rendered without spin.
- [ ] `.github/workflows/bench.yml` green: bundle + a11y + render-count assertions enforced,
      timing run informational artifact only.

## Deferred (do not re-litigate in v6)

- Next.js SSR/hydration comparison (examples apps are still placeholders; needs its own tranche
  when `apps/examples/react-next` is real).
- `react-scan` per-component render reports (Profiler commit counts suffice for v6).
- CodSpeed/bencher.dev continuous benchmarking service integration (revisit when the suite is
  stable and worth tracking per-PR).
- Per-export size badges on every docs component page (needs the export matrix productionized).
- MUI/Mantine/Chakra as additional comparison targets (methodology scales; add after v6 ships).
- Submitting a cascade implementation to krausest/js-framework-benchmark (it benchmarks
  frameworks, not component libraries; revisit if there's a components category).
