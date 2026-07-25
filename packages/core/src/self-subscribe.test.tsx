import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useControllableSignal } from './controllable.ts'
import { useDisclosure } from './disclosure.ts'
import { createMachine, useMachine } from './machine.ts'
import { useMediaQuery } from './media-query.ts'
import { useRovingFocus } from './roving-focus.ts'
import { useScope } from './scope.ts'
import { signal, useComputed, useSignal, useSignals } from './signals.ts'
import { useStreamBuffer } from './stream-buffer.ts'

/**
 * The **executable form** of the reactivity promise in `docs/HEADLESS.md`: every
 * signal-returning cascivo hook calls `useSignals()` internally, so a plain React
 * component that reads its signal in render re-renders on writes WITHOUT calling
 * `useSignals()` itself. This test env runs no Babel signals transform (see
 * `packages/core/vite.config.ts`), exactly like a consumer app — so if an internal
 * `useSignals()` were removed, the component would freeze and the test would fail.
 *
 * Why this file has this shape: the promise used to be prose covering twelve hooks
 * while this file covered three. Ten of the twelve were true, which is what made the
 * gap invisible — the two that were false (`useSignal`, `useComputed`) are the two the
 * reactivity contract tells you to reach for first, and an adopter shipped a silently
 * frozen dashboard on them (2026-07-25 report, finding #1).
 *
 * `scripts/checks/self-subscribe-parity.test.ts` reads
 * `scripts/checks/self-subscribe-contract.ts` and asserts, in both directions, that
 * every hook named there has a case HERE, calls `useSignals()` in its source, and is
 * named in the docs. Add a hook to that contract and to this file at the same time.
 */

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/** Render, click the button, and assert its text went from `before` to `after`. */
function expectReactive(ui: React.ReactElement, before: string, after: string) {
  const { container } = render(ui)
  const btn = container.querySelector('button')!
  expect(btn.textContent).toBe(before)
  act(() => btn.click())
  expect(btn.textContent).toBe(after)
}

