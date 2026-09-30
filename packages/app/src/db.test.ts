// @vitest-environment node
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import {
  defineTable,
  migrate,
  parseTablePage,
  parseTableQuery,
  queryRows,
  queryTable,
  TableQueryError,
} from './db'
import type { Database, DbStatement, TableQuery } from './db'

/** D1's shape over a real SQLite database, so every statement below really runs. */
function d1(sqlite: DatabaseSync): Database {
  const statement = (sql: string, params: unknown[] = []): DbStatement => ({
    bind: (...values) => statement(sql, values),
    all: async () => ({ results: sqlite.prepare(sql).all(...(params as never[])) }),
    first: async () => sqlite.prepare(sql).get(...(params as never[])) ?? null,
    run: async () => sqlite.prepare(sql).run(...(params as never[])),
  })
  return {
    prepare: (sql) => statement(sql),
    // D1 runs a batch as one transaction.
    batch: async (statements) => {
      sqlite.exec('BEGIN')
      try {
        const results = []
        for (const s of statements) results.push(await s.run())
        sqlite.exec('COMMIT')
        return results
      } catch (error) {
        sqlite.exec('ROLLBACK')
        throw error
      }
    },
  }
}

const customers = defineTable({
  table: 'customers',
  key: 'id',
  columns: {
    id: {},
    name: { sort: true, search: true, filter: 'text' },
    email: { search: true },
    plan: { sort: true, filter: 'select' },
    seats: { sort: true, filter: 'range' },
  },
})

interface Customer {
  id: string
  name: string
  email: string
  plan: string
  seats: number
}
const parseCustomer = (raw: unknown): Customer => {
  const r = raw as Record<string, unknown>
  if (typeof r['id'] !== 'string' || typeof r['seats'] !== 'number') throw new Error('bad row')
  return {
    id: r['id'],
    name: String(r['name']),
    email: String(r['email']),
    plan: String(r['plan']),
    seats: r['seats'],
  }
}

async function seeded(): Promise<Database> {
  const db = d1(new DatabaseSync(':memory:'))
  await migrate(db, [
    {
      id: '0001_customers',
      statements: [
        'CREATE TABLE customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, plan TEXT NOT NULL, seats INTEGER NOT NULL)',
      ],
    },
  ])
  const plans = ['free', 'team', 'enterprise']
  for (let i = 1; i <= 30; i++) {
    await db
      .prepare('INSERT INTO customers VALUES (?, ?, ?, ?, ?)')
      .bind(
        `c${String(i).padStart(2, '0')}`,
        `Customer ${i}`,
        `c${i}@example.com`,
        plans[i % 3]!,
        i * 10,
      )
      .run()
  }
  await db
    .prepare('INSERT INTO customers VALUES (?, ?, ?, ?, ?)')
    .bind('c99', 'Save 50% Ltd', 'x@example.com', 'team', 5)
    .run()
  return db
}

const query = (change: Partial<TableQuery> = {}): TableQuery => ({
  sort: undefined,
  search: '',
  filters: {},
  page: 1,
  pageSize: 10,
  ...change,
})

describe('queryTable', () => {
  it('pages, sorts and counts', async () => {
    const db = await seeded()
    const page = await queryTable(
      db,
      customers,
      query({ sort: { key: 'seats', direction: 'desc' }, page: 2 }),
      parseCustomer,
    )
    expect(page.total).toBe(31)
    expect(page.rows.map((r) => r.seats)).toEqual([
      200, 190, 180, 170, 160, 150, 140, 130, 120, 110,
    ])
  })

  it('searches every searchable column, taking % and _ literally', async () => {
    const db = await seeded()
    expect(
      (await queryTable(db, customers, query({ search: 'c7@' }), parseCustomer)).rows.map(
        (r) => r.id,
      ),
    ).toEqual(['c07'])
    expect(
      (await queryTable(db, customers, query({ search: '50%' }), parseCustomer)).rows.map(
        (r) => r.id,
      ),
    ).toEqual(['c99'])
    expect((await queryTable(db, customers, query({ search: '%' }), parseCustomer)).total).toBe(1)
  })

  it('applies select, range and text filters together, with a tiebreak sort', async () => {
    const db = await seeded()
    const page = await queryTable(
      db,
      customers,
      query({
        filters: {
          plan: { kind: 'select', values: ['team', 'enterprise'] },
          seats: { kind: 'range', min: 50, max: 120 },
          name: { kind: 'text', value: 'customer 1' },
        },
        sort: { key: 'plan', direction: 'asc', thenBy: [{ key: 'seats', direction: 'desc' }] },
      }),
      parseCustomer,
    )
    expect(page.rows.map((r) => `${r.plan}:${r.seats}`)).toEqual(['enterprise:110', 'team:100'])
    expect(page.total).toBe(2)
  })

  it('treats a value that looks like SQL as text', async () => {
    const db = await seeded()
    const page = await queryTable(db, customers, query({ search: "' OR 1=1 --" }), parseCustomer)
    expect(page.total).toBe(0)
  })

  it.each([
    [
      'a sort on a column that does not allow it',
      query({ sort: { key: 'email', direction: 'asc' } }),
    ],
    [
      'a filter on a column that does not allow it',
      query({ filters: { email: { kind: 'text', value: 'x' } } }),
    ],
    ['the wrong filter kind', query({ filters: { plan: { kind: 'text', value: 'x' } } })],
    [
      'a column that does not exist',
      query({ sort: { key: 'name" DESC; DROP TABLE customers; --', direction: 'asc' } }),
    ],
    ['an inherited key', query({ sort: { key: 'toString', direction: 'asc' } })],
  ])('refuses %s', (_, q) => {
    expect(() => customers.toSql(q)).toThrow(TableQueryError)
  })

  it('refuses as a 400, which createHandler passes on', () => {
    try {
      customers.toSql(query({ sort: { key: 'email', direction: 'asc' } }))
    } catch (error) {
      expect((error as TableQueryError).status).toBe(400)
    }
    expect.assertions(1)
  })

  it('reads plain statements through a parser', async () => {
    const db = await seeded()
    const rows = await queryRows(
      db,
      'SELECT * FROM customers WHERE plan = ? ORDER BY seats LIMIT 2',
      ['free'],
      parseCustomer,
    )
    expect(rows.map((r) => r.seats)).toEqual([30, 60])
  })
})

