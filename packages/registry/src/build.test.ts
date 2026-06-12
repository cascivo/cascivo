import { readFile, rm, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildRegistry } from './build.ts'
import type { RegistryIndex } from './types.ts'

const TMP = join(import.meta.dirname, '__test_out__')

const SAMPLE_INDEX: RegistryIndex = {
  schemaVersion: 2,
  name: 'test',
  items: [
    {
      schemaVersion: 2,
      name: 'button',
      type: 'component',
      description: 'A button',
      version: '1.2.0',
      files: [{ url: 'https://example.com/button.tsx' }],
      dependencies: [],
      tags: ['input'],
      meta: undefined,
    },
    {
      schemaVersion: 2,
      name: 'layout/app-shell',
      type: 'layout',
      description: 'App shell layout',
      version: '0.1.0',
      files: [{ url: 'https://example.com/app-shell.tsx' }],
      dependencies: [],
      tags: ['layout'],
      meta: undefined,
    },
  ],
}

beforeEach(async () => {
  await mkdir(TMP, { recursive: true })
})

afterEach(async () => {
  await rm(TMP, { recursive: true, force: true })
})

describe('buildRegistry', () => {
  it('emits registry.json index, per-item, and versioned files', async () => {
    await buildRegistry(SAMPLE_INDEX, TMP)

    const index = JSON.parse(await readFile(join(TMP, 'registry.json'), 'utf8')) as unknown
    expect((index as Record<string, unknown>)['schemaVersion']).toBe(2)

    const button = JSON.parse(await readFile(join(TMP, 'button.json'), 'utf8')) as unknown
    expect((button as Record<string, unknown>)['name']).toBe('button')

    const buttonV = JSON.parse(await readFile(join(TMP, 'button@1.2.0.json'), 'utf8')) as unknown
    expect((buttonV as Record<string, unknown>)['version']).toBe('1.2.0')

    const shell = JSON.parse(await readFile(join(TMP, 'layout-app-shell.json'), 'utf8')) as unknown
    expect((shell as Record<string, unknown>)['name']).toBe('layout/app-shell')
  })

  it('items are sorted in index output', async () => {
    await buildRegistry(SAMPLE_INDEX, TMP)
    const index = JSON.parse(await readFile(join(TMP, 'registry.json'), 'utf8')) as {
      items: { name: string }[]
    }
    const names = index.items.map((i) => i.name)
    expect(names).toEqual([...names].sort())
  })

  it('strips examples from the index but keeps them in per-item', async () => {
    const withExamples: RegistryIndex = {
      ...SAMPLE_INDEX,
      items: [
        {
          ...SAMPLE_INDEX.items[0]!,
          meta: {
            name: 'Button',
            description: 'A button',
            category: 'inputs',
            states: [],
            variants: [],
            sizes: [],
            props: [],
            tokens: [],
            accessibility: { role: 'button', wcag: 'AA', keyboard: [] },
            examples: [{ title: 'Basic', code: '<Button />' }],
            dependencies: [],
            tags: [],
          },
        },
      ],
    }
    await buildRegistry(withExamples, TMP)
    const index = JSON.parse(await readFile(join(TMP, 'registry.json'), 'utf8')) as {
      items: { meta?: { examples?: unknown[] } }[]
    }
    expect(index.items[0]?.meta?.examples).toHaveLength(0)

    const item = JSON.parse(await readFile(join(TMP, 'button.json'), 'utf8')) as {
      meta?: { examples?: unknown[] }
    }
    expect(item.meta?.examples).toHaveLength(1)
  })
})
