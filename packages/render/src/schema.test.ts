import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it } from 'vitest'
import { TS_TYPE_NAME, enums } from './test-utils/enum-walk.ts'
// Source of truth for the json-playground demo; type-only import there, so a relative path is clean.
import { exampleConfig } from '../../../apps/examples/json-playground/src/example-config.ts'

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
      'https://raw.githubusercontent.com/cascivo/cascivo/main/packages/render/schema/view.v1.json',
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

  it('declares a top-level state property with primitive values', () => {
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8')) as {
      properties: { state?: { additionalProperties?: { type?: unknown } } }
    }
    expect(schema.properties.state).toBeDefined()
    expect(schema.properties.state?.additionalProperties?.type).toEqual([
      'string',
      'number',
      'boolean',
      'null',
    ])
  })

  it('allows $state refs in bind and $state.set/toggle in events', () => {
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8')) as {
      $defs: {
        ComponentNode: {
          properties: {
            bind: { additionalProperties: { pattern: string } }
            events: { additionalProperties: { pattern: string } }
          }
        }
      }
    }
    const bindRe = new RegExp(
      schema.$defs.ComponentNode.properties.bind.additionalProperties.pattern,
    )
    const eventRe = new RegExp(
      schema.$defs.ComponentNode.properties.events.additionalProperties.pattern,
    )
    expect(bindRe.test('$state.query')).toBe(true)
    expect(bindRe.test('$data.users')).toBe(true)
    expect(eventRe.test('$state.set.query')).toBe(true)
    expect(eventRe.test('$state.toggle.open')).toBe(true)
    expect(eventRe.test('$actions.save')).toBe(true)
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
      | { anyOf: { enum?: string[] }[] }
      | undefined
    expect(variantSchema?.anyOf[0]?.enum).toContain('secondary')
  })

  describe('prop schemas', () => {
    interface Branch {
      if: { properties: { component: { const: string } } }
      then: { properties: { props: { properties: Record<string, any>; required?: string[] } } }
    }
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8')) as {
      $defs: { ComponentNode: { allOf: Branch[] } }
    }
    const branch = (name: string) =>
      schema.$defs.ComponentNode.allOf.find((b) => b.if.properties.component.const === name)!
    // Compiling the full schema is slow; share one validator across tests.
    let compiled: ReturnType<Ajv2020['compile']> | undefined
    const validator = () => (compiled ??= new Ajv2020({ strict: false }).compile(schema))

    it('does not constrain slot props (AiBadge.children was enum ["ReactNode"])', () => {
      expect(branch('AiBadge').then.properties.props.properties['children']).toBeUndefined()
    })

    it('never leaks TS type names into an enum', () => {
      for (const e of enums(schema)) {
        for (const m of e) expect(typeof m === 'string' && TS_TYPE_NAME.test(m)).toBe(false)
      }
    })

    it('constrains DataTable columns items (anyOf[0] is the data schema, anyOf[1] a $t ref)', () => {
      const columns = branch('DataTable').then.properties.props.properties['columns']
      expect(columns.anyOf[0].items.required).toEqual(['key', 'header'])
      expect(columns.anyOf[1]).toEqual({ $ref: '#/$defs/TranslationRef' })
    })

    it('validates the json-playground example config', () => {
      const validate = validator()
      expect(validate(exampleConfig), JSON.stringify(validate.errors)).toBe(true)
    }, 30_000)

    it('accepts a { $t } TranslationRef for a string prop and nested strings (as validateView does)', () => {
      const validate = validator()
      const config = {
        version: 1,
        view: {
          regions: {
            main: [
              { component: 'Alert', props: { title: { $t: 'alert.title' } } },
              {
                component: 'DataTable',
                props: { columns: [{ key: 'a', header: { $t: 'col.a' } }], rows: [] },
              },
            ],
          },
        },
      }
      expect(validate(config), JSON.stringify(validate.errors)).toBe(true)
    })

    const node = (n: Record<string, unknown>) => ({
      version: 1,
      view: { regions: { main: [n] } },
    })

    it('does not require slot props (AppShell with node children and no props.header)', () => {
      const validate = validator()
      const cfg = node({ component: 'AppShell', children: [{ component: 'Separator' }] })
      expect(validate(cfg), JSON.stringify(validate.errors)).toBe(true)
    })

    it('satisfies a required data prop via bind (Select.options)', () => {
      const validate = validator()
      const cfg = node({ component: 'Select', bind: { options: '$data.opts' } })
      expect(validate(cfg), JSON.stringify(validate.errors)).toBe(true)
    })

    it('satisfies a required data prop via props (Select.options)', () => {
      const validate = validator()
      const cfg = node({ component: 'Select', props: { options: [{ value: 'a', label: 'A' }] } })
      expect(validate(cfg), JSON.stringify(validate.errors)).toBe(true)
    })

    it('rejects a node with neither props nor bind for a required data prop', () => {
      const validate = validator()
      expect(validate(node({ component: 'Select', props: { label: 'x' } }))).toBe(false)
      expect(validate(node({ component: 'Select' }))).toBe(false)
    })

    it('keeps nested objects open and nested enums loose, as validateView does (R12)', () => {
      const validate = validator()
      const ok = node({
        component: 'Timeline',
        props: { items: [{ id: 't', title: 2024, status: 'active', tone: { $t: 'x' }, extra: 1 }] },
      })
      expect(validate(ok), JSON.stringify(validate.errors)).toBe(true)
      expect(validate(node({ component: 'Timeline', props: { items: [{ title: 'x' }] } }))).toBe(
        false,
      )
      expect(
        validate(node({ component: 'Timeline', props: { items: [{ id: 't', title: true }] } })),
      ).toBe(false)
    })

    it('still rejects a wrong-typed prop', () => {
      const validate = validator()
      const config = {
        version: 1,
        view: { regions: { main: [{ component: 'Badge', props: { variant: 'nope' } }] } },
      }
      expect(validate(config)).toBe(false)
    })
  })
})
