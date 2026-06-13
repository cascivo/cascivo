import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  applyEnvOverrides,
  DEFAULT_CONFIG,
  detectPackageManager,
  installCommand,
  loadConfig,
  resolveConfig,
} from './config.js'

describe('applyEnvOverrides', () => {
  it('returns the config unchanged when no env vars are set', () => {
    expect(applyEnvOverrides(DEFAULT_CONFIG, {})).toEqual(DEFAULT_CONFIG)
  })

  it('overrides outputDir and registry from env vars', () => {
    const config = applyEnvOverrides(DEFAULT_CONFIG, {
      CASCIVO_OUTPUT_DIR: 'app/ui',
      CASCIVO_REGISTRY: 'https://example.com/r.json',
    })
    expect(config.outputDir).toBe('app/ui')
    expect(config.registry).toBe('https://example.com/r.json')
    expect(config.theme).toBe(DEFAULT_CONFIG.theme)
  })
})

describe('resolveConfig', () => {
  it('returns defaults for null/undefined', () => {
    expect(resolveConfig(null)).toEqual(DEFAULT_CONFIG)
    expect(resolveConfig(undefined)).toEqual(DEFAULT_CONFIG)
  })

  it('overrides only provided keys', () => {
    const config = resolveConfig({ outputDir: 'app/ui', theme: 'dark' })
    expect(config.outputDir).toBe('app/ui')
    expect(config.theme).toBe('dark')
    expect(config.registry).toBe(DEFAULT_CONFIG.registry)
  })
})

describe('detectPackageManager', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'cascade-pm-'))
  })
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('defaults to npm when no lock file exists', () => {
    expect(detectPackageManager(dir)).toBe('npm')
  })

  it('detects pnpm from pnpm-lock.yaml', async () => {
    await writeFile(join(dir, 'pnpm-lock.yaml'), '')
    expect(detectPackageManager(dir)).toBe('pnpm')
  })

  it('detects yarn from yarn.lock', async () => {
    await writeFile(join(dir, 'yarn.lock'), '')
    expect(detectPackageManager(dir)).toBe('yarn')
  })
})

describe('installCommand', () => {
  it('uses "install" for npm and "add" otherwise', () => {
    expect(installCommand('npm', ['react'])).toEqual(['npm', ['install', 'react']])
    expect(installCommand('pnpm', ['react'])).toEqual(['pnpm', ['add', 'react']])
  })
})

describe('resolveConfig back-compat (no registries key)', () => {
  it('pre-v11 configs without registries key stay valid', () => {
    const config = resolveConfig({ outputDir: 'app/ui' })
    expect(config.registries).toBeUndefined()
    expect(config.registry).toBe(DEFAULT_CONFIG.registry)
  })
})

describe('loadConfig', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'cascade-cfg-'))
  })
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('falls back to defaults when no config file exists', async () => {
    expect(await loadConfig(dir)).toEqual(DEFAULT_CONFIG)
  })

  it('loads and merges a cascivo.config.ts default export', async () => {
    await writeFile(
      join(dir, 'cascivo.config.ts'),
      `export default { outputDir: 'lib/ui', theme: 'warm' }\n`,
    )
    const config = await loadConfig(dir)
    expect(config.outputDir).toBe('lib/ui')
    expect(config.theme).toBe('warm')
    expect(config.registry).toBe(DEFAULT_CONFIG.registry)
  })
})
