declare module 'virtual:bench' {
  type LibId = 'cascade' | 'shadcn' | 'carbon'
  type ScenarioId =
    | 'create-1k'
    | 'create-10k'
    | 'update-every-10th'
    | 'select-row'
    | 'clear'
    | 'open-dialog'
    | 'type-20-chars'
    | 'toggle-50-checkboxes'

  type TimingStats = {
    median: number
    p25: number
    p75: number
    mean: number
    stddev: number
    // samples stripped at build time
  }

  type BenchResults = {
    meta: {
      date: string
      cpu: string
      cores: number
      memGb: number
      os: string
      node: string
      chrome: string
      cpuThrottle: number
      lockfileHash: string
      source: 'local' | 'ci'
    }
    bundle?: {
      apps: Record<
        LibId,
        { jsGzKb: number; cssGzKb: number; totalGzKb: number; jsRawKb: number; cssRawKb: number }
      >
      matrix: Record<
        LibId,
        Record<
          string,
          {
            totalGzKb: number
            incrementalGzKb: number
            standaloneGzKb: number
            amortizedGzKb: number
            note?: string
          }
        >
      >
      treeshake?: { bareImportGzBytes: number; buttonOnlyGzKb: number; fullGzKb: number }
    }
    runtime?: Record<
      ScenarioId,
      Partial<Record<LibId, TimingStats>> & {
        pVsCascade?: Partial<Record<LibId, number>>
      }
    >
    renders?: Record<ScenarioId, Partial<Record<LibId, number>>>
    lighthouse?: Record<
      LibId,
      { fcpMs: number; lcpMs: number; tbtMs: number; transferKb: number; runs: number }
    >
    a11y?: Record<LibId, { violations: number; rules: string[] }>
  }

  const bench: BenchResults
  export default bench
}
