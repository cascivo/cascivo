import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as entry from './a2ui-v0_9.ts'

describe('a2ui-v0_9 entry', () => {
  it.each([
    'createA2uiStore',
    'A2uiSurface',
    'cascivoCatalog',
    'basicCatalog',
    'cascivoCatalogSpec',
    'basicCatalogSpec',
    'defaultCatalogs',
    'defaultCatalogSpecs',
    'A2UI_VERSION',
    'BASIC_CATALOG_ID',
    'A2UI_CATALOG_ID',
    'DEFAULT_A2UI_LIMITS',
    'parseServerMessage',
  ])('exports %s', (name) => {
    expect((entry as Record<string, unknown>)[name]).toBeDefined()
  })

  it('pairs each default catalog with its spec', () => {
    expect(entry.defaultCatalogs).toEqual([entry.cascivoCatalog, entry.basicCatalog])
    expect(entry.defaultCatalogSpecs).toEqual([entry.cascivoCatalogSpec, entry.basicCatalogSpec])
  })

  it("R39 M2: the entry carries no 'use client', so the store and parser stay server-usable", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'a2ui-v0_9.ts'),
      'utf8',
    )
    expect(source.trimStart().startsWith("'use client'")).toBe(false)
  })
})
