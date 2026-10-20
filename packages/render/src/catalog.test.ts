import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { componentNames } from './component-names.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const CATALOG_PATH = join(HERE, '..', 'schema', 'catalog.v1.json')
const REGISTRY_PATH = join(HERE, '..', '..', '..', 'registry.json')

interface Comp {
  parent?: string
  props: {
    properties: Record<string, { enum?: unknown[]; items?: { required?: string[] } }>
  }
  slots: Record<string, { arity: string; implicit?: boolean }>
  events: Record<string, unknown>
  omitted: Record<string, unknown>
}
const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf-8')) as {
  $id: string
  version: number
  components: Record<string, Comp>
}
const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8')) as {
  components: { type?: string; meta: { name: string; props?: { name: string }[] } }[]
}

function enums(node: unknown, out: unknown[][] = []): unknown[][] {
  if (Array.isArray(node)) node.forEach((n) => enums(n, out))
  else if (typeof node === 'object' && node !== null) {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'enum' && Array.isArray(v)) out.push(v)
      else enums(v, out)
    }
  }
  return out
}

describe('catalog.v1.json', () => {
  it('has the neutral $id and version 1', () => {
    expect(catalog.$id).toBe(
      'https://raw.githubusercontent.com/cascivo/cascivo/main/packages/render/schema/catalog.v1.json',
    )
    expect(catalog.version).toBe(1)
  })

  it('covers exactly the renderable names', () => {
    expect(Object.keys(catalog.components).sort()).toEqual([...componentNames].sort())
  })

  it('classifies Button and DataTable props', () => {
    const button = catalog.components['Button']!
    expect(button.slots['children']?.arity).toBe('many')
    expect(button.slots['children']?.implicit).toBe(true)
    expect(catalog.components['Input']!.slots['children']).toBeUndefined()
    expect('onClick' in button.events).toBe(true)
    expect(button.props.properties['variant']?.enum).toContain('primary')
    expect(catalog.components['DataTable']!.props.properties['columns']?.items?.required).toEqual([
      'key',
      'header',
    ])
  })

  it('records sub-component parents', () => {
    expect(catalog.components['CardHeader']?.parent).toBe('Card')
  })

  it('never leaks TS type names into an enum', () => {
    const bad = /^(React\.)?React(Node|Element)$|^boolean$|^string$|^number$/
    for (const e of enums(catalog)) {
      for (const m of e) expect(typeof m === 'string' && bad.test(m)).toBe(false)
    }
  })

  it('places every manifest prop in exactly one bucket', () => {
    const rank: Record<string, number> = { component: 0, block: 1, chart: 2, section: 3, layout: 4 }
    const canon = new Map<string, (typeof registry.components)[number]>()
    for (const e of registry.components) {
      const cur = canon.get(e.meta.name)
      if (!cur || (rank[e.type ?? ''] ?? 9) < (rank[cur.type ?? ''] ?? 9)) canon.set(e.meta.name, e)
    }
    for (const name of componentNames) {
      const entry = canon.get(name)
      if (!entry) continue
      const c = catalog.components[name]!
      for (const p of entry.meta.props ?? []) {
        const hits = [c.props.properties, c.slots, c.events, c.omitted].filter((b) => p.name in b)
        expect(hits.length, `${name}.${p.name}`).toBe(1)
      }
    }
  })
})
