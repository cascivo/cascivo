import { rm, readFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { RegistryIndex, RegistryItem } from '@cascivo/registry'
import { registryBuild, validateTemplates } from './registry.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURE = join(HERE, '../../test/fixtures/registry-author')
const TMP_OUT = join(FIXTURE, '__out__')

beforeEach(async () => {
  await mkdir(TMP_OUT, { recursive: true })
})

afterEach(async () => {
  await rm(TMP_OUT, { recursive: true, force: true })
  process.exitCode = 0
})

describe('cascade registry build', () => {
  it('builds valid fixture registry to output dir', async () => {
    await registryBuild(['--in', join(FIXTURE, 'cascade-registry.json'), '--out', TMP_OUT])
    expect(process.exitCode).toBeFalsy()

    const index = JSON.parse(await readFile(join(TMP_OUT, 'registry.json'), 'utf8')) as {
      schemaVersion: number
      items: { name: string }[]
    }
    expect(index.schemaVersion).toBe(2)
    expect(index.items.map((i) => i.name).sort()).toEqual(['callout', 'step-list'])

    const callout = JSON.parse(await readFile(join(TMP_OUT, 'callout.json'), 'utf8')) as {
      name: string
      version: string
    }
    expect(callout.name).toBe('callout')

    await readFile(join(TMP_OUT, 'callout@1.0.0.json'), 'utf8')
  })

  it('exits non-zero when file does not exist', async () => {
    await registryBuild(['--in', join(FIXTURE, 'does-not-exist.json'), '--out', TMP_OUT])
    expect(process.exitCode).toBe(1)
  })
})

const TEMPLATE: RegistryItem = {
  schemaVersion: 2,
  name: 'dashboard',
  type: 'template',
  description: 'Dashboard template',
  version: '1.0.0',
  license: 'MIT',
  files: [{ url: 'https://example.com/p.tsx', target: 'src/pages/dashboard.tsx' }],
  dependencies: [],
  registryDependencies: ['card'],
  tags: ['dashboard'],
  meta: {
    intent: 'Dashboard',
    framework: 'react-vite',
    category: 'dashboard',
    screenshots: [{ light: 'https://example.com/l.png', alt: 'preview' }],
    fileRoles: { 'src/pages/dashboard.tsx': 'page' },
  },
}

const CARD: RegistryItem = {
  schemaVersion: 2,
  name: 'card',
  type: 'component',
  description: 'A card',
  version: '1.0.0',
  files: [{ url: 'https://example.com/card.tsx' }],
  dependencies: [],
  tags: [],
}

describe('validateTemplates', () => {
  it('passes when the template is valid and its component is in the index', () => {
    const index: RegistryIndex = { schemaVersion: 2, name: 'x', items: [TEMPLATE, CARD] }
    expect(validateTemplates(index)).toEqual({ errors: [], warnings: [] })
  })

  it('warns when a bare component dep is not in the index', () => {
    const index: RegistryIndex = { schemaVersion: 2, name: 'x', items: [TEMPLATE] }
    const result = validateTemplates(index)
    expect(result.errors).toEqual([])
    expect(result.warnings.some((w) => w.includes('card'))).toBe(true)
  })

  it('errors when a template is malformed (missing license)', () => {
    const { license: _, ...bad } = TEMPLATE
    const index: RegistryIndex = { schemaVersion: 2, name: 'x', items: [bad as RegistryItem, CARD] }
    expect(validateTemplates(index).errors.some((e) => e.includes('license'))).toBe(true)
  })

  it('ignores non-template items', () => {
    const index: RegistryIndex = { schemaVersion: 2, name: 'x', items: [CARD] }
    expect(validateTemplates(index)).toEqual({ errors: [], warnings: [] })
  })
})
