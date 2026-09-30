/**
 * `@cascivo/app/analytics` — usage metrics on Workers Analytics Engine.
 *
 * Analytics Engine stores data points positionally (`blob1`…`blob20`, `double1`…`double20`),
 * which is exactly the kind of thing that drifts: a writer that swapped two blobs, a query
 * that reads the wrong column. `defineMetrics` names the columns once; writing and querying
 * both go through the names.
 *
 * ```ts
 * export const usage = defineMetrics({
 *   dataset: 'app_usage',
 *   blobs: ['path', 'method'],
 *   doubles: ['status', 'duration_ms'],
 *   index: 'path',
 * })
 * usage.write(env.USAGE, { path: '/api/notes', method: 'GET', status: 200, duration_ms: 12 })
 * usage.sql(`SELECT {path} AS path, SUM(_sample_interval) AS requests FROM {dataset} GROUP BY path`)
 * ```
 */

/** What a write needs of an Analytics Engine dataset binding. */
export interface AnalyticsDataset {
  writeDataPoint(point: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void
}

const NAME = /^[a-z_][a-z0-9_]{0,63}$/
/** Analytics Engine's limits: 20 blobs and 20 doubles per point, 16 KB of blobs in total. */
const MAX_COLUMNS = 20
const MAX_BLOB = 1024

export interface Metrics<B extends string, D extends string> {
  readonly dataset: string
  /**
   * Writes one data point. A blob that is missing is written empty; a double that is missing,
   * zero. Blobs are cut to 1 KB each to stay inside Analytics Engine's per-point limit.
   */
  write(binding: AnalyticsDataset, point: Partial<Record<B, string> & Record<D, number>>): void
  /** The Analytics Engine column behind a name: `column('path')` is `'blob1'`. */
  column(name: B | D): string
  /**
   * An SQL statement with `{name}` for each column and `{dataset}` for the table. Only names
   * are substituted — put no request data in here; this is not a parameterized query.
   */
  sql(statement: string): string
}

export function defineMetrics<const B extends string, const D extends string>(schema: {
  dataset: string
  blobs: readonly B[]
  doubles: readonly D[]
  /** The blob that samples and groups best (a user, a route). Analytics Engine keeps one. */
  index?: NoInfer<B>
}): Metrics<B, D> {
  const { dataset, blobs, doubles, index } = schema
  if (!NAME.test(dataset)) throw new Error(`Dataset "${dataset}" must be a lowercase identifier`)
  if (blobs.length > MAX_COLUMNS || doubles.length > MAX_COLUMNS) {
    throw new Error(`Analytics Engine has ${MAX_COLUMNS} blobs and ${MAX_COLUMNS} doubles`)
  }
  const columns = new Map<string, string>()
  blobs.forEach((name, i) => columns.set(name, `blob${i + 1}`))
  doubles.forEach((name, i) => {
    if (columns.has(name)) throw new Error(`"${name}" is both a blob and a double`)
    columns.set(name, `double${i + 1}`)
  })
  for (const name of columns.keys()) {
    if (!NAME.test(name) || name === 'dataset') throw new Error(`Invalid column name "${name}"`)
  }

  return {
    dataset,
    write(binding, point) {
      const values = point as Partial<Record<string, string | number>>
      const blobValues = blobs.map((name) => String(values[name] ?? '').slice(0, MAX_BLOB))
      binding.writeDataPoint({
        blobs: blobValues,
        doubles: doubles.map((name) => {
          const value = values[name]
          return typeof value === 'number' && Number.isFinite(value) ? value : 0
        }),
        ...(index ? { indexes: [blobValues[blobs.indexOf(index)]!.slice(0, 96)] } : {}),
      })
    },
    column(name) {
      return columns.get(name)!
    },
    sql(statement) {
      return statement.replace(/\{(\w+)\}/g, (_, name: string) => {
        if (name === 'dataset') return dataset
        const column = columns.get(name)
        if (!column) throw new Error(`Unknown column {${name}} in the query`)
        return column
      })
    },
  }
}

export interface AnalyticsCredentials {
  accountId: string
  /** An API token with Account Analytics: Read. Keep it a Worker secret. */
  apiToken: string
  /** Default: the global fetch. */
  fetch?: typeof fetch
}

/**
 * Runs a query against Analytics Engine's SQL API and parses each row. Reading has no
 * binding: it goes over HTTP with an account token, from the Worker, never the browser.
 * Counts must be `SUM(_sample_interval)`, not `COUNT()`: Analytics Engine samples at volume.
 */
export async function queryAnalytics<Row>(
  credentials: AnalyticsCredentials,
  sql: string,
  parseRow: (raw: unknown) => Row,
): Promise<Row[]> {
  const doFetch = credentials.fetch ?? fetch
  const response = await doFetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(credentials.accountId)}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${credentials.apiToken}` },
      body: sql,
    },
  )
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Analytics Engine query failed (${response.status}): ${text.slice(0, 300)}`)
  }
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error('Analytics Engine returned a response that is not JSON')
  }
  if (
    typeof body !== 'object' ||
    body === null ||
    !Array.isArray((body as { data?: unknown }).data)
  ) {
    throw new Error('Analytics Engine returned no rows array')
  }
  return (body as { data: unknown[] }).data.map(parseRow)
}

/**
 * A number from a query row. Analytics Engine returns 64-bit integers as strings in JSON (so
 * they keep their precision), and floats as numbers; this takes either.
 */
export function numberField(row: unknown, name: string): number {
  if (typeof row === 'object' && row !== null) {
    const value = (row as Record<string, unknown>)[name]
    const n = typeof value === 'string' ? Number(value) : value
    if (typeof n === 'number' && Number.isFinite(n)) return n
  }
  throw new Error(`Row field "${name}" is not a number`)
}

/** A string from a query row. */
export function stringField(row: unknown, name: string): string {
  if (typeof row === 'object' && row !== null) {
    const value = (row as Record<string, unknown>)[name]
    if (typeof value === 'string') return value
  }
  throw new Error(`Row field "${name}" is not a string`)
}
