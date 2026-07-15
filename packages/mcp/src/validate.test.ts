import { describe, expect, it } from 'vitest'
import { validateView } from './validate.js'

const NAMES = new Set(['Input', 'Button', 'Badge'])

const view = (node: unknown, state?: Record<string, unknown>) =>
  validateView({ ...(state ? { state } : {}), view: { regions: { main: [node] } } }, NAMES)

describe('mcp validateView — $state', () => {
  it('accepts a $state read bound to a declared key', () => {
    const { valid } = view({ component: 'Input', bind: { value: '$state.q' } }, { q: '' })
    expect(valid).toBe(true)
  })

  it('accepts $state.set and $state.toggle writers', () => {
    const { valid } = view(
      {
        component: 'Input',
        events: { onChange: '$state.set.q', onClear: '$state.toggle.open' },
      },
      { q: '', open: false },
    )
    expect(valid).toBe(true)
  })

  it('rejects a $state ref to an undeclared key', () => {
    const { valid, errors } = view(
      { component: 'Input', bind: { value: '$state.nope' } },
      { q: '' },
    )
    expect(valid).toBe(false)
    expect(errors[0]?.message).toContain('Unknown state key "nope"')
  })

  it('rejects $state.toggle on a non-boolean key', () => {
    const { valid, errors } = view(
      { component: 'Button', events: { onClick: '$state.toggle.q' } },
      { q: '' },
    )
    expect(valid).toBe(false)
    expect(errors[0]?.message).toContain('requires a boolean initial value')
  })

  it('rejects a bind ref that is neither $data nor $state', () => {
    const { valid, errors } = view({ component: 'Input', bind: { value: 'query' } })
    expect(valid).toBe(false)
    expect(errors[0]?.message).toContain('$data.')
  })

  it('rejects a non-primitive state value', () => {
    const { valid, errors } = validateView(
      { state: { bad: { x: 1 } }, view: { regions: { main: [] } } },
      NAMES,
    )
    expect(valid).toBe(false)
    expect(errors[0]?.path).toBe('state.bad')
  })
})
