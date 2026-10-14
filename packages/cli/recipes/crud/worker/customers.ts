import { HttpError } from '@cascivo/app/api'
import { migrate, queryTable } from '@cascivo/app/db'
import type { Database, TablePage, TableQuery } from '@cascivo/app/db'
import { customersTable, parseCustomer } from '../src/customers'
import type { Customer, CustomerInput } from '../src/customers'
import { migrations } from './migrations'

/** Every handler starts here: the schema is applied once per isolate, before the first query. */
async function ready(db: Database): Promise<Database> {
  await migrate(db, migrations)
  return db
}

/** A second customer with the same email is a conflict the form can show, not a 500. */
function uniqueEmail(error: unknown): never {
  if (/UNIQUE/i.test(String(error))) throw new HttpError(409, 'A customer with that email exists')
  throw error
}

export async function listCustomers(db: Database, query: TableQuery): Promise<TablePage<Customer>> {
  return queryTable(await ready(db), customersTable, query, parseCustomer)
}

export async function createCustomer(db: Database, input: CustomerInput): Promise<Customer> {
  const customer: Customer = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...input,
  }
  await (
    await ready(db)
  )
    .prepare(
      'INSERT INTO customers (id, name, email, plan, seats, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(customer.id, input.name, input.email, input.plan, input.seats, customer.created_at)
    .run()
    .catch(uniqueEmail)
  return customer
}

export async function updateCustomer(
  db: Database,
  id: string,
  input: CustomerInput,
): Promise<Customer> {
  const row = await (
    await ready(db)
  )
    .prepare(
      'UPDATE customers SET name = ?, email = ?, plan = ?, seats = ? WHERE id = ? RETURNING *',
    )
    .bind(input.name, input.email, input.plan, input.seats, id)
    .first()
    .catch(uniqueEmail)
  if (!row) throw new HttpError(404, 'No such customer')
  return parseCustomer(row)
}

export async function deleteCustomer(db: Database, id: string): Promise<{ id: string }> {
  const row = await (
    await ready(db)
  )
    .prepare('DELETE FROM customers WHERE id = ? RETURNING id')
    .bind(id)
    .first()
  if (!row) throw new HttpError(404, 'No such customer')
  return { id }
}
