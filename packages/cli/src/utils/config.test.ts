import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  applyEnvOverrides,
  DEFAULT_CONFIG,
  detectPackageManager,
  installCommand,
  installHint,
  isPackageManager,
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

  // Pass an empty env so the test runner's own npm_config_user_agent (pnpm)
  // doesn't shadow the lock-file signal these cases are checking.
  it('defaults to npm when no lock file exists', () => {
    expect(detectPackageManager(dir, { env: {} })).toBe('npm')
  })

  it('detects pnpm from pnpm-lock.yaml', async () => {
    await writeFile(join(dir, 'pnpm-lock.yaml'), '')
    expect(detectPackageManager(dir, { env: {} })).toBe('pnpm')
  })

  it('detects yarn from yarn.lock', async () => {
    await writeFile(join(dir, 'yarn.lock'), '')
    expect(detectPackageManager(dir, { env: {} })).toBe('yarn')
  })

  it('detects bun from the text lockfile bun.lock', async () => {
    await writeFile(join(dir, 'bun.lock'), '')
    expect(detectPackageManager(dir, { env: {} })).toBe('bun')
  })

  it('walks up to a workspace-root lock file from an app subdirectory', async () => {
    // pnpm monorepo: lock file at the root, CLI run from apps/web (the report's case).
    await writeFile(join(dir, 'pnpm-lock.yaml'), '')
    const appDir = join(dir, 'apps', 'web')
    await mkdir(appDir, { recursive: true })
    expect(detectPackageManager(appDir, { env: {} })).toBe('pnpm')
  })

  it('reads the packageManager corepack field when no lock file exists', async () => {
    await writeFile(join(dir, 'package.json'), JSON.stringify({ packageManager: 'yarn@4.2.0' }))
    expect(detectPackageManager(dir, { env: {} })).toBe('yarn')
  })

  it('does not walk past a directory containing .git', async () => {
    // Lock file above the repo boundary must not be picked up.
    await writeFile(join(dir, 'pnpm-lock.yaml'), '')
    const repo = join(dir, 'repo')
    await mkdir(join(repo, '.git'), { recursive: true })
    expect(detectPackageManager(repo, { env: {} })).toBe('npm')
  })

  it('prefers npm_config_user_agent over a lock file in cwd', async () => {
    await writeFile(join(dir, 'package-lock.json'), '')
    expect(
      detectPackageManager(dir, { env: { npm_config_user_agent: 'pnpm/9.0.0 npm/? node/v22' } }),
    ).toBe('pnpm')
  })

  it('lets a lock file outrank the user agent when preferLockfileOverUserAgent is set', async () => {
    // `cascivo create` passes this. `npx cascivo create` always reports an npm user agent
    // regardless of the surrounding workspace, and that used to short-circuit before the
    // lock-file walk-up ran — so scaffolding into a pnpm workspace printed `npm install`
    // (2026-08-14 §11). Where the project lands beats which launcher started the CLI.
    await writeFile(join(dir, 'pnpm-lock.yaml'), '')
    expect(
      detectPackageManager(dir, {
        preferLockfileOverUserAgent: true,
        env: { npm_config_user_agent: 'npm/10.9.0 node/v22' },
      }),
    ).toBe('pnpm')
  })

  it('still falls back to the user agent when no lock file exists anywhere', async () => {
    // The empty-directory case `create` was originally written for: with nothing to walk up
    // to, the launcher is the only signal there is.
    expect(
      detectPackageManager(dir, {
        preferLockfileOverUserAgent: true,
        env: { npm_config_user_agent: 'yarn/4.2.0 npm/? node/v22' },
      }),
    ).toBe('yarn')
  })

  it('prefers the CASCIVO_PACKAGE_MANAGER env var over the user agent', async () => {
    expect(
      detectPackageManager(dir, {
        env: { CASCIVO_PACKAGE_MANAGER: 'bun', npm_config_user_agent: 'pnpm/9.0.0' },
      }),
    ).toBe('bun')
  })

  it('prefers an explicit override above everything else', async () => {
    await writeFile(join(dir, 'pnpm-lock.yaml'), '')
    expect(
      detectPackageManager(dir, {
        override: 'yarn',
        env: { CASCIVO_PACKAGE_MANAGER: 'bun', npm_config_user_agent: 'npm/10' },
      }),
    ).toBe('yarn')
  })

  it('ignores an invalid override and falls through', async () => {
    await writeFile(join(dir, 'pnpm-lock.yaml'), '')
    expect(detectPackageManager(dir, { override: 'rush', env: {} })).toBe('pnpm')
  })
})

describe('isPackageManager', () => {
  it('accepts known managers and rejects the rest', () => {
    expect(isPackageManager('pnpm')).toBe(true)
    expect(isPackageManager('bun')).toBe(true)
    expect(isPackageManager('rush')).toBe(false)
    expect(isPackageManager(undefined)).toBe(false)
  })
})

describe('installCommand', () => {
  it('uses "install" for npm and "add" otherwise', () => {
    expect(installCommand('npm', ['react'])).toEqual(['npm', ['install', 'react']])
    expect(installCommand('pnpm', ['react'])).toEqual(['pnpm', ['add', 'react']])
  })

  it('adds the dev flag per package manager', () => {
    expect(installCommand('npm', ['cascivo'], { dev: true })).toEqual([
      'npm',
      ['install', '--save-dev', 'cascivo@latest'],
    ])
    expect(installCommand('pnpm', ['cascivo'], { dev: true })).toEqual([
      'pnpm',
      ['add', '-D', 'cascivo@latest'],
    ])
  })

  it('pins every cascivo package to an explicit version', () => {
    // A bare name lets the package manager reuse whatever it already has resolvable. In a
    // pnpm workspace a sibling's lockfile entry won and @cascivo/i18n resolved to 0.2.14
    // while latest was 0.16.0 — then cascivo warned about the version it had just installed.
    const [, args] = installCommand('pnpm', ['@cascivo/core', '@cascivo/tokens'])
    for (const arg of args.slice(1)) {
      expect(arg, `${arg} must carry a version specifier`).toMatch(/@cascivo\/[a-z-]+@.+/)
    }
  })

  it("leaves non-cascivo packages bare — their version is the app's business", () => {
    expect(installCommand('pnpm', ['@preact/signals-react'])).toEqual([
      'pnpm',
      ['add', '@preact/signals-react'],
    ])
  })

  it('honours a registry peer floor instead of silently ignoring it', () => {
    const [, args] = installCommand('pnpm', ['@cascivo/i18n'], {
      floors: { '@cascivo/i18n': '>=0.2.1' },
    })
    // `>=x.y.z` is not installable on its own, so it is widened to a real range.
    expect(args).toEqual(['add', '@cascivo/i18n@0.2.1 - x'])
  })

  it('respects an explicit --pin', () => {
    const [, args] = installCommand('pnpm', ['@cascivo/core'], { pin: '0.16.0' })
    expect(args).toEqual(['add', '@cascivo/core@0.16.0'])
  })
})

describe('installHint', () => {
  it('renders a copy-pasteable command string', () => {
    // Delegates to installCommand, so the hint is exactly what the CLI itself runs —
    // a recovery command that differs from the failed one is a trap.
    expect(installHint('pnpm', ['@cascivo/core', '@cascivo/tokens'])).toBe(
      'pnpm add @cascivo/core@latest @cascivo/tokens@latest',
    )
    expect(installHint('npm', ['cascivo'], { dev: true })).toBe(
      'npm install --save-dev cascivo@latest',
    )
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
