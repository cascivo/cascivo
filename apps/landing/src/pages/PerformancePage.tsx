import type { ReactNode } from 'react'
import { useSignal, useSignals } from '@cascivo/core'
import { BarChart } from '@cascivo/charts'
import { DataTable, type Column } from '@cascivo/components/data-table'
import { Stat } from '@cascivo/components/stat'
import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { SignalsDemo } from '../sections/SignalsDemo'
import { ProofTeasers } from '../sections/ProofTeasers'
import {
  bench,
  bestCompetitor,
  bundleChartSeries,
  competitorNote,
  fmtInt,
  fmtKb,
  fmtMs,
  latencyRows,
  latencySpotlightSeries,
  LIB_LABELS,
  LIBS,
  MATRIX_COMPONENTS,
  matrixRows,
  type Lens,
  type MatrixRow,
  rendersSeries,
  SCENARIO_LABELS,
} from './perf-data'

export function PerformancePage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <PerfHero />
          <BundleSection />
          <MatrixSection />
          <LatencySection />
          <RendersSection />
          <SignalsDemo />
          <LighthouseSection />
          <ProofTeasers />
          <MethodologySection />
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}

function PerfHero() {
  const apps = bench.bundle?.apps ?? null
  const best = bestCompetitor()
  const typing = bench.renders?.['type-20-chars'] ?? null
  const create1k = bench.runtime?.['create-1k'] ?? null

  return (
    <section className="proof-hero" aria-label="Performance summary">
      <h1>
        Performance is a <span className="proof-hero-accent">measurement</span>, not a vibe.
      </h1>
      <p className="proof-hero-sub">
        Every number on this page is generated at build time from the cascade bench suite —
        identical apps built with cascade, shadcn/ui, and Carbon, pinned versions, trace-based
        timing. The methodology is printed beside the numbers.
      </p>
      <div className="perf-stats">
        {apps && best && (
          <Stat
            label="Total bundle (min+gzip)"
            value={fmtKb(apps.cascade.totalGzKb)}
            helpText={`${LIB_LABELS[best.lib]}: ${fmtKb(best.totalGzKb)}`}
          />
        )}
        {typing?.cascade !== undefined && (
          <Stat
            label="React commits — type 20 characters"
            value={fmtInt(typing.cascade)}
            helpText={competitorNote((lib) =>
              typing[lib] !== undefined ? fmtInt(typing[lib] ?? 0) : null,
            )}
          />
        )}
        {create1k?.cascade && (
          <Stat
            label="Create 1,000 rows — median"
            value={fmtMs(create1k.cascade.median)}
            helpText={competitorNote((lib) =>
              create1k[lib] ? fmtMs(create1k[lib]?.median ?? 0) : null,
            )}
          />
        )}
      </div>
    </section>
  )
}

function BundleSection() {
  const series = bundleChartSeries()
  if (!series) {
    return (
      <section className="section" data-reveal="">
        <h2>Bundle size</h2>
        <p className="perf-note">
          No bundle data yet — run <code>pnpm bench</code> to populate results.
        </p>
      </section>
    )
  }
  const treeshake = bench.bundle?.treeshake
  return (
    <section className="section" data-reveal="">
      <h2>Bundle size</h2>
      <p className="section-sub">
        Everything each identical app ships to production — every JS and CSS file in dist/, gzip
        level 6, measured per file and summed.
      </p>
      <BarChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        mode="grouped"
        height={300}
        title="Production bundle size by library (KB, min+gzip)"
        description="Grouped bars compare gzipped JS and CSS totals for the identical cascade, shadcn/ui, and Carbon bench apps. Lower is better."
      />
      {treeshake && (
        <p className="perf-note">
          Tree-shaking check: a bare <code>{`import {} from '@cascivo/react'`}</code> adds{' '}
          {fmtInt(treeshake.bareImportGzBytes)} bytes gzip. A Button-only build is{' '}
          {fmtKb(treeshake.buttonOnlyGzKb)} vs {fmtKb(treeshake.fullGzKb)} for the full library.
        </p>
      )}
    </section>
  )
}

const LENS_LABELS: Record<Lens, string> = {
  incremental: 'Incremental',
  standalone: 'Standalone',
  amortized: 'Amortized',
}

