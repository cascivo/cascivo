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
