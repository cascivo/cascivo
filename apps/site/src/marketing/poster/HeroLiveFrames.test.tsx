// @vitest-environment jsdom
import { render } from 'react-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

// @cascivo/core's hooks load the real React under vitest (not the Preact alias the site build
// applies), so they are stood in for by plain hooks with the same contract for this test.
// Layout effects and a macrotask wait instead of `act`: `preact/test-utils` resolves to another
// Preact copy than the `react` alias here, so its `act` would not flush these hooks.
vi.mock('@cascivo/core', async () => {
  const { useLayoutEffect, useMemo, useState } = await import('react')
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
          peek: () => v,
        }
      }, [])
    },
    useSignalEffect: (fn: () => void | (() => void)) => useLayoutEffect(() => fn(), []),
    useMediaQuery: () => ({ value: false }),
  }
})
vi.mock('../../theme', () => ({
  theme: { value: 'poster' },
  nextScheme: () => 'poster-dark',
  isDarkTheme: (t: string) => t.endsWith('-dark'),
}))

import { HeroLiveFrames } from './HeroLiveFrames'

const POSTERS = { light: '/_cw/img/light.webp', dark: '/_cw/img/dark.webp' }
let host: HTMLDivElement

const settle = () => new Promise((r) => setTimeout(r, 0))

function mount() {
  host = document.createElement('div')
  document.body.append(host)
  render(<HeroLiveFrames posters={POSTERS} />, host)
  return host.querySelector<HTMLElement>('.pg-hero-frames')!
}

afterEach(() => {
  render(null, host)
  host.remove()
})

describe('HeroLiveFrames', () => {
  it('renders only the posters at load, from the given URLs', () => {
    const root = mount()
    expect(root.querySelectorAll('iframe')).toHaveLength(0)
    expect(root.hasAttribute('data-live')).toBe(false)
    const srcs = [...root.querySelectorAll('img')].map((i) => i.getAttribute('src'))
    expect(srcs.sort()).toEqual([POSTERS.dark, POSTERS.light].sort())
    expect(root.querySelector('a.pg-hero-shot-link')?.getAttribute('href')).toBe('/examples/pulse')
  })

  it.each(['pointerenter', 'focusin', 'touchstart'])(
    'mounts one front iframe on %s',
    async (type) => {
      const root = mount()
      root.dispatchEvent(new Event(type))
      await settle()
      const frames = root.querySelectorAll('iframe')
      expect(frames).toHaveLength(1)
      expect(frames[0]!.closest('.pg-hero-frame--light')).not.toBeNull()
      expect(frames[0]!.getAttribute('src')).toMatch(/^\/demos\/pulse\/\?theme=/)
      expect(root.hasAttribute('data-live')).toBe(true)
      // a second interaction does not add another frame
      root.dispatchEvent(new Event('pointerenter'))
      await settle()
      expect(root.querySelectorAll('iframe')).toHaveLength(1)
    },
  )

  it('mounts the frame when the overlay link takes keyboard focus, and keeps the link', async () => {
    const root = mount()
    const link = root.querySelector<HTMLAnchorElement>('a.pg-hero-shot-link')!
    link.focus()
    await settle()
    expect(root.querySelectorAll('iframe')).toHaveLength(1)
    expect(document.activeElement).toBe(link)
  })
})
