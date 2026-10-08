import { defineMetrics } from '@cascivo/app/analytics'

/**
 * What the Worker records for every API request, in Analytics Engine (worker/index.ts writes
 * it). The names are the columns: a query says {path}, never blob1.
 */
export const usageMetrics = defineMetrics({
  dataset: '{{usageDataset}}',
  blobs: ['path', 'method'],
  doubles: ['status', 'duration_ms'],
  index: 'path',
})

export interface UsageReport {
  /** False until the Worker has the secrets it needs to read Analytics Engine. */
  configured: boolean
  hourly: { hour: string; requests: number }[]
  routes: { path: string; requests: number }[]
  totals: { requests: number; errors: number; avgMs: number }
}

function num(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) throw new Error('Expected a number')
  return raw
}

function str(raw: unknown): string {
  if (typeof raw !== 'string') throw new Error('Expected a string')
  return raw
}

function list<T>(raw: unknown, item: (row: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(raw)) throw new Error('Expected a list')
  return raw.map((row: unknown) => {
    if (typeof row !== 'object' || row === null) throw new Error('Expected an object')
    return item(row as Record<string, unknown>)
  })
}

/** The report crosses the network, so the page parses it. */
export function parseUsageReport(raw: unknown): UsageReport {
  if (typeof raw !== 'object' || raw === null) throw new Error('Malformed usage report')
  const r = raw as Record<string, unknown>
  const totals = r['totals']
  if (typeof r['configured'] !== 'boolean' || typeof totals !== 'object' || totals === null) {
    throw new Error('Malformed usage report')
  }
  const t = totals as Record<string, unknown>
  return {
    configured: r['configured'],
    hourly: list(r['hourly'], (row) => ({
      hour: str(row['hour']),
      requests: num(row['requests']),
    })),
    routes: list(r['routes'], (row) => ({
      path: str(row['path']),
      requests: num(row['requests']),
    })),
    totals: { requests: num(t['requests']), errors: num(t['errors']), avgMs: num(t['avgMs']) },
  }
}
