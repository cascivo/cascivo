import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkPeerVersions, readInstalledPackageVersion } from './peer-versions.js'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'cascivo-peer-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

async function installFakePackage(cwd: string, name: string, version: string): Promise<void> {
  const pkgDir = join(cwd, 'node_modules', name)
  await mkdir(pkgDir, { recursive: true })
  await writeFile(join(pkgDir, 'package.json'), JSON.stringify({ name, version }), 'utf8')
}

describe('readInstalledPackageVersion', () => {
  it('returns null when the package is not installed', async () => {
    expect(await readInstalledPackageVersion(dir, '@cascivo/i18n')).toBeNull()
  })

  it('reads the installed version', async () => {
    await installFakePackage(dir, '@cascivo/i18n', '0.1.11')
    expect(await readInstalledPackageVersion(dir, '@cascivo/i18n')).toBe('0.1.11')
  })
})

describe('checkPeerVersions', () => {
  it('reproduces the DataTable/i18n incident: reports a violation for an under-floor install', async () => {
    await installFakePackage(dir, '@cascivo/i18n', '0.1.11')
    const violations = await checkPeerVersions(dir, { '@cascivo/i18n': '>=0.2.0' })
    expect(violations).toEqual([{ pkg: '@cascivo/i18n', required: '>=0.2.0', installed: '0.1.11' }])
  })

  it('reports no violations when the installed version satisfies the floor', async () => {
    await installFakePackage(dir, '@cascivo/i18n', '0.2.1')
    const violations = await checkPeerVersions(dir, { '@cascivo/i18n': '>=0.2.0' })
    expect(violations).toEqual([])
  })

  it('reports a violation when the package is not installed at all', async () => {
    const violations = await checkPeerVersions(dir, { '@cascivo/i18n': '>=0.2.0' })
    expect(violations).toEqual([{ pkg: '@cascivo/i18n', required: '>=0.2.0', installed: null }])
  })
})
