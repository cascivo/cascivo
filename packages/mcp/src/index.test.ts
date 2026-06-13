import { describe, expect, it } from 'vitest'
import { VERSION } from './index.js'

describe('@cascivo/mcp', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('0.0.0')
  })
})
