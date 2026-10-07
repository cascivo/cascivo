import { describe, expect, it } from 'vitest'
import { loadRegistry } from './registry.js'
import { RENDERABLE } from './grammar.js'
import { scaffoldView } from './scaffold-view.js'

const registry = loadRegistry()

describe('scaffoldView', () => {
  it.each(['an admin dashboard with stats', 'a settings form', 'a sign-in page'])(
    'returns a valid view of renderable components for "%s"',
    (description) => {
      const { config, errors } = scaffoldView({ description }, registry)
      expect(errors).toEqual([])
      for (const node of Object.values(config.view.regions).flat()) {
        expect(RENDERABLE.has(node.component), node.component).toBe(true)
      }
    },
  )

  it('emits only fields a ViewConfig has', () => {
    const { config } = scaffoldView({ description: 'dashboard' }, registry)
    expect(Object.keys(config.view)).toEqual(['regions'])
  })
})
