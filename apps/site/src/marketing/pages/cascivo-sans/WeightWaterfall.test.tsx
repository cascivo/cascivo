// @vitest-environment jsdom
import { render } from 'react-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

// @cascivo/core's hooks load the real React under vitest, not the Preact alias the site applies,
// so plain hooks with the same contract stand in (same approach as HeroLiveFrames.test.tsx).
vi.mock('@cascivo/core', async () => {
  const { useMemo, useState } = await import('react')
  return {
    useSignals: () => {},
    useSignal<T>(initial: T) {
      const [, rerender] = useState(0)
      return useMemo(() => {
        let v = initial
        return {
          get value() {
            return v
          },
          set value(next: T) {
            v = next
            rerender((n) => n + 1)
          },
        }
      }, [])
    },
  }
})
// The real Toggle is covered in packages/components; this keeps its switch contract.
vi.mock('@cascivo/components/toggle', () => ({
  Toggle: (p: { label: string; checked: boolean; onValueChange: (c: boolean) => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={p.checked}
      onClick={() => p.onValueChange(!p.checked)}
    >
      {p.label}
    </button>
  ),
}))
import { COMPARE_FONTS, WeightWaterfall } from './WeightWaterfall'

const host = document.createElement('div')
document.body.append(host)
afterEach(() => render(null as never, host))

const sw = () => host.querySelector<HTMLButtonElement>('[role="switch"]')!
const rows = () => host.querySelectorAll('.cs-waterfall-compare')
const text = () => host.querySelector('.cs-waterfall')?.textContent ?? ''

describe('WeightWaterfall compare switch', () => {
  it('is off by default and renders no comparison rows or comparison fonts', async () => {
    render(<WeightWaterfall />, host)
    expect(sw().getAttribute('aria-checked')).toBe('false')
    expect(sw().textContent).toContain('Compare with Inter, Geist, IBM Plex Sans')
    expect(rows().length).toBe(0)
    expect(host.innerHTML).not.toContain('Compare Inter')
    for (const f of COMPARE_FONTS) expect(text()).not.toContain(f.name)
  })

  it('shows every comparison font under every weight when turned on, and hides them again', async () => {
    render(<WeightWaterfall />, host)
    sw().click()
    await new Promise((r) => setTimeout(r, 0))
    expect(sw().getAttribute('aria-checked')).toBe('true')
    expect(rows().length).toBe(9)
    for (const f of COMPARE_FONTS) expect(text()).toContain(f.name)
    expect(host.innerHTML).toContain('Compare Geist')
    sw().click()
    await new Promise((r) => setTimeout(r, 0))
    expect(rows().length).toBe(0)
  })
})