describe('signal-returning hooks self-subscribe (no consumer useSignals())', () => {
  it('useSignal re-renders on write', () => {
    function Widget() {
      const count = useSignal(0)
      return (
        <button type="button" onClick={() => count.value++}>
          {count.value}
        </button>
      )
    }
    expectReactive(<Widget />, '0', '1')
  })

  it('useComputed re-renders when its dependency changes', () => {
    function Widget() {
      const count = useSignal(1)
      const doubled = useComputed(() => count.value * 2)
      return (
        <button type="button" onClick={() => count.value++}>
          {doubled.value}
        </button>
      )
    }
    expectReactive(<Widget />, '2', '4')
  })

  it('useSignal subscribes a component that also calls useSignals() itself', () => {
    // Nested useSignals() — the shape every cascivo component uses, and the shape
    // consumer code lands on when it follows AI-RULES.md literally.
    function Widget() {
      useSignals()
      const count = useSignal(0)
      return (
        <button type="button" onClick={() => count.value++}>
          {count.value}
        </button>
      )
    }
    expectReactive(<Widget />, '0', '1')
  })

  it('useMachine re-renders on send', () => {
    const toggle = createMachine({
      initial: 'off',
      states: { off: { on: { flip: 'on' } }, on: { on: { flip: 'off' } } },
    })
    function Widget() {
      const [state, send] = useMachine(toggle)
      return (
        <button type="button" onClick={() => send('flip')}>
          {state.value}
        </button>
      )
    }
    expectReactive(<Widget />, 'off', 'on')
  })

  it('useControllableSignal re-renders on set', () => {
    function Widget() {
      const [count, setCount] = useControllableSignal<number>({ defaultValue: 0 })
      return (
        <button type="button" onClick={() => setCount(count.value + 1)}>
          {count.value}
        </button>
      )
    }
    expectReactive(<Widget />, '0', '1')
  })

  it('useDisclosure re-renders on toggle (via useControllableSignal)', () => {
    function Widget() {
      const { isOpen, toggle: t } = useDisclosure()
      return (
        <button type="button" onClick={t}>
          {isOpen.value ? 'open' : 'closed'}
        </button>
      )
    }
    expectReactive(<Widget />, 'closed', 'open')
  })

  it('useMediaQuery re-renders when the query result changes', () => {
    let handler: ((event: { matches: boolean }) => void) | null = null
    const mql = {
      matches: false,
      addEventListener: (_: string, h: (event: { matches: boolean }) => void) => {
        handler = h
      },
      removeEventListener: () => {
        handler = null
      },
    }
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mql),
    )

    function Widget() {
      const matches = useMediaQuery('(min-width: 40rem)')
      return <span>{matches.value ? 'wide' : 'narrow'}</span>
    }
    const { container } = render(<Widget />)
    expect(container.textContent).toBe('narrow')
    act(() => {
      mql.matches = true
      handler?.({ matches: true })
    })
    expect(container.textContent).toBe('wide')
  })

  it('useRovingFocus re-renders on setActiveIndex', () => {
    function Widget() {
      const { activeIndex, setActiveIndex } = useRovingFocus()
      return (
        <button type="button" onClick={() => setActiveIndex(2)}>
          {activeIndex.value}
        </button>
      )
    }
    expectReactive(<Widget />, '0', '2')
  })

  it('useStreamBuffer re-renders on append', async () => {
    function Widget() {
      const buffer = useStreamBuffer<string>({ capacity: 8 })
      return (
        <button type="button" onClick={() => buffer.append('line')}>
          {String(buffer.signal.value.length)}
        </button>
      )
    }
    const { container } = render(<Widget />)
    const btn = container.querySelector('button')!
    expect(btn.textContent).toBe('0')
    // Appends flush once per animation frame, so await the frame before asserting.
    await act(async () => {
      btn.click()
      await new Promise((resolve) => {
        requestAnimationFrame(() => resolve(null))
      })
    })
    expect(btn.textContent).toBe('1')
  })

  it('useScope re-renders on a write to a scope-owned signal', () => {
    function Widget() {
      const scope = useScope()
      // Hold the scope-owned signal across renders (created once, on mount).
      const held = useSignal(scope.signal(0))
      return (
        <button type="button" onClick={() => held.value.value++}>
          {held.value.value}
        </button>
      )
    }
    expectReactive(<Widget />, '0', '1')
  })
})

describe('the boundary of the promise — raw signals still need useSignals()', () => {
  it('a module-level signal read in render does NOT subscribe on its own', () => {
    // The rule that survives the wrappers, and the reason HEADLESS.md still carries a
    // useSignals() requirement at all. If this ever starts failing, the docs' "only raw
    // signals need useSignals()" rule has become wrong and both must change together.
    const external = signal(0)
    let renders = 0
    function Widget() {
      renders += 1
      return <span>{external.value}</span>
    }
    const { container } = render(<Widget />)
    expect(container.textContent).toBe('0')
    act(() => {
      external.value = 1
    })
    expect(container.textContent).toBe('0')
    expect(renders).toBe(1)
  })

  it('a module-level signal read BEFORE the first useSignal() call is not tracked', () => {
    // The documented tracking-window caveat: useSignals() opens the window where it is
    // called, so a read above the first hook call is missed. The consumer fix is to call
    // useSignals() first — asserted in the next case.
    const external = signal('a')
    function Widget() {
      const shown = external.value // read BEFORE any cascivo hook runs
      useSignal(0)
      return <span>{shown}</span>
    }
    const { container } = render(<Widget />)
    expect(container.textContent).toBe('a')
    act(() => {
      external.value = 'b'
    })
    expect(container.textContent).toBe('a')
  })

  it('calling useSignals() first tracks a read that precedes any other hook', () => {
    const external = signal('a')
    function Widget() {
      useSignals()
      const shown = external.value
      return <span>{shown}</span>
    }
    const { container } = render(<Widget />)
    expect(container.textContent).toBe('a')
    act(() => {
      external.value = 'b'
    })
    expect(container.textContent).toBe('b')
  })
})
