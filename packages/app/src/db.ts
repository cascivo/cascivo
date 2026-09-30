import { HttpError } from '@cascivo/data'

/**
 * `@cascivo/app/db` — D1 behind a `DataTable`, and the small pieces around it.
 *
 * `DataTable`'s server mode hands out one `TableQuery` (sort, search, per-column filters,
 * page). `defineTable` says which columns may be sorted, searched and filtered, and turns a
 * query into SQL where every identifier comes from that list and every value is a bound
 * parameter — never a string pasted into the statement.
 *
 * ```ts
 * // shared
 * export const customers = defineTable({
 *   table: 'customers',
 *   key: 'id',
 *   columns: {
 *     id: {},
 *     name: { sort: true, search: true, filter: 'text' },
 *     plan: { sort: true, filter: 'select' },
 *     seats: { sort: true, filter: 'range' },
 *   },
 * })
 * // Worker: the query arrives as JSON, so it is parsed first
 * const page = await queryTable(env.DB, customers, parseTableQuery(body), parseCustomer)
 * ```
 */

/** What these helpers need of a D1 statement. D1's own binding satisfies it. */
export interface DbStatement {
  bind(...values: unknown[]): DbStatement
  all(): Promise<{ results: unknown[] }>
  first(): Promise<unknown>
  run(): Promise<unknown>
}

/** What these helpers need of a D1 database. D1's own binding satisfies it. */
export interface Database {
  prepare(sql: string): DbStatement
  batch(statements: DbStatement[]): Promise<unknown[]>
}

/* --------------------------------- the query -------------------------------- */

export type SortDirection = 'asc' | 'desc'

export interface TableSort {
  key: string
  direction: SortDirection
  thenBy?: { key: string; direction: SortDirection }[]
}

export type TableFilter =
  | { kind: 'text'; value: string }
  | { kind: 'select'; values: string[] }
  | { kind: 'range'; min?: number; max?: number }

/** The same shape as `DataTable`'s `TableQuery`, so its `onQueryChange` output fits. */
export interface TableQuery {
  sort: TableSort | undefined
  search: string
  filters: Record<string, TableFilter>
  /** 1-based. */
  page: number
  pageSize: number
}

export interface TablePage<Row> {
  rows: Row[]
  /** Rows across every page, for the pager. */
  total: number
}

const MAX_PAGE_SIZE = 200
const MAX_TEXT = 200
const MAX_SELECT = 100

/**
 * A bad query. An `HttpError(400)`, so a `createHandler` handler that throws it answers 400
 * with its message rather than a 500.
 */
export class TableQueryError extends HttpError {
  constructor(message: string) {
    super(400, message)
    this.name = 'TableQueryError'
  }
}

const fail = (message: string): never => {
  throw new TableQueryError(message)
}

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw)
}

function parseSortKey(raw: unknown): { key: string; direction: SortDirection } {
  if (!isRecord(raw)) return fail('sort must be an object')
  const { key, direction } = raw
  if (typeof key !== 'string') return fail('sort.key must be a string')
  if (direction !== 'asc' && direction !== 'desc') return fail('sort.direction is asc or desc')
  return { key, direction }
}

function parseFilter(raw: unknown): TableFilter {
  if (!isRecord(raw)) return fail('A filter is an object')
  switch (raw['kind']) {
    case 'text': {
      const value = raw['value']
      if (typeof value !== 'string' || value.length > MAX_TEXT)
        return fail('A text filter has a short value')
      return { kind: 'text', value }
    }
    case 'select': {
      const values = raw['values']
      if (!Array.isArray(values) || values.length > MAX_SELECT)
        return fail('A select filter has values[]')
      return {
        kind: 'select',
        values: values.map((v: unknown) =>
          typeof v === 'string' && v.length <= MAX_TEXT
            ? v
            : fail('Select values are short strings'),
        ),
      }
    }
    case 'range': {
      const { min, max } = raw
      const bound = (v: unknown) =>
        v === undefined || v === null
          ? undefined
          : typeof v === 'number' && Number.isFinite(v)
            ? v
            : fail('Range bounds are numbers')
      const lo = bound(min)
      const hi = bound(max)
      return {
        kind: 'range',
        ...(lo !== undefined ? { min: lo } : {}),
        ...(hi !== undefined ? { max: hi } : {}),
      }
    }
    default:
      return fail('A filter kind is text, select or range')
  }
}

