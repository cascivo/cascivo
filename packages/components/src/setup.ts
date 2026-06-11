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

// jsdom does not implement the Popover API — stub showPopover/hidePopover on HTMLElement
if (!HTMLElement.prototype.showPopover) {
  HTMLElement.prototype.showPopover = function () {
    this.setAttribute('popover-open', '')
  }
}
if (!HTMLElement.prototype.hidePopover) {
  HTMLElement.prototype.hidePopover = function () {
    this.removeAttribute('popover-open')
  }
}

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
