import { describe, expect, it } from 'vitest'
import { validateView } from './validate'

/** Build a single-node view for terse assertions. */
function view(node: Record<string, unknown>) {
  return { view: { regions: { main: [node] } } }
}

describe('validateView() prop conformance (v40 T2)', () => {
  it('accepts a node whose props match the manifest', () => {
    const result = validateView(
      view({ component: 'Badge', props: { variant: 'secondary', size: 'sm' } }),
    )
    expect(result).toEqual({ valid: true, errors: [] })
  })

  it('flags an unknown prop with a did-you-mean suggestion', () => {
    const result = validateView(view({ component: 'Badge', props: { varient: 'secondary' } }))
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatchObject({
      path: 'view.regions.main[0].props.varient',
      message: expect.stringContaining('Did you mean "variant"?'),
    })
  })

  it('flags an out-of-enum value', () => {
    const result = validateView(view({ component: 'Badge', props: { variant: 'neon' } }))
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatchObject({
      path: 'view.regions.main[0].props.variant',
      message: expect.stringContaining('expected one of: default, secondary'),
    })
  })

  it('flags a primitive type mismatch (string where boolean expected)', () => {
    const result = validateView(view({ component: 'Separator', props: { decorative: 'yes' } }))
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatchObject({
      path: 'view.regions.main[0].props.decorative',
      message: expect.stringContaining('expected boolean, got string'),
    })
  })

  it('accepts a TranslationRef for a string-typed prop', () => {
    const result = validateView(view({ component: 'Input', props: { label: { $t: 'form.name' } } }))
    expect(result.valid).toBe(true)
  })

  it('skips conformance for bound props (resolved at runtime)', () => {
    const result = validateView(
      view({ component: 'Badge', bind: { variant: '$data.badge.variant' } }),
    )
    const propErrors = result.errors.filter((e) => e.path.includes('.props.'))
    expect(propErrors).toHaveLength(0)
  })

  it('reports conformance errors in nested children', () => {
    const result = validateView(
      view({ component: 'Card', children: [{ component: 'Badge', props: { variant: 'neon' } }] }),
    )
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.path).toBe('view.regions.main[0].children[0].props.variant')
  })
})
