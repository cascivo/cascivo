import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { validateItem, validateIndex, parseLegacyRegistry, parseItem } from './validate.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..', '..')

const VALID_ITEM = {
  schemaVersion: 2 as const,
  name: 'button',
  type: 'component' as const,
  description: 'A button component',
  version: '1.0.0',
  files: [{ url: 'https://example.com/button.tsx' }],
  dependencies: [],
  tags: ['input'],
}

describe('validateItem', () => {
  it('accepts a valid v2 item', () => {
    const result = validateItem(VALID_ITEM)
    expect(result.ok).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when schemaVersion is wrong', () => {
    const result = validateItem({ ...VALID_ITEM, schemaVersion: 1 })
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('schemaVersion'))).toBe(true)
  })

  it('fails when name is missing', () => {
    const { name: _, ...rest } = VALID_ITEM
    const result = validateItem(rest)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('name'))).toBe(true)
  })

  it('fails when type is invalid', () => {
    const result = validateItem({ ...VALID_ITEM, type: 'widget' })
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('type'))).toBe(true)
  })

  it('fails when files is missing', () => {
    const { files: _, ...rest } = VALID_ITEM
    const result = validateItem(rest)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('files'))).toBe(true)
  })

  it('warns on unknown fields', () => {
    const result = validateItem({ ...VALID_ITEM, unknownProp: true })
    expect(result.ok).toBe(true)
    expect(result.warnings.some((w) => w.includes('unknownProp'))).toBe(true)
  })

  it('validates advisory fields', () => {
    const result = validateItem({
      ...VALID_ITEM,
      advisories: [
        {
          id: 'CSA-001',
          severity: 'high',
          affectedVersions: '<1.0.0',
          summary: 'Test advisory',
        },
      ],
    })
    expect(result.ok).toBe(true)
  })

  it('fails on duplicate advisory ids', () => {
    const result = validateItem({
      ...VALID_ITEM,
      advisories: [
        { id: 'CSA-001', severity: 'low', affectedVersions: '<1.0.0', summary: 'A' },
        { id: 'CSA-001', severity: 'low', affectedVersions: '<1.0.0', summary: 'B' },
      ],
    })
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('CSA-001'))).toBe(true)
  })
})

describe('validateIndex', () => {
  it('accepts a valid index', () => {
    const result = validateIndex({ schemaVersion: 2, name: 'test', items: [VALID_ITEM] })
    expect(result.ok).toBe(true)
  })

  it('fails when items is not an array', () => {
    const result = validateIndex({ schemaVersion: 2, name: 'test', items: null })
    expect(result.ok).toBe(false)
  })

  it('bubbles item errors with index prefix', () => {
    const result = validateIndex({
      schemaVersion: 2,
      name: 'test',
      items: [{ ...VALID_ITEM, schemaVersion: 1 }],
    })
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.startsWith('items[0]'))).toBe(true)
  })
})

describe('parseLegacyRegistry', () => {
  it('lifts legacy registry to v2 index', async () => {
    const raw = JSON.parse(await readFile(join(REPO_ROOT, 'registry.json'), 'utf8')) as unknown
    const index = parseLegacyRegistry(raw)
    expect(index.schemaVersion).toBe(2)
    expect(index.homepage).toBe('https://cascivo.com')
    expect(index.items.length).toBeGreaterThan(0)
    for (const item of index.items) {
      expect(item.schemaVersion).toBe(2)
      expect(typeof item.name).toBe('string')
      expect(Array.isArray(item.files)).toBe(true)
    }
  })

  it('carries registryDependencies from legacy entries', () => {
    const raw = {
      version: '1.0.0',
      components: [
        { name: 'dropdown', type: 'component', registryDependencies: ['popover', 'button'] },
      ],
    }
    const index = parseLegacyRegistry(raw)
    expect(index.items[0]?.registryDependencies).toEqual(['popover', 'button'])
  })

  it('folds the blocks array into items with a block/ name prefix', () => {
    const raw = {
      version: '1.0.0',
      components: [{ name: 'button', type: 'component' }],
      blocks: [
        {
          name: 'dashboard-overview',
          type: 'block',
          description: 'KPI stat cards',
          files: ['https://example.com/dashboard-overview.tsx'],
        },
      ],
    }
    const index = parseLegacyRegistry(raw)
    const block = index.items.find((i) => i.name === 'block/dashboard-overview')
    expect(block).toBeDefined()
    expect(block?.type).toBe('block')
    expect(block?.description).toBe('KPI stat cards')
    expect(block?.files).toEqual([{ url: 'https://example.com/dashboard-overview.tsx' }])
  })

  it('does not double-prefix a block name that already carries block/', () => {
    const raw = {
      version: '1.0.0',
      components: [],
      blocks: [{ name: 'block/console-app', type: 'block' }],
    }
    const index = parseLegacyRegistry(raw)
    expect(index.items.map((i) => i.name)).toEqual(['block/console-app'])
  })
})

describe('path safety at the install boundary', () => {
  // `files[].target` and `name` both reach `resolve(cwd, …)` and then
  // `writeFileSafe` in the CLI's add path. Before these checks existed, a
  // registry could hand back any of the payloads below and get an arbitrary
  // file write on the machine running `cascivo add`.
  const ESCAPES = [
    '../../.zshrc',
    '../.bashrc',
    '/etc/cron.d/pwn',
    '/tmp/pwn',
    'a/../../b',
    '..',
    'C:\\Windows\\System32\\drivers\\etc\\hosts',
    '\\\\unc\\share\\pwn',
  ]

  it.each(ESCAPES)('rejects a files[].target of %j', (target) => {
    const result = validateItem({
      ...VALID_ITEM,
      type: 'template',
      files: [{ url: 'https://e/x', target }],
    })
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain('files[0].target')
  })

  it.each(ESCAPES)('rejects an item name of %j', (name) => {
    const result = validateItem({ ...VALID_ITEM, name })
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain('name must be a relative path')
  })

  it('still accepts ordinary in-project targets', () => {
    const result = validateItem({
      ...VALID_ITEM,
      type: 'template',
      files: [{ url: 'https://e/x', target: 'src/routes/index.tsx' }],
    })
    expect(result.ok).toBe(true)
  })

  it('rejects a files entry that is not an object, or has no url', () => {
    expect(validateItem({ ...VALID_ITEM, files: ['nope'] }).errors.join()).toContain(
      'files[0] must be an object',
    )
    expect(validateItem({ ...VALID_ITEM, files: [{}] }).errors.join()).toContain('files[0].url')
  })
})

describe('parseItem', () => {
  it('returns the item when valid', () => {
    expect(parseItem(VALID_ITEM, 'https://e/r.json').name).toBe('button')
  })

  it('throws naming the source when invalid', () => {
    expect(() => parseItem({ ...VALID_ITEM, name: '../../x' }, 'https://evil/r.json')).toThrow(
      /Invalid registry item from https:\/\/evil\/r\.json/,
    )
  })

  it('throws on a non-object payload rather than returning it', () => {
    expect(() => parseItem('not json', 'https://e/r.json')).toThrow(/must be an object/)
  })
})
