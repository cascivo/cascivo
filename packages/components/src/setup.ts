import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { vi } from 'vitest'

// jsdom does not implement CSS.supports — stub it so usePopover can feature-detect
if (typeof CSS === 'undefined') {
  // @ts-expect-error — jsdom omits CSS global
  globalThis.CSS = { supports: () => false }
} else if (typeof CSS.supports !== 'function') {
  CSS.supports = () => false
}

// jsdom implements the Popover API with a UA stylesheet rule that hides all
// closed popovers: [popover]:not(:popover-open) { display: none }. This breaks
// @testing-library role queries. We intercept setAttribute to silently drop
// the 'popover' attribute so jsdom never applies the hiding rule. Components
// still call showPopover/hidePopover (no-ops here); data-state drives CSS.
const _setAttribute = HTMLElement.prototype.setAttribute
HTMLElement.prototype.setAttribute = function (name: string, value: string) {
  if (name === 'popover') return
  _setAttribute.call(this, name, value)
}
HTMLElement.prototype.showPopover = function () {}
HTMLElement.prototype.hidePopover = function () {}

// @testing-library/react's asyncWrapper drains a microtask queue via
// setTimeout(..., 0) and then calls jest.advanceTimersByTime(0) to flush it
// when fake timers are active. Vitest does not inject `jest` as a global, so
// that branch never fires and await user.type(...) deadlocks under vi.useFakeTimers().
// Provide a replacement that uses vi instead.
configure({
  asyncWrapper: async (cb) => {
    const result = await cb()
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0)
      // Flush the zero-delay timeout above when fake timers are active.
      // @testing-library/react does the same but checks `jest` (undefined in
      // Vitest), so user.type() deadlocks. Use vi.isFakeTimers() instead.
      if (vi.isFakeTimers()) vi.advanceTimersByTime(0)
    })
    return result
  },
})
