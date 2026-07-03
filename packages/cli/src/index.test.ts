import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { run, VERSION } from './index.js'

describe('cascade CLI', () => {
  it('exports the package version, not a stale constant', () => {
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '../package.json'), 'utf8')) as {
      version: string
    }
    expect(VERSION).toBe(pkg.version)
    expect(VERSION).not.toBe('0.0.0')
  })
})

describe('per-command --help', () => {
  let logs: string[]
  let errors: string[]

  beforeEach(() => {
    logs = []
    errors = []
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '))
    })
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.join(' '))
    })
    process.exitCode = undefined
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = undefined
  })

  const COMMANDS = [
    'create',
    'init',
    'add',
    'list',
    'update',
    'search',
    'view',
    'theme',
    'eject',
    'generate',
    'doctor',
    'audit',
    'registry',
    'template',
    'tokens',
  ]

  for (const command of COMMANDS) {
    it(`${command} --help prints usage without running the command`, async () => {
      await run([command, '--help'])
      expect(errors).toEqual([])
      expect(process.exitCode).toBeUndefined()
      expect(logs.join('\n')).toContain(`Usage: cascivo ${command}`)
    })
  }

  it('-h behaves like --help', async () => {
    await run(['add', '-h'])
    expect(logs.join('\n')).toContain('Usage: cascivo add')
    expect(errors).toEqual([])
  })

  it('help interception runs before argument handling (no fetch, no install)', async () => {
    // "add --help" used to try to install a component literally named --help.
    await run(['add', '--help'])
    expect(logs.join('\n')).not.toContain('not found in registry')
  })
})