/** Checks a `TableQuery` that crossed the network. Throws `TableQueryError`. */
export function parseTableQuery(raw: unknown): TableQuery {
  if (!isRecord(raw)) return fail('The query must be an object')
  const { sort, search, filters, page, pageSize } = raw
  let parsedSort: TableSort | undefined
  if (sort !== undefined && sort !== null) {
    const primary = parseSortKey(sort)
    const thenBy = isRecord(sort) ? sort['thenBy'] : undefined
    if (thenBy !== undefined && (!Array.isArray(thenBy) || thenBy.length > 5)) {
      return fail('sort.thenBy is at most 5 keys')
    }
    parsedSort = Array.isArray(thenBy) ? { ...primary, thenBy: thenBy.map(parseSortKey) } : primary
  }
  if (search !== undefined && (typeof search !== 'string' || search.length > MAX_TEXT)) {
    return fail(`search is at most ${MAX_TEXT} characters`)
  }
  const parsedFilters: Record<string, TableFilter> = {}
  if (filters !== undefined) {
    if (!isRecord(filters)) return fail('filters must be an object')
    for (const [key, value] of Object.entries(filters)) parsedFilters[key] = parseFilter(value)
  }
  if (typeof page !== 'number' || !Number.isInteger(page) || page < 1 || page > 1_000_000) {
    return fail('page is a whole number from 1')
  }
  if (
    typeof pageSize !== 'number' ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > MAX_PAGE_SIZE
  ) {
    return fail(`pageSize is 1 to ${MAX_PAGE_SIZE}`)
  }
  return {
    sort: parsedSort,
    search: typeof search === 'string' ? search.trim() : '',
    filters: parsedFilters,
    page,
    pageSize,
  }
}

/** Checks a page of rows that crossed the network. */
export function parseTablePage<Row>(raw: unknown, parseRow: (raw: unknown) => Row): TablePage<Row> {
  if (!isRecord(raw) || !Array.isArray(raw['rows']))
    throw new Error('A table page is { rows, total }')
  const total = raw['total']
  if (typeof total !== 'number' || !Number.isInteger(total) || total < 0)
    throw new Error('total is a count')
  return { rows: raw['rows'].map(parseRow), total }
}

/* --------------------------------- the table -------------------------------- */

export interface TableColumn {
  /** May the table sort by it. */
  sort?: boolean
  /** Is it part of the global search (`LIKE`). */
  search?: boolean
  /** The per-column filter it allows. */
  filter?: 'text' | 'select' | 'range'
}

