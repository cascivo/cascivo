import { render, act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { createMachine, useMachine } from './machine.ts'
import { useControllableSignal } from './controllable.ts'
import { useDisclosure } from './disclosure.ts'

/**
 * These signal-returning hooks call `useSignals()` internally, so a plain React
 * component that reads their signal in render re-renders on writes WITHOUT calling
 * `useSignals()` itself. This test env runs no Babel signals transform (see
 * packages/core/vite.config.ts), exactly like a consumer app — so if the internal
 * `useSignals()` were removed, these components would freeze and the tests fail.
 */

const toggle = createMachine({
  initial: 'off',
  states: { off: { on: { flip: 'on' } }, on: { on: { flip: 'off' } } },
})

describe('signal-returning hooks self-subscribe (no consumer useSignals())', () => {
  afterEach(cleanup)

  it('useMachine re-renders on send', () => {
    function Widget() {
      const [state, send] = useMachine(toggle)
      return (
        <button type="button" onClick={() => send('flip')}>
          {state.value}
        </button>
      )
    }
    const { container } = render(<Widget />)
    const btn = container.querySelector('button')!
    expect(btn.textContent).toBe('off')
    act(() => btn.click())
    expect(btn.textContent).toBe('on')
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
    const { container } = render(<Widget />)
    const btn = container.querySelector('button')!
    expect(btn.textContent).toBe('0')
    act(() => btn.click())
    expect(btn.textContent).toBe('1')
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
    const { container } = render(<Widget />)
    const btn = container.querySelector('button')!
    expect(btn.textContent).toBe('closed')
    act(() => btn.click())
    expect(btn.textContent).toBe('open')
  })
})
