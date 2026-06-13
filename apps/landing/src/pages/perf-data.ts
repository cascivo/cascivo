import bench from 'virtual:bench'

export { bench }

export const LIBS = ['cascade', 'shadcn', 'carbon'] as const
export type Lib = (typeof LIBS)[number]

export const LIB_LABELS: Record<Lib, string> = {
  cascade: 'cascivo',
  shadcn: 'shadcn/ui',
  carbon: 'Carbon',
}

export const SCENARIO_LABELS = {
  'create-1k': 'Create 1,000 rows',
  'create-10k': 'Create 10,000 rows',
  'update-every-10th': 'Update every 10th row',
  'select-row': 'Select a row',
  clear: 'Clear table',
  'open-dialog': 'Open dialog',
  'type-20-chars': 'Type 20 characters',
  'toggle-50-checkboxes': 'Toggle 50 checkboxes',
} as const
export type ScenarioId = keyof typeof SCENARIO_LABELS
export const SCENARIOS = Object.keys(SCENARIO_LABELS) as ScenarioId[]

/** Curated subset for the latency spotlight chart. */
export const LATENCY_SPOTLIGHT: readonly ScenarioId[] = [
  'create-1k',
  'update-every-10th',
  'select-row',
  'type-20-chars',
  'toggle-50-checkboxes',
]

/** Matrix components (match the bench runner's measured set). */
export const MATRIX_COMPONENTS = [
  'button',
  'input',
  'checkbox',
  'select',
  'dialog',
  'table',
  'badge',
  'tabs',
] as const

// ── Formatters — render-time only; data layer never rounds ──
export const fmtKb = (v: number) => `${v.toFixed(1)} KB`
export const fmtMs = (v: number) => `${v.toFixed(1)} ms`
export const fmtInt = (v: number) => new Intl.NumberFormat('en-US').format(v)

/** "shadcn/ui: X · Carbon: Y" for Stat helpText; '—' where a lib lacks data. */
export function competitorNote(format: (lib: 'shadcn' | 'carbon') => string | null): string {
  return (['shadcn', 'carbon'] as const)
    .map((lib) => `${LIB_LABELS[lib]}: ${format(lib) ?? '—'}`)
    .join(' · ')
}

// ── Selectors — every one returns null when its bench slice is absent ──

export type ChartDatum = { x: string; y: number }
export type ChartSeries = { id: string; label: string; data: ChartDatum[] }

/** Cheapest competitor by total gzip — the hero's honest comparison anchor. */
export function bestCompetitor(): { lib: Lib; totalGzKb: number } | null {
  const apps = bench.bundle?.apps
  if (!apps) return null
  const best = (['shadcn', 'carbon'] as const).reduce((a, b) =>
    apps[a].totalGzKb <= apps[b].totalGzKb ? a : b,
  )
  return { lib: best, totalGzKb: apps[best].totalGzKb }
}

/** Grouped bundle chart: categories = libraries, series = JS gz / CSS gz. */
export function bundleChartSeries(): ChartSeries[] | null {
  const apps = bench.bundle?.apps
  if (!apps) return null
  return [
    {
      id: 'js',
      label: 'JS (gzip, KB)',
      data: LIBS.map((lib) => ({ x: LIB_LABELS[lib], y: apps[lib].jsGzKb })),
    },
    {
      id: 'css',
      label: 'CSS (gzip, KB)',
      data: LIBS.map((lib) => ({ x: LIB_LABELS[lib], y: apps[lib].cssGzKb })),
    },
  ]
}

export type Lens = 'incremental' | 'standalone' | 'amortized'

export type MatrixRow = {
  component: string
  notes: Partial<Record<Lib, string>>
} & Partial<Record<`${Lib}_incremental` | `${Lib}_standalone` | `${Lib}_amortized`, number>>

export function matrixRows(): MatrixRow[] | null {
  const matrix = bench.bundle?.matrix
  if (!matrix) return null
  return MATRIX_COMPONENTS.map((component) => {
    const row: MatrixRow = { component, notes: {} }
    for (const lib of LIBS) {
      const cell = matrix[lib]?.[component]
      if (cell) {
        row[`${lib}_incremental`] = cell.incrementalGzKb
        row[`${lib}_standalone`] = cell.standaloneGzKb
        row[`${lib}_amortized`] = cell.amortizedGzKb
        if (cell.note) row.notes[lib] = cell.note
      }
    }
    return row
  })
}

/** Spotlight chart series (one per lib); skips scenarios missing any lib's stats. */
export function latencySpotlightSeries(): ChartSeries[] | null {
  const runtime = bench.runtime
  if (!runtime) return null
  const complete = LATENCY_SPOTLIGHT.filter((s) =>
    LIBS.every((lib) => runtime[s]?.[lib] !== undefined),
  )
  if (complete.length === 0) return null
  return LIBS.map((lib) => ({
    id: lib,
    label: LIB_LABELS[lib],
    data: complete.map((s) => {
      const entry = runtime[s]
      const stats = entry?.[lib]
      return {
        x: SCENARIO_LABELS[s],
        y: stats?.median ?? 0,
      }
    }),
  }))
}

export type LatencyRow = {
  scenario: ScenarioId
  stats: Partial<Record<Lib, { median: number; p25: number; p75: number }>>
  /** true ⇒ Mann-Whitney p ≥ 0.05 vs cascade — statistically a tie. */
  ties: Partial<Record<Lib, boolean>>
}

export function latencyRows(): LatencyRow[] | null {
  const runtime = bench.runtime
  if (!runtime) return null
  return SCENARIOS.filter((s) => runtime[s] !== undefined).map((scenario) => {
    const entry = runtime[scenario]
    const stats: LatencyRow['stats'] = {}
    const ties: LatencyRow['ties'] = {}
    for (const lib of LIBS) {
      const s = entry?.[lib]
      if (s) stats[lib] = { median: s.median, p25: s.p25, p75: s.p75 }
      const p = lib !== 'cascade' ? entry?.pVsCascade?.[lib] : undefined
      if (p !== undefined && p >= 0.05) ties[lib] = true
    }
    return { scenario, stats, ties }
  })
}

/** Re-render chart series (one per lib) across every scenario with data. */
export function rendersSeries(): ChartSeries[] | null {
  const renders = bench.renders
  if (!renders) return null
  const present = SCENARIOS.filter((s) => renders[s] !== undefined)
  if (present.length === 0) return null
  return LIBS.map((lib) => ({
    id: lib,
    label: LIB_LABELS[lib],
    data: present.map((s) => {
      const scenarioData = renders[s]
      return {
        x: SCENARIO_LABELS[s],
        y: scenarioData?.[lib] ?? 0,
      }
    }),
  }))
}