export interface Table<C extends string> {
  readonly table: string
  readonly key: C
  readonly columns: Readonly<Record<C, TableColumn>>
  /** The statements for one page and its total. Throws `TableQueryError` on a disallowed query. */
  toSql(query: TableQuery): {
    sql: string
    params: unknown[]
    countSql: string
    countParams: unknown[]
  }
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/
const quote = (name: string) => `"${name}"`

/** `%` and `_` are wildcards in LIKE; a search for "50%" means the characters. */
const likeValue = (text: string) => `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

export function defineTable<const C extends string>(definition: {
  table: string
  /** The primary key: the last tiebreaker, so paging is stable. */
  key: NoInfer<C>
  columns: Record<C, TableColumn>
}): Table<C> {
  const { table, key, columns } = definition
  const names = Object.keys(columns) as C[]
  for (const name of [table, ...names]) {
    if (!IDENTIFIER.test(name)) throw new Error(`"${name}" is not a plain SQL identifier`)
  }
  if (!names.includes(key)) throw new Error(`The key "${key}" is not one of the columns`)
  const column = (name: string): TableColumn | undefined =>
    Object.hasOwn(columns, name) ? columns[name as C] : undefined

  return {
    table,
    key,
    columns,
    toSql(query) {
      const where: string[] = []
      const params: unknown[] = []
      const searchable = names.filter((n) => columns[n].search)
      if (query.search !== '' && searchable.length > 0) {
        where.push(`(${searchable.map((n) => `${quote(n)} LIKE ? ESCAPE '\\'`).join(' OR ')})`)
        for (let i = 0; i < searchable.length; i++) params.push(likeValue(query.search))
      }
      for (const [name, filter] of Object.entries(query.filters)) {
        const spec = column(name)
        if (!spec?.filter) fail(`"${name}" cannot be filtered`)
        if (spec!.filter !== filter.kind) fail(`"${name}" takes a ${spec!.filter} filter`)
        if (filter.kind === 'text' && filter.value.trim() !== '') {
          where.push(`${quote(name)} LIKE ? ESCAPE '\\'`)
          params.push(likeValue(filter.value.trim()))
        } else if (filter.kind === 'select' && filter.values.length > 0) {
          where.push(`${quote(name)} IN (${filter.values.map(() => '?').join(', ')})`)
          params.push(...filter.values)
        } else if (filter.kind === 'range') {
          if (filter.min !== undefined) {
            where.push(`${quote(name)} >= ?`)
            params.push(filter.min)
          }
          if (filter.max !== undefined) {
            where.push(`${quote(name)} <= ?`)
            params.push(filter.max)
          }
        }
      }
      const order: string[] = []
      if (query.sort) {
        for (const s of [query.sort, ...(query.sort.thenBy ?? [])]) {
          if (!column(s.key)?.sort) fail(`"${s.key}" cannot be sorted`)
          order.push(`${quote(s.key)} ${s.direction === 'desc' ? 'DESC' : 'ASC'}`)
        }
      }
      order.push(`${quote(key)} ASC`)
      const whereSql = where.length > 0 ? ` WHERE ${where.join(' AND ')}` : ''
      const from = `FROM ${quote(table)}${whereSql}`
      return {
        sql: `SELECT ${names.map(quote).join(', ')} ${from} ORDER BY ${order.join(', ')} LIMIT ? OFFSET ?`,
        params: [...params, query.pageSize, (query.page - 1) * query.pageSize],
        countSql: `SELECT COUNT(*) AS total ${from}`,
        countParams: params,
      }
    },
  }
}

/** One page of `table` for `query`, each row through `parseRow`, plus the total. */
export async function queryTable<C extends string, Row>(
  db: Database,
  table: Table<C>,
  query: TableQuery,
  parseRow: (raw: unknown) => Row,
): Promise<TablePage<Row>> {
  const { sql, params, countSql, countParams } = table.toSql(query)
  const [page, count] = await Promise.all([
    db
      .prepare(sql)
      .bind(...params)
      .all(),
    db
      .prepare(countSql)
      .bind(...countParams)
      .first(),
  ])
  const total = isRecord(count) ? Number(count['total']) : 0
  return { rows: page.results.map(parseRow), total: Number.isFinite(total) ? total : 0 }
}

/** Rows for a statement, each through `parseRow`. */
export async function queryRows<Row>(
  db: Database,
  sql: string,
  params: unknown[],
  parseRow: (raw: unknown) => Row,
): Promise<Row[]> {
  const result = await db
    .prepare(sql)
    .bind(...params)
    .all()
  return result.results.map(parseRow)
}

/* -------------------------------- migrations -------------------------------- */

export interface Migration {
  /** Stable and unique, applied in array order: `0001_customers`. */
  id: string
  /** One statement per entry — they run together, in one transaction. */
  statements: string[]
}

const MIGRATIONS_TABLE = '_cascivo_migrations'
/** Per database, per list of migrations: a longer list (a later deploy) runs again. */
const migrated = new WeakMap<Database, Map<string, Promise<void>>>()

/**
 * Brings the database up to date: each migration not yet recorded runs once, in one
 * transaction with the row that records it. Call it before the first query — it runs once per
 * isolate — so a fresh deploy, a temporary account or a Deploy button needs no migration step.
 * Two isolates racing on a fresh database is safe: the second's transaction fails on the
 * record and nothing half-applies.
 */
export function migrate(db: Database, migrations: Migration[]): Promise<void> {
  const ids = new Set<string>()
  for (const m of migrations) {
    if (ids.has(m.id)) throw new Error(`Migration "${m.id}" is listed twice`)
    ids.add(m.id)
  }
  const key = [...ids].join('\n')
  let byList = migrated.get(db)
  if (!byList) migrated.set(db, (byList = new Map()))
  let running = byList.get(key)
  if (!running) {
    running = apply(db, migrations).catch((error: unknown) => {
      byList.delete(key)
      throw error
    })
    byList.set(key, running)
  }
  return running
}

async function applied(db: Database): Promise<Set<string>> {
  const rows = await db.prepare(`SELECT id FROM ${MIGRATIONS_TABLE}`).all()
  return new Set(rows.results.map((row) => (isRecord(row) ? String(row['id']) : '')))
}

async function apply(db: Database, migrations: Migration[]): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`,
    )
    .run()
  let done = await applied(db)
  for (const migration of migrations) {
    if (done.has(migration.id)) continue
    try {
      await db.batch([
        ...migration.statements.map((sql) => db.prepare(sql)),
        db
          .prepare(`INSERT INTO ${MIGRATIONS_TABLE} (id, applied_at) VALUES (?, ?)`)
          .bind(migration.id, new Date().toISOString()),
      ])
    } catch (error) {
      // Another isolate may have applied it between our read and our write.
      done = await applied(db)
      if (!done.has(migration.id)) throw error
    }
  }
}
