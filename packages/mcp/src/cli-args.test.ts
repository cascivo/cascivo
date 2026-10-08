import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { THEMES, addArgs, createAppArgs } from './cli-args.js'

describe('THEMES', () => {
  it('equals the themes `cascivo create --theme` accepts', () => {
    const source = readFileSync(join(import.meta.dirname, '../../cli/src/utils/config.ts'), 'utf8')
    const block = source.match(/export const THEMES = \[([\s\S]*?)\] as const/)?.[1] ?? ''
    const cli = [...block.matchAll(/'([\w-]+)'/g)].map((m) => m[1])
    expect(cli.length).toBeGreaterThan(3)
    expect([...THEMES]).toEqual(cli)
  })
})

describe('createAppArgs', () => {
  it('maps every input to its CLI flag', () => {
    expect(
      createAppArgs({
        name: 'acme',
        theme: 'midnight',
        framework: 'cloudflare',
        examples: ['crud', 'board'],
        auth: 'email',
        sections: ['Overview', 'Users'],
        template: 'dashboard',
        workspace: true,
      }),
    ).toEqual([
      '-y',
      'cascivo',
      'create',
      'acme',
      '--yes',
      '--framework',
      'cloudflare',
      '--example',
      'crud,board',
      '--auth',
      'email',
      '--theme',
      'midnight',
      '--sections',
      'Overview, Users',
      '--workspace',
      '--template',
      'dashboard',
    ])
  })

  it('refuses a name or template that would be read as a flag', () => {
    expect(() => createAppArgs({ name: '--help' })).toThrow(/must not start with "-"/)
    expect(() => createAppArgs({ name: 'a', template: '-x' })).toThrow(/must not start with "-"/)
  })
})

describe('addArgs', () => {
  it('adds several components in one CLI call', () => {
    expect(addArgs(['card', 'stat', 'data-table'])).toEqual([
      '-y',
      'cascivo',
      'add',
      'card',
      'stat',
      'data-table',
    ])
  })

  it('refuses an empty list and flag-shaped names', () => {
    expect(() => addArgs([])).toThrow(/at least one/)
    expect(() => addArgs(['card', '--registry=https://evil.example'])).toThrow(/must not start/)
  })
})
