import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { basicCatalogSpec as spec, basicTable } from './basic-spec'
import { BASIC_CATALOG_ID } from './messages'
import type { A2uiComponent } from './messages'

interface FixtureComponent {
  allOf: Array<{ $ref?: string; properties?: Record<string, unknown>; required?: string[] }>
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function fixture(): Record<string, FixtureComponent> {
  const raw: unknown = JSON.parse(
    readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../__fixtures__/a2ui/v0_9/basic_catalog.json'),
      'utf8',
    ),
  )
  if (!isRecord(raw) || !isRecord(raw['components'])) throw new Error('bad fixture')
  const out: Record<string, FixtureComponent> = {}
  for (const [name, def] of Object.entries(raw['components'])) {
    if (!isRecord(def) || !Array.isArray(def['allOf'])) throw new Error(`bad ${name}`)
    out[name] = { allOf: def['allOf'] }
  }
  return out
}

const c = (component: string, props: Record<string, unknown>): A2uiComponent => ({
  id: 'x',
  component,
  props,
})

describe('basic catalog parity with the vendored fixture', () => {
  const components = fixture()

  it('covers the same component names', () => {
    expect(Object.keys(basicTable).sort()).toEqual(Object.keys(components).sort())
    expect(Object.keys(components)).toHaveLength(18)
  })

  for (const [name, def] of Object.entries(components)) {
    it(`${name} props, required and checkable match`, () => {
      const own = def.allOf.find((part) => part.properties && 'component' in part.properties)
      const props = Object.keys(own?.properties ?? {})
        .filter((k) => k !== 'component')
        .sort()
      const required = (own?.required ?? []).filter((k) => k !== 'component').sort()
      const checkable = def.allOf.some((part) => part.$ref?.endsWith('/Checkable'))
      const row = basicTable[name]
      expect(Object.keys(row?.props ?? {}).sort()).toEqual(props)
      expect([...(row?.required ?? [])].sort()).toEqual(required)
      expect(row?.checkable).toBe(checkable)
    })
  }
})

describe('basicCatalogSpec', () => {
  it('has the basic id and components', () => {
    expect(spec.id).toBe(BASIC_CATALOG_ID)
    expect(spec.has('Row')).toBe(true)
    expect(spec.has('Nope')).toBe(false)
  })

  it('accepts valid components', () => {
    expect(spec.validate(c('Text', { text: { path: '/t' }, variant: 'h1', weight: 2 }))).toEqual([])
    expect(spec.validate(c('Row', { children: ['a'], justify: 'spaceBetween' }))).toEqual([])
    expect(
      spec.validate(
        c('Button', {
          child: 'l',
          action: { functionCall: { call: 'openUrl', args: { url: 'https://x.y' } } },
          checks: [{ condition: { call: 'required' }, message: 'm' }],
        }),
      ),
    ).toEqual([])
    expect(spec.validate(c('Tabs', { tabs: [{ title: 'A', child: 'a' }] }))).toEqual([])
    expect(
      spec.validate(c('ChoicePicker', { options: [{ label: 'A', value: 'a' }], value: ['a'] })),
    ).toEqual([])
    expect(spec.validate(c('Slider', { value: 3, max: 10 }))).toEqual([])
  })

  it('rejects bad values, missing required and unknown props', () => {
    expect(spec.validate(c('Text', { text: 3 }))[0]?.prop).toBe('text')
    expect(spec.validate(c('Text', { text: 'x', variant: 'h9' }))[0]?.prop).toBe('variant')
    expect(spec.validate(c('Text', {}))[0]).toMatchObject({ prop: 'text' })
    expect(spec.validate(c('Text', { text: 'x', txt: 1 }))[0]?.message).toContain('Did you mean')
    expect(spec.validate(c('Card', { child: 3 }))[0]?.prop).toBe('child')
    expect(spec.validate(c('Tabs', { tabs: [{ title: 'A' }] }))[0]?.prop).toBe('tabs')
    expect(spec.validate(c('Nope', {}))[0]?.prop).toBe('')
  })

  it('R30: openUrl is refused anywhere but an action functionCall', () => {
    const open = { call: 'openUrl', args: { url: 'https://evil.example/' } }
    expect(spec.validate(c('Text', { text: open })).map((i) => i.prop)).toEqual(['text'])
    expect(
      spec
        .validate(
          c('Text', { text: { call: 'formatString', args: { value: "${openUrl(url:'x')}" } } }),
        )
        .map((i) => i.prop),
    ).toEqual(['text'])
    expect(
      spec
        .validate(
          c('Text', {
            text: {
              call: 'formatString',
              args: { value: '${formatString(value:\'$\\{openUrl(url:"x")}\')}' },
            },
          }),
        )
        .map((i) => i.prop),
    ).toEqual(['text'])
    expect(
      spec
        .validate(
          c('Button', {
            child: 'l',
            action: { event: { name: 'go' } },
            checks: [{ condition: { call: 'not', args: { value: open } }, message: 'm' }],
          }),
        )
        .map((i) => i.prop),
    ).toEqual(['checks'])
    expect(
      spec
        .validate(
          c('Button', { child: 'l', action: { event: { name: 'go', context: { u: open } } } }),
        )
        .map((i) => i.prop),
    ).toEqual(['action'])
    expect(spec.validate(c('Button', { child: 'l', action: { functionCall: open } }))).toEqual([])
  })

  it('only allows checks on Checkable components', () => {
    const checks = [{ condition: true, message: 'm' }]
    expect(spec.validate(c('Text', { text: 'x', checks }))[0]?.prop).toBe('checks')
    expect(spec.validate(c('CheckBox', { label: 'l', value: true, checks }))).toEqual([])
  })
})
