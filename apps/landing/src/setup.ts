import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { vi } from 'vitest'

// jsdom does not implement CSS.supports — stub it.
if (typeof CSS === 'undefined') {
  // @ts-expect-error — jsdom omits CSS global
  globalThis.CSS = { supports: () => false }
} else if (typeof CSS.supports !== 'function') {
  CSS.supports = () => false
}

// jsdom implements the Popover API with a UA rule that hides closed popovers
// ([popover]:not(:popover-open) { display: none }), which breaks role queries,
// and omits showPopover/hidePopover. Drop the 'popover' attribute and no-op the
// methods so components using popovers (e.g. Dropdown in the Header) render in
// tests. Mirrors packages/components/src/setup.ts.
const _setAttribute = HTMLElement.prototype.setAttribute
HTMLElement.prototype.setAttribute = function (name: string, value: string) {
  if (name === 'popover') return
  _setAttribute.call(this, name, value)
}
HTMLElement.prototype.showPopover = function () {}
HTMLElement.prototype.hidePopover = function () {}

// jsdom does not implement matchMedia — stub it (theme.ts reads it on load).
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

// See packages/components/src/setup.ts for rationale.
configure({
  asyncWrapper: async (cb) => {
    const result = await cb()
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0)
      if (vi.isFakeTimers()) vi.advanceTimersByTime(0)
    })
    return result
  },
})
