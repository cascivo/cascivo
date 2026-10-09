import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AUTH_MODES, CREATE_APP_EXAMPLE_NAMES, exampleSetup } from './create-app-examples.js'

const create = readFileSync(join(import.meta.dirname, '../../cli/src/commands/create.ts'), 'utf8')

function listed(pattern: RegExp): string[] {
  const block = create.match(pattern)?.[1] ?? ''
  return [...block.matchAll(/'([\w,-]+)'/g)].map((m) => m[1]!)
}

describe('create_app vocabulary', () => {
  it('offers exactly the examples `cascivo create --example` accepts', () => {
    const cli = listed(/export const EXAMPLES = \[([\s\S]*?)\] as const/)
    expect(cli.length).toBeGreaterThan(10)
    expect([...CREATE_APP_EXAMPLE_NAMES].sort()).toEqual(cli.sort())
  })

  it('offers exactly the sign-in modes `cascivo create --auth` accepts', () => {
    const cli = listed(/export type Auth = ([^\n]+)/)
    expect([...AUTH_MODES].sort()).toEqual(cli.sort())
  })

  it('returns setup notes only for the examples picked', () => {
    const notes = exampleSetup(['crud', 'checkout'])
    expect(notes).toContain('- crud:')
    expect(notes).toContain('STRIPE_SECRET_KEY')
    expect(notes).not.toContain('- board:')
    expect(exampleSetup([])).toBe('')
  })
})
