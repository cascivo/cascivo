# Benchmark Methodology

## What is compared and why

Three identical consumer apps are compared:

- **cascade** (`bench-app-cascade`, port 4181) — using `@cascivo/react` with Preact Signals for
  state (idiomatic cascade pattern per the component docs)
- **shadcn/ui** (`bench-app-shadcn`, port 4182) — using vendored shadcn/ui components with
  Tailwind v4, TanStack Table v8, and React `useState` (per ui.shadcn.com/docs/components/data-table)
- **Carbon** (`bench-app-carbon`, port 4183) — using `@carbon/react` 1.109.0 with Sass and React
  `useState` (per the Carbon Storybook DataTable examples)

All three apps use the **same React version** (19.2.7), **same bundler** (Vite / Rolldown via
vite-plus), **same minifier** (Rolldown built-in), and **pinned exact dependency versions**
(see each app's `package.json`). The shared scenario protocol is defined in `PROTOCOL.md`.

Source directories:

- `apps/bench/app-cascade/`
- `apps/bench/app-shadcn/`
- `apps/bench/app-carbon/`

No app uses `React.memo`, `useMemo`, or other memoization heroics unless the library's own
documentation examples use them.

## Bundle size

**Methodology:** min+gzip (gzip level 6), JS and CSS measured separately and combined.
All `.js` and `.css` files in each app's `dist/` directory are gzip-compressed individually and
summed. Raw sizes are also recorded. Measurement code: `apps/bench/runner/src/bundle.ts`.

**Per-component incremental matrix:** Each app builds 9 matrix entries
(`baseline`, `button`, `input`, `checkbox`, `select`, `dialog`, `table`, `badge`, `tabs`)
via `vite.matrix.config.ts`. Incremental cost = total of component entry − total of baseline
entry. This isolates the marginal cost of importing one component.

**Why not package-size comparisons?** shadcn/ui ships no npm package — components are
copy-pasted. Carbon's 4.5MB `node_modules` size includes fonts and icons never imported in a
real app. Comparing installed-size is meaningless; comparing what a real production bundle ships
is the right metric.

**Carbon CSS note:** The default `@use '@carbon/react'` imports all Carbon styles (~82KB gz).
Carbon supports per-component Sass imports for smaller bundles. We measure the documented
default. This is disclosed in the results, not editorialized.

## Runtime interaction latency

**Methodology:** Chrome DevTools Protocol (CDP) trace-based click→paint timing, mirroring the
[js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) approach. This
captures style, layout, and paint, not just JavaScript execution time.

**Setup:**

- Production preview builds (`vp build` + `vp preview`)
- 4× CPU throttle applied via `Emulation.setCPUThrottlingRate` only around the measured operation
- 5 warmup iterations for "warm" operations (re-applying a state that's already been set)
- 0 warmup iterations for "cold" operations (first-time data creation)
- 12 samples per scenario per library
- Fresh browser page per sample
- 300ms quiet period after the operation before stopping the trace

**Statistical reporting:** Median + IQR (p25–p75) from sorted samples. Mann-Whitney U two-sided
test vs cascade; `p ≥ 0.05` is reported as **tie** — no winner is claimed for statistically
insignificant differences.

**Scenarios and warmup rationale:**

| Scenario             | Route   | Warmup? | Rationale                                                                               |
| -------------------- | ------- | ------- | --------------------------------------------------------------------------------------- |
| create-1k            | /table  | No      | Cold: first creation                                                                    |
| create-10k           | /table  | No      | Cold: first creation                                                                    |
| update-every-10th    | /table  | Yes     | Row state already exists                                                                |
| select-row           | /table  | No      | Re-selecting same row is a no-op in signals — first selection is the honest measurement |
| clear                | /table  | No      | Cold: table has data to clear                                                           |
| open-dialog          | /dialog | Yes     | Dialog already mounted before                                                           |
| type-20-chars        | /form   | Yes     | Input field already focused                                                             |
| toggle-50-checkboxes | /form   | Yes     | Checkboxes already toggled once                                                         |

`type-20-chars` records the full 20-keydown sequence (first keydown → last paint). The
published table also derives ms/keystroke = value ÷ 20.

**Content-visibility disclosure:** cascade's DataTable component ships CSS with
`content-visibility: auto` on table rows (library-shipped, not an app-level optimization). This
is not removed for benchmarking — we benchmark components as shipped.

## Re-render counts

**Methodology:** React Profiler root commit counts from instrumented **development builds**.
`window.__commits` is incremented by a `<Profiler id="bench-root">` wrapper on each commit.
The metric is the integer delta before and after each scenario operation.

**Important:** These counts come from dev builds; timings in the runtime suite NEVER come from
dev builds. The Profiler wrapping is a production no-op.

**Signals claim guardrail:** We do NOT claim that `@preact/signals-react` makes React faster
in the abstract. Published micro-benchmarks of `@preact/signals-react` (including Electric UI's
comparison) show `useState` is comparable or faster at the micro-benchmark level. Our
defensible claim is specifically: **cascade components cause fewer React root commits per
interaction**, because signals bypass React's reconciler for signal-driven state changes. The
re-render count integers are deterministic and unimpeachable; timing superiority for the
`type-20-chars` scenario (where cascade may show 0 root commits vs shadcn's 20) is a function
of this architecture.

## Lighthouse

**Methodology:** `@lhci/cli collect` with `--settings.preset=desktop`, `--numberOfRuns=5`,
against each app's production preview. The "representative run" (median) is read from lhci's
manifest. Metrics recorded: FCP, LCP, TBT, total transfer weight.

**TBT disclaimer:** TBT (Total Blocking Time) is used as a **lab proxy for INP** — it
correlates with responsiveness but cannot measure actual INP, which requires real-user field
data. It is never labeled as INP in any reported output.

## Accessibility (parity gate, not a score)

**Methodology:** `@axe-core/playwright` with WCAG 2.1 AA tags (`wcag2a`, `wcag2aa`,
`wcag21a`, `wcag21aa`) over a fixed 4-state matrix:

1. `/table` — initial (empty)
2. `/table` — populated (1,000 rows)
3. `/form` — initial
4. `/dialog` — dialog open

**Detection ceiling:** Automated tools detect approximately **57% of WCAG issues** at best
(per WebAIM's research on automated a11y testing). These numbers are a floor, not a ranking.

**Framing:** cascade CI fails on any axe violation (`--gate` flag). Competitor violation counts
are reported as context only — this is a parity gate, not a contest. Carbon is IBM's
accessibility flagship; we do not attempt to score against it.

## What we don't measure (yet)

- **SSR/hydration:** `apps/examples/react-next` is a placeholder; SSR comparison needs its own
  tranche when the Next.js example app is real.
- **Field data (real INP):** Requires real users; lab measurement only.
- **MUI / Mantine / Chakra:** Methodology scales. Add after v6 ships.
- **Per-PR tracking:** CodSpeed/bencher.dev integration deferred until the suite is stable.
- **Per-export size badges on docs component pages.**

## Reproduction

```sh
pnpm install
pnpm bench   # bundle → treeshake → runtime → renders → lighthouse → a11y → report
```

**Timing disclosure policy:** Timing numbers (runtime suite) in `docs/BENCHMARKS.md` come only from
`results.json` entries where `meta.source == 'local'` — i.e., runs from a disclosed dedicated
machine. CI produces timing artifacts for smoke-testing but **never commits them**. The
committed `results.json` carries full hardware metadata (`meta.cpu`, `meta.cores`, `meta.memGb`,
`meta.os`, `meta.chrome`, `meta.lockfileHash`).

**To challenge a number:** Open a GitHub issue with your `results.json` attached. Include your
hardware spec. We will review and update the published results if methodology is applied
correctly.