describe('parseTableQuery', () => {
  it('accepts what DataTable sends', () => {
    const sent = {
      sort: { key: 'seats', direction: 'desc', thenBy: [{ key: 'name', direction: 'asc' }] },
      search: '  acme ',
      filters: { plan: { kind: 'select', values: ['team'] }, seats: { kind: 'range', min: 5 } },
      page: 3,
      pageSize: 25,
    }
    expect(parseTableQuery(sent)).toEqual({ ...sent, search: 'acme' })
  })

  it.each([
    ['a page size over the limit', { page: 1, pageSize: 10_000 }],
    ['page 0', { page: 0, pageSize: 10 }],
    [
      'a sort direction that is not one',
      { page: 1, pageSize: 10, sort: { key: 'a', direction: 'up' } },
    ],
    [
      'too many select values',
      { page: 1, pageSize: 10, filters: { a: { kind: 'select', values: Array(101).fill('x') } } },
    ],
    [
      'a range bound that is not a number',
      { page: 1, pageSize: 10, filters: { a: { kind: 'range', min: '5' } } },
    ],
    [
      'an unknown filter kind',
      { page: 1, pageSize: 10, filters: { a: { kind: 'regex', value: '.*' } } },
    ],
  ])('refuses %s', (_, raw) => {
    expect(() => parseTableQuery(raw)).toThrow(TableQueryError)
  })

  it('parses a page of rows', () => {
    expect(parseTablePage({ rows: [{ n: 1 }], total: 1 }, (r) => r)).toEqual({
      rows: [{ n: 1 }],
      total: 1,
    })
    expect(() => parseTablePage({ rows: [], total: -1 }, (r) => r)).toThrow()
  })
})

describe('migrate', () => {
  const create = { id: '0001_t', statements: ['CREATE TABLE t (a TEXT)'] }

  it('applies each migration once, even from two isolates at the same time', async () => {
    const sqlite = new DatabaseSync(':memory:')
    const [a, b] = [d1(sqlite), d1(sqlite)]
    await Promise.all([migrate(a, [create]), migrate(b, [create])])
    await migrate(a, [create, { id: '0002_t_b', statements: ['ALTER TABLE t ADD COLUMN b TEXT'] }])
    const ids = sqlite.prepare('SELECT id FROM _cascivo_migrations ORDER BY id').all()
    expect(ids).toEqual([{ id: '0001_t' }, { id: '0002_t_b' }])
  })

  it('rolls a failing migration back entirely, and tries again next time', async () => {
    const sqlite = new DatabaseSync(':memory:')
    const db = d1(sqlite)
    const broken = { id: '0001_x', statements: ['CREATE TABLE x (a TEXT)', 'NOT SQL'] }
    await expect(migrate(db, [broken])).rejects.toThrow()
    expect(sqlite.prepare("SELECT name FROM sqlite_master WHERE name = 'x'").all()).toEqual([])
    await migrate(db, [{ id: '0001_x', statements: ['CREATE TABLE x (a TEXT)'] }])
    expect(sqlite.prepare("SELECT name FROM sqlite_master WHERE name = 'x'").all()).toHaveLength(1)
  })

  it('refuses a migration id listed twice', () => {
    expect(() => migrate(d1(new DatabaseSync(':memory:')), [create, create])).toThrow(/twice/)
  })
})

describe('defineTable', () => {
  it('refuses identifiers that are not plain', () => {
    expect(() => defineTable({ table: 'a b', key: 'id', columns: { id: {} } })).toThrow()
    expect(() => defineTable({ table: 't', key: 'id', columns: { id: {}, 'x;--': {} } })).toThrow()
  })
})
