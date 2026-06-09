import { describe, expect, it } from 'vitest'
import { loadRegistry } from './registry.js'
import { createServer } from './server.js'

describe('loadRegistry (real registry.json)', () => {
  it('resolves the monorepo registry and includes enriched meta', () => {
    const registry = loadRegistry()
    expect(registry.components.length).toBeGreaterThanOrEqual(20)
    const button = registry.components.find((c) => c.name === 'button')
    expect(button?.meta.props.length).toBeGreaterThan(0)
    expect(button?.meta.accessibility.role).toBe('button')
  })
})

describe('createServer', () => {
  it('builds without throwing and is connectable', () => {
    const server = createServer()
    expect(typeof server.connect).toBe('function')
  })
})
