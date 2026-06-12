import type { ReactNode } from 'react'
import { BarChart } from '@cascade-ui/charts'
import { DataTable, type Column } from '@cascade-ui/components/data-table'
import { Stat } from '@cascade-ui/components/stat'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import {
  bench,
  bestCompetitor,
  bundleChartSeries,
  competitorNote,
  fmtInt,
  fmtKb,
  fmtMs,
  LATENCY_SPOTLIGHT,
  latencyRows,
  latencySpotlightSeries,
  LIB_LABELS,
  LIBS,
  matrixRows,
  type MatrixRow,
  rendersSeries,
  SCENARIO_LABELS,
} from './perf-data'

export function PerformancePage() {
  return (
    <>
      <Header />
      <main>
        <PerfHero />
        <BundleSection />
        <MatrixSection />
        <LatencySection />
        <RendersSection />
        <LighthouseSection />
        <MethodologySection />
      </main>
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
  if (!series) return null
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
          Tree-shaking check: a bare <code>{`import {} from '@cascade-ui/react'`}</code> adds{' '}
          {fmtInt(treeshake.bareImportGzBytes)} bytes gzip. A Button-only build is{' '}
          {fmtKb(treeshake.buttonOnlyGzKb)} vs {fmtKb(treeshake.fullGzKb)} for the full library.
        </p>
      )}
    </section>
  )
}

const MATRIX_COLUMNS: Column<MatrixRow>[] = [
  { key: 'component', header: 'Component' },
  ...LIBS.map(
    (lib): Column<MatrixRow> => ({
      key: lib,
      header: LIB_LABELS[lib],
      align: 'end',
      render: (row) => (row[lib] !== undefined ? fmtKb(row[lib] ?? 0) : '—'),
    }),
  ),
]

function MatrixSection() {
  const rows = matrixRows()
  if (!rows) return null
  return (
    <section className="section" data-reveal="">
      <h2>What one component costs</h2>
      <p className="section-sub">
        Incremental cost = a build importing only that component, minus the baseline build. The
        marginal price of each import, isolated.
      </p>
      <DataTable
        columns={MATRIX_COLUMNS}
        rows={rows}
        getRowId={(row) => row.component}
        title="Per-component incremental cost (KB, min+gzip)"
        description="KB of gzipped JS+CSS added to the baseline build by importing a single component, per library."
      />
    </section>
  )
}

function LatencySection() {
  const spotlight = latencySpotlightSeries()
  const rows = latencyRows()
  if (!spotlight || !rows) return null
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
  if (!series) return null
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
  if (!lh?.cascade) return null
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
        <a href="https://github.com/urbanisierung/cascade-ui/blob/main/apps/bench/METHODOLOGY.md">
          METHODOLOGY.md
        </a>{' '}
        · bench source:{' '}
        <a href="https://github.com/urbanisierung/cascade-ui/tree/main/apps/bench">apps/bench</a> ·
        reproduce with <code>pnpm bench</code>.
      </p>
    </section>
  )
}
