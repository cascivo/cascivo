import { describe, expect, it } from 'vitest'
import { isTrustedGesture } from './gesture'

describe('isTrustedGesture', () => {
  it('accepts a trusted click, key or pointerup, native or wrapped as React does', () => {
    for (const type of ['click', 'keydown', 'keyup', 'pointerup']) {
      expect(isTrustedGesture({ isTrusted: true, type })).toBe(true)
      expect(isTrustedGesture({ type, nativeEvent: { isTrusted: true, type } })).toBe(true)
    }
  })

  it('refuses a script-dispatched event, another type, or no event', () => {
    // jsdom, like a browser, marks dispatchEvent's events untrusted.
    expect(isTrustedGesture(new MouseEvent('click'))).toBe(false)
    expect(isTrustedGesture({ isTrusted: true, type: 'change' })).toBe(false)
    expect(isTrustedGesture({ isTrusted: true, type: 'pointerdown' })).toBe(false)
    expect(
      isTrustedGesture({ type: 'click', nativeEvent: { isTrusted: false, type: 'click' } }),
    ).toBe(false)
    expect(isTrustedGesture({ type: 'click' })).toBe(false)
    expect(isTrustedGesture(undefined)).toBe(false)
    expect(isTrustedGesture(false)).toBe(false)
  })
})
