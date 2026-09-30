import type { Migration } from '@cascivo/app/db'

const FIRST = [
  'Ada',
  'Grace',
  'Alan',
  'Edsger',
  'Barbara',
  'Donald',
  'Margaret',
  'Ken',
  'Frances',
  'Tim',
]
const LAST = ['Labs', 'Systems', 'Works', 'Studio', 'Group', 'Cloud']
const PLANS = ['free', 'team', 'enterprise']

/** 60 sample customers, so the table has pages to sort, search and filter from the start. */
function seed(): string {
  const rows = Array.from({ length: 60 }, (_, i) => {
    const name = `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`
    const email = `${name.toLowerCase().replace(' ', '.')}${i}@example.com`
    const day = String((i % 28) + 1).padStart(2, '0')
    return `('seed-${i}', '${name}', '${email}', '${PLANS[i % 3]}', ${((i * 37) % 250) + 1}, '2026-0${(i % 9) + 1}-${day}')`
  })
  return `INSERT INTO customers (id, name, email, plan, seats, created_at) VALUES ${rows.join(', ')}`
}

/**
 * The schema, applied by the Worker itself on its first query (`migrate` from
 * `@cascivo/app/db`): a fresh deploy, a Deploy button or a temporary account needs no step.
 * Append new migrations; never edit one that has shipped.
 */
export const migrations: Migration[] = [
  {
    id: '0001_customers',
    statements: [
      `CREATE TABLE customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        plan TEXT NOT NULL,
        seats INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )`,
      'CREATE INDEX customers_plan ON customers (plan)',
      seed(),
    ],
  },
]
