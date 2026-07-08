/**
 * Tests for `cascivo doctor --drift`. The registry fetch goes through
 * `globalThis.fetch` (mocked here, mirroring add.integration.test.ts) so no
 * network I/O happens.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runDoctorDrift } from './drift.js'
import { createLock, updateLockEntry, writeLock } from '../utils/lock.js'
import type { CascadeConfig } from '../utils/config.js'

const FIXTURE_REGISTRY = {
  version: '0.0.0',
  generatedAt: '2026-07-08',
  components: [
    {
      name: 'data-table',
      type: 'component',
      description: 'Data table',
      category: 'display',
      version: '0.4.1',
      files: ['https://example.com/data-table/data-table.tsx'],
      dependencies: ['@cascivo/core', '@cascivo/i18n'],
      peerVersions: { '@cascivo/i18n': '>=0.2.0' },
      tags: [],
    },
  ],
  blocks: [],
}

function mockFetch() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    return new Response(JSON.stringify(FIXTURE_REGISTRY), { status: 200 })
  })
}

async function installFakePackage(cwd: string, name: string, version: string): Promise<void> {
  const pkgDir = join(cwd, 'node_modules', name)
  await mkdir(pkgDir, { recursive: true })
  await writeFile(join(pkgDir, 'package.json'), JSON.stringify({ name, version }), 'utf8')
}

const config: CascadeConfig = {
  registry: 'https://example.com/registry.json',
  outputDir: 'components',
  theme: 'light',
}

describe('doctor --drift', () => {
  let dir: string
  let fetchSpy: ReturnType<typeof mockFetch>
  let logs: string[]
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'cascivo-drift-'))
    fetchSpy = mockFetch()
    logs = []
    logSpy = vi.spyOn(console, 'log').mockImplementation((msg: string) => {
      logs.push(msg)
    })
  })

  afterEach(async () => {
    fetchSpy.mockRestore()
    logSpy.mockRestore()
    process.exitCode = 0
    await rm(dir, { recursive: true, force: true })
  })

  it('reports no drift when there is no lockfile', async () => {
    await runDoctorDrift(config, dir)
    expect(logs.some((l) => l.includes('No installed components'))).toBe(true)
  })

  it('reproduces the DataTable/i18n incident: flags an under-floor installed peer', async () => {
    await installFakePackage(dir, '@cascivo/i18n', '0.1.11')
    const lock = updateLockEntry(createLock(), 'data-table', {
      registry: 'https://example.com',
      version: '0.4.1',
      installedAt: '2026-07-08',
      files: {},
    })
    await writeLock(lock, dir)

    await runDoctorDrift(config, dir)

    expect(logs.some((l) => l.includes('needs @cascivo/i18n >=0.2.0'))).toBe(true)
    expect(process.exitCode).toBe(1)
  })

  it('reports clean when the installed peer satisfies the floor', async () => {
    await installFakePackage(dir, '@cascivo/i18n', '0.2.1')
    const lock = updateLockEntry(createLock(), 'data-table', {
      registry: 'https://example.com',
      version: '0.4.1',
      installedAt: '2026-07-08',
      files: {},
    })
    await writeLock(lock, dir)

    await runDoctorDrift(config, dir)

    expect(logs.some((l) => l.includes('No drift detected'))).toBe(true)
    expect(process.exitCode).toBe(0)
  })

  it('flags a locally-edited file whose content no longer matches the recorded hash', async () => {
    const filePath = join(dir, 'components', 'data-table', 'data-table.tsx')
    await mkdir(join(dir, 'components', 'data-table'), { recursive: true })
    await writeFile(filePath, 'edited by hand', 'utf8')
    await installFakePackage(dir, '@cascivo/i18n', '0.2.1')

    const lock = updateLockEntry(createLock(), 'data-table', {
      registry: 'https://example.com',
      version: '0.4.1',
      installedAt: '2026-07-08',
      files: { [filePath]: 'sha256-not-matching' },
    })
    await writeLock(lock, dir)

    await runDoctorDrift(config, dir)

    expect(logs.some((l) => l.includes('has local edits'))).toBe(true)
    expect(process.exitCode).toBe(1)
  })
})
