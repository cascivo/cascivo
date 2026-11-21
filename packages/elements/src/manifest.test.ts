import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { customElementsManifest, ELEMENTS } from './manifest.ts'

const source = (m: string) => readFileSync(join(import.meta.dirname, `${m}.ts`), 'utf8')
const base = source('base')

describe.each(ELEMENTS)('$tag', (entry) => {
  it('define() registers the documented class, idempotently', async () => {
    const mod = (await import(`./${entry.module}.ts`)) as { define: () => void }
    mod.define()
    mod.define()
    const ctor = customElements.get(entry.tag) as unknown as {
      name: string
      formAssociated?: boolean
    }
    expect(ctor.name).toBe(entry.className)
    expect(ctor.formAssociated === true).toBe(entry.formAssociated)
  })

  it('documents every attribute and custom event the element reads or fires', () => {
    const code = source(entry.module) + (entry.formAssociated ? base : '')
    const read = new Set(
      [...code.matchAll(/this\.(?:getAttribute|hasAttribute)\('([\w-]+)'\)/g)].map((m) => m[1]),
    )
    expect([...read].sort()).toEqual(entry.attributes.map(([n]) => n).sort())
    const fired = new Set([...code.matchAll(/emit\('(cv-[\w-]+)'/g)].map((m) => m[1]))
    for (const name of fired) expect(entry.events.map(([n]) => n)).toContain(name)
  })
})

it('builds a Custom Elements Manifest with one module per element', () => {
  const cem = customElementsManifest() as { schemaVersion: string; modules: unknown[] }
  expect(cem.schemaVersion).toBe('2.1.0')
  expect(cem.modules).toHaveLength(ELEMENTS.length)
})
