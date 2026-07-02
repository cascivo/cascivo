import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { VERSION } from './index.js'

describe('@cascivo/mcp', () => {
  it('exports the package version, not a stale constant', () => {
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '../package.json'), 'utf8')) as {
      version: string
    }
    expect(VERSION).toBe(pkg.version)
    expect(VERSION).not.toBe('0.0.0')
  })
})
