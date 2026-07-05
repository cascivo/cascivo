/**
 * Tests for `cascivo theme create` — the /create theme-builder handoff.
 * The command writes a file to process.cwd(), so each test runs inside a temp
 * dir (chdir in beforeEach / restore in afterEach), matching add.integration.test.ts.
 */
import { existsSync } from 'node:fs'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configToHash } from '@cascivo/theme-kit'
import { theme } from './theme.js'

describe('theme create command', () => {
  let tmpDir: string
  let originalCwd: string
  const hash = configToHash({
    baseMode: 'dark',
    accentHue: 20,
    accentChroma: 0.2,
    radiusBase: 0.5,
    fontFamily: 'geometric',
    presetId: null,
  })

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'cascade-theme-test-'))
    originalCwd = process.cwd()
    process.chdir(tmpDir)
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    await rm(tmpDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('writes <name>.theme.css scoped to the given data-theme', async () => {
    await theme(['create', 'acme', '--from', hash])
    const file = join(tmpDir, 'acme.theme.css')
    expect(existsSync(file)).toBe(true)
    const css = await readFile(file, 'utf8')
    expect(css).toContain('[data-theme="acme"]')
    expect(css).toContain('--cascivo-radius-base: 0.5rem')
    expect(css).toContain('Century Gothic') // geometric font stack
  })

  it('honors --out', async () => {
    await theme(['create', 'acme', '--from', hash, '--out', 'styles/brand.css'])
    expect(existsSync(join(tmpDir, 'styles/brand.css'))).toBe(true)
  })

  it('--dry-run prints without writing', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    await theme(['create', 'acme', '--from', hash, '--dry-run'])
    expect(existsSync(join(tmpDir, 'acme.theme.css'))).toBe(false)
    expect(log.mock.calls.flat().join('\n')).toContain('[data-theme="acme"]')
  })

  it('rejects an invalid theme name without writing', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    await theme(['create', 'Acme Theme', '--from', hash])
    expect(existsSync(join(tmpDir, 'Acme Theme.theme.css'))).toBe(false)
    expect(err).toHaveBeenCalled()
  })

  it('rejects a malformed --from without writing', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    await theme(['create', 'acme', '--from', '!!!not-base64!!!'])
    expect(existsSync(join(tmpDir, 'acme.theme.css'))).toBe(false)
    expect(err).toHaveBeenCalled()
  })
})
