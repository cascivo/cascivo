import { describe, expect, it } from 'vitest'
import { componentMap } from './component-map'
import { componentNames } from './component-names'
import { validateView } from './validate'

describe('componentNames', () => {
  it('lists exactly the components CascivoView can render', () => {
    expect([...componentNames].sort()).toEqual(Object.keys(componentMap).sort())
  })

  it('rejects inherited object keys as component names', () => {
    const result = validateView({ view: { regions: { main: [{ component: 'toString' }] } } })
    expect(result.valid).toBe(false)
  })
})
