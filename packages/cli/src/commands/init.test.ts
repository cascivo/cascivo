/**
 * Tests for `cascivo init`. `installPackages` is mocked so no real package
 * manager is spawned; we assert on which packages init would install and on the
 * guidance it prints.
 */
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const installPackages = vi.fn().mockReturnValue(true)
vi.mock('../utils/exec.js', () => ({ installPackages }))

const { init } = await import('./init.js')

const RUNTIME = ['@cascivo/core', '@cascivo/tokens', '@cascivo/themes', '@preact/signals-react']

describe('init', () => {
  let dir: string
  let logs: string[]

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'cascade-init-'))
    logs = []
    installPackages.mockClear()
    vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
      logs.push(a.join(' '))
    })
    vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
      logs.push(a.join(' '))
    })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    process.exitCode = 0
    await rm(dir, { recursive: true, force: true })
  })

  it('writes cascivo.config.ts and installs the full runtime + dev dependency set', async () => {
    await init(['--yes'], dir)

    const config = await readFile(join(dir, 'cascivo.config.ts'), 'utf8')
    expect(config).toContain("theme: 'light'")
    expect(config).toContain("from 'cascivo'")

    expect(installPackages).toHaveBeenCalledWith(
      RUNTIME,
      dir,
      expect.objectContaining({ pm: expect.any(String) }),
    )
    expect(installPackages).toHaveBeenCalledWith(
      ['cascivo'],
      dir,
      expect.objectContaining({ dev: true }),
    )

    const out = logs.join('\n')
    expect(out).toContain('Dependencies')
    expect(out).toContain('@preact/signals-react')
    expect(out).toContain("import '@cascivo/themes/light.css'")
  })

  it('--no-install writes files, installs nothing, and prints the commands', async () => {
    await init(['--yes', '--no-install'], dir)

    expect(installPackages).not.toHaveBeenCalled()
    const out = logs.join('\n')
    expect(out).toContain('--no-install')
    expect(out).toContain('@preact/signals-react')
    expect(out).toContain('cascivo') // the dev-dep hint
  })

  it('honors an explicit --pm', async () => {
    await init(['--yes', '--pm', 'bun'], dir)
    expect(installPackages).toHaveBeenCalledWith(
      RUNTIME,
      dir,
      expect.objectContaining({ pm: 'bun' }),
    )
  })

  it('rejects an unknown --pm without installing anything', async () => {
    await init(['--yes', '--pm', 'rush'], dir)
    expect(installPackages).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })

  it('points at the ESLint recipe only when the project has an ESLint config', async () => {
    await init(['--yes', '--no-install'], dir)
    expect(logs.join('\n')).not.toContain('USING-WITH-STRICT-ESLINT')

    logs.length = 0
    await writeFile(join(dir, 'eslint.config.js'), 'export default []\n')
    await init(['--yes', '--no-install'], dir)
    expect(logs.join('\n')).toContain('USING-WITH-STRICT-ESLINT.md')
  })
})