function MatrixSection() {
  useSignals()
  const lens = useSignal<Lens>('incremental')
  const rows = matrixRows()
  if (!rows) {
    return (
      <section className="section" data-reveal="">
        <h2>What does one component cost?</h2>
        <p className="perf-note">
          No per-component data yet — run <code>pnpm bench</code> to populate.
        </p>
      </section>
    )
  }

  const activeLens = lens.value

  // Collect all notes across all libs for footnote display
  const noteSet = new Set<string>()
  for (const row of rows) {
    for (const lib of LIBS) {
      const note = row.notes[lib]
      if (note) noteSet.add(note)
    }
  }
  const notes = [...noteSet]

  const columns: Column<MatrixRow>[] = [
    { key: 'component', header: 'Component' },
    ...LIBS.map(
      (lib): Column<MatrixRow> => ({
        key: `${lib}_${activeLens}` as keyof MatrixRow,
        header: LIB_LABELS[lib],
        align: 'end' as const,
        render: (row) => {
          const val = row[`${lib}_${activeLens}` as keyof MatrixRow] as number | undefined
          const note = row.notes[lib]
          if (val === undefined) return '—'
          return (
            <span>
              {fmtKb(val)}
              {note && <sup title={note}>†</sup>}
            </span>
          )
        },
      }),
    ),
  ]

  return (
    <section className="section" data-reveal="">
      <h2>What does one component cost?</h2>
      <p className="section-sub">
        There is more than one honest answer. Choose the lens that fits your situation:
      </p>
      <div className="perf-lens-toggle" role="group" aria-label="Cost lens">
        {(['incremental', 'standalone', 'amortized'] as const).map((l) => (
          <button
            key={l}
            onClick={() => {
              lens.value = l
            }}
            aria-pressed={activeLens === l}
            className={activeLens === l ? 'active' : undefined}
          >
            {LENS_LABELS[l]}
          </button>
        ))}
      </div>
      <p className="perf-lens-desc">
        {activeLens === 'incremental' && (
          <>
            <strong>Incremental</strong> — the marginal cost of adding this component to an app that
            already loads the shared runtime. Favors shared-runtime libraries (shadcn/ui, Carbon):
            their dependencies are already paid; cascade&apos;s CSS is new per component.
          </>
        )}
        {activeLens === 'standalone' && (
          <>
            <strong>Standalone</strong> — the full cost of a build that imports only this component
            and nothing else. Worst case for everyone; useful for comparing absolute minimums.
            Favors libraries with smaller runtimes.
          </>
        )}
        {activeLens === 'amortized' && (
          <>
            <strong>Amortized</strong> — the shared runtime spread across all{' '}
            {MATRIX_COMPONENTS.length} measured components. Favors libraries with per-component CSS
            (cascade): one runtime, many cheap components. The more components you use, the lower
            the amortized cost per component.
          </>
        )}
      </p>
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.component}
        title={`Per-component ${LENS_LABELS[activeLens].toLowerCase()} cost (KB, min+gzip)`}
        description={`KB of gzipped JS+CSS per component — ${activeLens} lens.`}
      />
      {notes.length > 0 && <p className="perf-footnote">† {notes.join(' ')}</p>}
    </section>
  )
}

