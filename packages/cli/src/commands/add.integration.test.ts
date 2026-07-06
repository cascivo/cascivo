/**
 * Integration tests for the `add` command.
 *
 * Both the registry fetch and individual file fetches go through
 * `globalThis.fetch`, which we mock here to avoid any network I/O.
 * Package installation is also mocked to avoid spawning a real package manager.
 */
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { add } from './add.js'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

vi.mock('../utils/exec.js', () => ({
  installPackages: vi.fn().mockReturnValue(true),
}))

// ---------------------------------------------------------------------------
// Minimal registry fixture — only the entries we need for these tests
// ---------------------------------------------------------------------------
const FIXTURE_REGISTRY = {
  version: '0.0.0',
  generatedAt: '2026-06-10',
  components: [
    {
      name: 'layout/app-shell',
      type: 'layout',
      description: 'App shell',
      category: 'layout',
      version: '0.0.0',
      files: [
        'https://example.com/app-shell/app-shell.tsx',
        'https://example.com/app-shell/app-shell.module.css',
      ],
      dependencies: ['@cascivo/core'],
      tags: [],
    },
  ],
  blocks: [
    {
      name: 'users-table-page',
      type: 'block',
      displayName: 'Users Table Page',
      description: 'Users table page',
      category: 'display',
      version: '0.0.0',
      files: ['https://example.com/blocks/users-table-page/users-table-page.tsx'],
      dependencies: ['@cascivo/react'],
      tags: [],
      screenshot: { light: '', dark: '' },
    },
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mockFetch() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : (input as Request).url

    // Registry request — return JSON
    if (url.includes('registry')) {
      return new Response(JSON.stringify(FIXTURE_REGISTRY), { status: 200 })
    }

    // Any component file request — return a simple stub
    return new Response('// mocked', { status: 200 })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('add command (integration)', () => {
  let tmpDir: string
  let fetchSpy: ReturnType<typeof mockFetch>
  let originalCwd: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'cascade-cli-test-'))
    fetchSpy = mockFetch()
    // `add` writes cascivo.lock to process.cwd(); run inside the temp dir so the
    // lockfile lands there (cleaned up below) instead of polluting packages/cli.
    originalCwd = process.cwd()
    process.chdir(tmpDir)
  })

  afterEach(async () => {
    fetchSpy.mockRestore()
    process.chdir(originalCwd)
    await rm(tmpDir, { recursive: true, force: true })
  })

  const baseConfig = (outputDir: string) => ({
    registry: 'https://example.com/registry.json',
    outputDir,
    theme: 'light' as const,
  })

  it('writes layout/app-shell files to app-shell/ (prefix stripped)', async () => {
    const outputDir = join(tmpDir, 'components')
    await add(['layout/app-shell'], baseConfig(outputDir))

    const tsx = join(outputDir, 'app-shell', 'app-shell.tsx')
    const css = join(outputDir, 'app-shell', 'app-shell.module.css')

    expect(existsSync(tsx), `expected ${tsx} to exist`).toBe(true)
    expect(existsSync(css), `expected ${css} to exist`).toBe(true)
    expect(await readFile(tsx, 'utf8')).toBe('// mocked')
  })

  it('writes block/users-table-page files to users-table-page/ (prefix stripped)', async () => {
    const outputDir = join(tmpDir, 'components')
    await add(['block/users-table-page'], baseConfig(outputDir))

    const tsx = join(outputDir, 'users-table-page', 'users-table-page.tsx')
    expect(existsSync(tsx), `expected ${tsx} to exist`).toBe(true)
    expect(await readFile(tsx, 'utf8')).toBe('// mocked')
  })

  it('resolves app-shell via suffix match (no prefix) when unambiguous', async () => {
    const outputDir = join(tmpDir, 'components')
    await add(['app-shell'], baseConfig(outputDir))

    const tsx = join(outputDir, 'app-shell', 'app-shell.tsx')
    expect(existsSync(tsx), `expected suffix match to resolve and write ${tsx}`).toBe(true)
  })
})
