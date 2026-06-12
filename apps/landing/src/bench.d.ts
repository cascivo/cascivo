declare module 'virtual:bench' {
  type LibId = 'cascade' | 'shadcn' | 'carbon'
  type ScenarioId =
    | 'mount-100'
    | 'mount-1000'
    | 'update-100'
    | 'update-1000'
    | 'toggle'
    | 'destroy-100'
    | 'destroy-1000'
    | 'mixed'

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
        { gzipKb: number; brotliKb: number; rawKb: number; treeshakeKb?: number }
      >
      matrix: Record<LibId, Record<string, { gzipKb: number; brotliKb: number; rawKb: number }>>
      treeshake?: Record<string, { gzipKb: number }>
    }
    runtime?: Record<
      ScenarioId,
      Partial<Record<LibId, TimingStats>> & {
        pVsCascade?: Partial<Record<Exclude<LibId, 'cascade'>, number>>
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
