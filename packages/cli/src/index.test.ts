import { describe, expect, it } from 'vitest'
import { VERSION } from './index.js'

describe('cascade CLI', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('0.0.0')
  })
})
