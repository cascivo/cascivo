import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCHEMA_PATH = join(HERE, '..', 'schema', 'view.v1.json')
const REGISTRY_PATH = join(HERE, '..', '..', '..', 'registry.json')

describe('view.v1.json schema artifact', () => {
  it('exists', () => {
    expect(existsSync(SCHEMA_PATH)).toBe(true)
  })

  it('is valid JSON with correct $id', () => {
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8')) as Record<string, unknown>
    expect(schema['$id']).toBe(
      'https://raw.githubusercontent.com/urbanisierung/cascade-ui/main/packages/render/schema/view.v1.json',
    )
  })

  it('component enum length matches registry', () => {
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8')) as {
      $defs: { ComponentNode: { properties: { component: { enum: string[] } } } }
    }
    const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8')) as {
      components: { meta: { name: string } }[]
    }
    expect(schema.$defs.ComponentNode.properties.component.enum.length).toBe(
      registry.components.length,
    )
  })

  it('contains Badge variant enum as spot-check', () => {
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8')) as {
      $defs: {
        ComponentNode: {
          allOf: {
            if: { properties: { component: { const: string } } }
            then: { properties: { props: { properties: Record<string, unknown> } } }
          }[]
        }
      }
    }
    const badgeBranch = schema.$defs.ComponentNode.allOf.find(
      (b) => b.if.properties.component.const === 'Badge',
    )
    expect(badgeBranch).toBeDefined()
    const variantSchema = badgeBranch?.then?.properties?.props?.properties?.['variant'] as
      | { enum?: string[] }
      | undefined
    expect(variantSchema?.enum).toContain('secondary')
  })
})
