import { describe, expect, it } from 'vitest'
import { VERSION } from './index.js'

describe('@cascade-ui/core', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('0.0.0')
  })
})
