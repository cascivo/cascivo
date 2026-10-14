import { numberField, queryAnalytics, stringField } from '@cascivo/app/analytics'
import type { AnalyticsCredentials } from '@cascivo/app/analytics'
import { usageMetrics } from '../src/usage'
import type { UsageReport } from '../src/usage'

const LAST_DAY = "timestamp > NOW() - INTERVAL '1' DAY"

/** A number, or 0 when the query had nothing to sum (an empty day). */
const orZero = (row: unknown, name: string): number => {
  try {
    return numberField(row, name)
  } catch {
    return 0
  }
}

/**
 * The last 24 hours of API usage, from Analytics Engine's SQL API. Counts are
 * `SUM(_sample_interval)`, never `COUNT()`: Analytics Engine samples at high volume, and each
 * row stands for `_sample_interval` requests.
 */
export async function usageReport(credentials: AnalyticsCredentials | null): Promise<UsageReport> {
  if (!credentials) {
    return {
      configured: false,
      hourly: [],
      routes: [],
      totals: { requests: 0, errors: 0, avgMs: 0 },
    }
  }
  const [hourly, routes, totals, errors] = await Promise.all([
    queryAnalytics(
      credentials,
      usageMetrics.sql(
        `SELECT toStartOfInterval(timestamp, INTERVAL '1' HOUR) AS hour, SUM(_sample_interval) AS requests
         FROM {dataset} WHERE ${LAST_DAY} GROUP BY hour ORDER BY hour`,
      ),
      (row) => ({ hour: stringField(row, 'hour'), requests: numberField(row, 'requests') }),
    ),
    queryAnalytics(
      credentials,
      usageMetrics.sql(
        `SELECT {path} AS path, SUM(_sample_interval) AS requests
         FROM {dataset} WHERE ${LAST_DAY} GROUP BY path ORDER BY requests DESC LIMIT 8`,
      ),
      (row) => ({ path: stringField(row, 'path'), requests: numberField(row, 'requests') }),
    ),
    queryAnalytics(
      credentials,
      usageMetrics.sql(
        `SELECT SUM(_sample_interval) AS requests,
                SUM(_sample_interval * {duration_ms}) / SUM(_sample_interval) AS avg_ms
         FROM {dataset} WHERE ${LAST_DAY}`,
      ),
      (row) => ({ requests: orZero(row, 'requests'), avgMs: orZero(row, 'avg_ms') }),
    ),
    queryAnalytics(
      credentials,
      usageMetrics.sql(
        `SELECT SUM(_sample_interval) AS errors FROM {dataset} WHERE ${LAST_DAY} AND {status} >= 500`,
      ),
      (row) => orZero(row, 'errors'),
    ),
  ])
  return {
    configured: true,
    hourly,
    routes,
    totals: {
      requests: totals[0]?.requests ?? 0,
      errors: errors[0] ?? 0,
      avgMs: Math.round(totals[0]?.avgMs ?? 0),
    },
  }
}