function LatencySection() {
  const spotlight = latencySpotlightSeries()
  const rows = latencyRows()
  if (!spotlight || !rows) {
    return (
      <section className="section" data-reveal="">
        <h2>Interaction latency</h2>
        <p className="perf-note">
          No latency data yet — run <code>pnpm bench</code> to populate results.
        </p>
      </section>
    )
  }
  return (
    <section className="section" data-reveal="">
      <h2>Interaction latency</h2>
      <p className="section-sub">
        Chrome-trace click→paint timing (style + layout + paint, not just JS) at{' '}
        {bench.meta.cpuThrottle}× CPU throttle, 12 samples per scenario, fresh page per sample — the
        js-framework-benchmark approach.
      </p>
      <BarChart
        series={spotlight}
        x={(d) => d.x}
        y={(d) => d.y}
        orientation="horizontal"
        mode="grouped"
        height={420}
        title="Median interaction latency by scenario (ms, lower is better)"
        description={`Horizontal grouped bars compare cascade, shadcn/ui, and Carbon median click-to-paint latency for five representative scenarios at ${bench.meta.cpuThrottle}× CPU throttle.`}
      />
      <table className="perf-table">
        <caption>All scenarios — median (p25–p75), ms</caption>
        <thead>
          <tr>
            <th scope="col">Scenario</th>
            {LIBS.map((lib) => (
              <th key={lib} scope="col">
                {LIB_LABELS[lib]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.scenario}>
              <th scope="row">{SCENARIO_LABELS[row.scenario]}</th>
              {LIBS.map((lib) => {
                const s = row.stats[lib]
                if (!s) return <td key={lib}>—</td>
                return (
                  <td key={lib}>
                    {fmtMs(s.median)}{' '}
                    <span className="perf-iqr">
                      ({s.p25.toFixed(1)}–{s.p75.toFixed(1)})
                    </span>
                    {row.ties[lib] ? <sup>†</sup> : null}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="perf-footnote">
        † Mann-Whitney U vs cascade, p ≥ 0.05 — statistically indistinguishable from cascade. Ties
        claim no winner.
      </p>
    </section>
  )
}

function RendersSection() {
  const series = rendersSeries()
  if (!series) {
    return (
      <section className="section" data-reveal="">
        <h2>Re-renders</h2>
        <p className="perf-note">
          No render data yet — run <code>pnpm bench</code> to populate results.
        </p>
      </section>
    )
  }
  const typing = bench.renders?.['type-20-chars']
  const comparison =
    typing?.cascade !== undefined && typing.shadcn !== undefined
      ? ` — ${fmtInt(typing.cascade)} root commits while typing 20 characters, vs ${fmtInt(typing.shadcn)} for shadcn/ui`
      : ''
  return (
    <section className="section" data-reveal="">
      <h2>Re-renders</h2>
      <p className="section-sub">
        React Profiler root commits per interaction — deterministic integers from instrumented dev
        builds (the timings above never come from these builds). Signals write state past
        React&apos;s reconciler, so cascade components commit only when the tree actually changes
        {comparison}.
      </p>
      <BarChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        mode="grouped"
        height={320}
        title="React root commits per scenario (lower is better)"
        description="Grouped bars compare React Profiler root commit counts per interaction scenario for cascade, shadcn/ui, and Carbon."
      />
    </section>
  )
}

function LighthouseSection() {
  const lh = bench.lighthouse
  if (!lh?.cascade) {
    return (
      <section className="section" data-reveal="">
        <h2>Lighthouse</h2>
        <p className="perf-note">
          No Lighthouse data yet — run <code>pnpm bench</code> to populate results.
        </p>
      </section>
    )
  }
  const c = lh.cascade
  return (
    <section className="section" data-reveal="">
      <h2>Lighthouse</h2>
      <p className="section-sub">
        Representative (median) run of {c.runs} desktop-preset runs per app against production
        preview builds. TBT is a lab proxy for INP — it is never labeled INP.
      </p>
      <div className="perf-stats">
        <Stat label="First Contentful Paint" value={fmtMs(c.fcpMs)} />
        <Stat label="Largest Contentful Paint" value={fmtMs(c.lcpMs)} />
        <Stat label="Total Blocking Time" value={fmtMs(c.tbtMs)} />
        <Stat label="Transfer" value={fmtKb(c.transferKb)} />
      </div>
      <table className="perf-table">
        <caption>Lighthouse comparison — median of {c.runs} runs</caption>
        <thead>
          <tr>
            <th scope="col">Library</th>
            <th scope="col">FCP</th>
            <th scope="col">LCP</th>
            <th scope="col">TBT</th>
            <th scope="col">Transfer</th>
          </tr>
        </thead>
        <tbody>
          {LIBS.map((lib) => {
            const r = lh[lib]
            if (!r) return null
            return (
              <tr key={lib}>
                <th scope="row">{LIB_LABELS[lib]}</th>
                <td>{fmtMs(r.fcpMs)}</td>
                <td>{fmtMs(r.lcpMs)}</td>
                <td>{fmtMs(r.tbtMs)}</td>
                <td>{fmtKb(r.transferKb)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

function MethodologySection() {
  const { meta } = bench
  const metaRows: Array<[string, ReactNode]> = [
    ['Date', meta.date],
    ['CPU', meta.cpu],
    ['Cores', String(meta.cores)],
    ['Memory', `${meta.memGb} GB`],
    ['OS', meta.os],
    ['Node', meta.node],
    ['Chrome', meta.chrome],
    ['CPU throttle', `${meta.cpuThrottle}×`],
    ['Lockfile', <code key="lock">{meta.lockfileHash}</code>],
    ['Source', meta.source],
  ]
  return (
    <section className="section" data-reveal="">
      <h2>Methodology</h2>
      <p className="section-sub">
        Benchmark numbers are machine-specific by nature. The machine, the throttle, and the
        lockfile are disclosed — challenge any number by opening an issue with your own run
        attached.
      </p>
      <dl className="perf-meta">
        {metaRows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <ul className="perf-disclosures">
        <li>
          The {meta.cpuThrottle}× CPU throttle applies only around the measured operation; 12
          samples per scenario, fresh browser page per sample.
        </li>
        <li>All three apps pin exact versions and share React, bundler, and minifier.</li>
        <li>
          Latency deltas with Mann-Whitney U p ≥ 0.05 vs cascade are reported as ties — no winner
          claimed for statistically insignificant differences.
        </li>
        <li>
          Automated axe scans detect roughly 57% of WCAG issues at best (
          <a href="https://webaim.org/projects/million/">WebAIM</a>). Any axe count, ours included,
          is a floor — not a ranking.
        </li>
        <li>
          Re-render counts come from instrumented dev builds; timings never do. TBT is a lab proxy
          for INP and is never labeled INP.
        </li>
      </ul>
      <p className="perf-note">
        Full methodology:{' '}
        <a href="https://github.com/urbanisierung/cascivo/blob/main/apps/bench/METHODOLOGY.md">
          METHODOLOGY.md
        </a>{' '}
        · per-component matrix detail:{' '}
        <a href="https://github.com/urbanisierung/cascivo/blob/main/docs/specs/perf-methodology.md">
          docs/specs/perf-methodology.md
        </a>{' '}
        · bench source:{' '}
        <a href="https://github.com/urbanisierung/cascivo/tree/main/apps/bench">apps/bench</a> ·
        reproduce with <code>pnpm bench</code>.
      </p>
    </section>
  )
}
