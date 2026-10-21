import { describe, expect, it } from 'vitest'
import { A2UI_CATALOG_ID } from './messages'
import type { A2uiComponent } from './messages'
import { cascivoCatalogSpec as spec } from './catalog-spec'

const c = (component: string, props: Record<string, unknown>): A2uiComponent => ({
  id: 'x',
  component,
  props,
})

describe('cascivoCatalogSpec', () => {
  it('has the catalog id and component names', () => {
    expect(spec.id).toBe(A2UI_CATALOG_ID)
    expect(spec.has('Button')).toBe(true)
    expect(spec.has('Nope')).toBe(false)
  })

  it('R29: refuses a {$t} literal at any depth', () => {
    expect(spec.validate(c('Alert', { title: { $t: 'nope' } })).map((i) => i.prop)).toEqual([
      'title',
    ])
    expect(spec.validate(c('Breadcrumb', { items: [{ label: { $t: 'x' }, href: '/a' }] }))).toEqual(
      [{ prop: 'items', message: expect.stringContaining('{$t}') }],
    )
  })

  it('R30: openUrl is refused anywhere but an action functionCall', () => {
    const open = { call: 'openUrl', args: { url: 'https://evil.example/' } }
    expect(spec.validate(c('Text', { children: open })).map((i) => i.prop)).toEqual(['children'])
    expect(spec.validate(c('Alert', { title: open })).map((i) => i.prop)).toEqual(['title'])
    expect(
      spec
        .validate(
          c('Text', { children: { call: 'formatString', args: { value: '${openUrl(url:"x")}' } } }),
        )
        .map((i) => i.prop),
    ).toEqual(['children'])
    expect(
      spec
        .validate(
          c('Input', {
            checks: [{ condition: { call: 'and', args: { values: [open] } }, message: 'm' }],
          }),
        )
        .map((i) => i.prop),
    ).toEqual(['checks'])
    expect(spec.validate(c('Button', { onClick: { functionCall: open } }))).toEqual([])
    expect(
      spec
        .validate(c('Button', { onClick: { event: { name: 'go', context: { u: open } } } }))
        .map((i) => i.prop),
    ).toEqual(['onClick'])
  })

  it('accepts a button with a slot and an action', () => {
    expect(
      spec.validate(c('Button', { children: 'Save', onClick: { event: { name: 'save' } } })),
    ).toEqual([])
  })

  it('accepts bindings, calls, child lists and common keys', () => {
    expect(
      spec.validate(
        c('Button', {
          variant: { path: '/v' },
          children: ['a', 'b'],
          accessibility: { label: 'Go', description: { path: '/d' } },
          checks: [{ condition: { call: 'required', args: {} }, message: 'm' }],
        }),
      ),
    ).toEqual([])
    expect(spec.validate(c('Button', { children: { componentId: 't', path: '/items' } }))).toEqual(
      [],
    )
    expect(spec.validate(c('Button', { children: { path: '/label' } }))).toEqual([])
  })

  it('rejects a bad enum value', () => {
    const issues = spec.validate(c('Button', { variant: 'huge' }))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.prop).toBe('variant')
  })

  it('rejects an unsafe Link href', () => {
    const issues = spec.validate(c('Link', { href: 'javascript:x', children: 'x' }))
    expect(issues.some((i) => i.prop === 'href')).toBe(true)
  })

  it('rejects unknown properties, suggesting a close name', () => {
    const [foo] = spec.validate(c('Button', { foo: 1 }))
    expect(foo).toEqual({ prop: 'foo', message: expect.stringContaining('Unknown property "foo"') })
    const [typo] = spec.validate(c('Button', { varient: 'primary' }))
    expect(typo?.message).toBe('Unknown property "varient". Did you mean "variant"?')
  })

  it('rejects an unknown component at component level', () => {
    const issues = spec.validate(c('Nope', {}))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.prop).toBe('')
  })

  it('rejects malformed slots, events, bindings and common keys', () => {
    expect(spec.validate(c('Button', { children: 3 }))[0]?.prop).toBe('children')
    expect(spec.validate(c('Button', { onClick: 'go' }))[0]?.prop).toBe('onClick')
    expect(spec.validate(c('Button', { onClick: { event: { name: 'a' }, x: 1 } }))[0]?.prop).toBe(
      'onClick',
    )
    expect(spec.validate(c('Button', { variant: { path: '/a', extra: 1 } }))[0]?.prop).toBe(
      'variant',
    )
    expect(spec.validate(c('Button', { checks: [{ message: 'm' }] }))[0]?.prop).toBe('checks')
    expect(spec.validate(c('Button', { accessibility: { nope: 1 } }))[0]?.prop).toBe(
      'accessibility',
    )
  })

  it('requires required data props', () => {
    const issues = spec.validate(c('Breadcrumb', {}))
    expect(issues.some((i) => i.prop === 'items' && /required/i.test(i.message))).toBe(true)
  })

  it('does not accept weight on cascivo components', () => {
    expect(spec.validate(c('Button', { weight: 1 }))[0]?.prop).toBe('weight')
  })
})
