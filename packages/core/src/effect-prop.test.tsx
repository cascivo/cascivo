import { act, cleanup, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useControllableSignal } from './controllable.ts'
import { useEffectPropSignal } from './effect-prop.ts'
import { useSignal, useSignalEffect, useSignals } from './signals.ts'

/**
 * `useEffectPropSignal` exists because preact signals run effects **synchronously on
 * write**: mirroring a controlled prop into a signal during render (`s.value = prop`) runs
 * every subscribed `useSignalEffect` body inside React's render phase. That shipped in
 * `CommandMenu`, `Modal`, `Sheet`, `Dropdown`, `AlertDialog`, `Checkbox`, `HeaderPanel`,
 * `Presence`, `useDraggable`, `useInfiniteScroll`, `useResizeObserver` — and was invisible
 * until `useSignal` began subscribing its caller (2026-07-25 report, findings #1 and #4).
 *
 * The assertions below are deliberately about **ordering**, not React's warning text, so
 * they don't rot across React versions.
 */

afterEach(cleanup)

describe('useEffectPropSignal', () => {
  it('runs the effect AFTER render, not during it', async () => {
    const log: string[] = []
    function Widget({ open }: { open: boolean }) {
      // Mirror first, so a synchronous write would log its effect BEFORE this render.
      const openSig = useEffectPropSignal(open)
      log.push(`render:${open}`)
      useSignalEffect(() => {
        log.push(`effect:${openSig.value}`)
      })
      return <span>{String(open)}</span>
    }

    const { rerender } = render(<Widget open={false} />)
    log.length = 0

    await act(async () => {
      rerender(<Widget open />)
    })

    expect(log).toEqual(['render:true', 'effect:true'])
  })

  it('does not update the signal during the render phase', () => {
    let peeked: boolean | null = null
    function Widget({ open }: { open: boolean }) {
      const openSig = useEffectPropSignal(open)
      peeked = openSig.peek()
      return <span>{String(open)}</span>
    }
    const { rerender } = render(<Widget open={false} />)
    expect(peeked).toBe(false)
    // Synchronous rerender: the mirror is still pending, so the signal reads the old value.
    act(() => {
      rerender(<Widget open />)
    })
    expect(peeked).toBe(false)
  })

  it('collapses superseded writes — the effect sees only the newest value', async () => {
    const seen: string[] = []
    function Widget({ step }: { step: string }) {
      const stepSig = useEffectPropSignal(step)
      useSignalEffect(() => {
        seen.push(stepSig.value)
      })
      return <span>{step}</span>
    }
    const { rerender } = render(<Widget step="a" />)
    seen.length = 0

    await act(async () => {
      rerender(<Widget step="b" />)
      rerender(<Widget step="c" />)
    })

    expect(seen).toEqual(['c'])
  })

  it('never re-runs the effect when the value is unchanged', async () => {
    let runs = 0
    function Widget({ open }: { open: boolean }) {
      const openSig = useEffectPropSignal(open)
      useSignalEffect(() => {
        openSig.value
        runs += 1
      })
      return <span>{String(open)}</span>
    }
    const { rerender } = render(<Widget open />)
    expect(runs).toBe(1)
    await act(async () => {
      rerender(<Widget open />)
      rerender(<Widget open />)
    })
    expect(runs).toBe(1)
  })

  it('is SSR-safe — the first render matches the prop and schedules nothing', () => {
    function Widget({ open }: { open: boolean }) {
      const openSig = useEffectPropSignal(open)
      return <span>{String(openSig.peek())}</span>
    }
    expect(renderToString(<Widget open />)).toContain('true')
    expect(renderToString(<Widget open={false} />)).toContain('false')
  })

  it('keeps an effect-driven parent callback out of the render phase', async () => {
    // The reported symptom: a render-phase mirror ran an effect that called the PARENT's
    // state setter, so React logged "Cannot update a component while rendering a different
    // component". Assert the callback lands after render, and that nothing hits console.error.
    const errors: unknown[][] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args)
    })
    const order: string[] = []

    function Child({ open, onOpened }: { open: boolean; onOpened: () => void }) {
      const openSig = useEffectPropSignal(open)
      order.push('child-render')
      useSignalEffect(() => {
        if (openSig.value) onOpened()
      })
      return <span>{String(open)}</span>
    }

    function Parent() {
      useSignals()
      const open = useSignal(false)
      const opened = useSignal(0)
      return (
        <>
          <button type="button" onClick={() => (open.value = true)}>
            {opened.value}
          </button>
          <Child
            open={open.value}
            onOpened={() => {
              order.push('parent-setState')
              // `.peek()`, not `.value`: this runs inside the child's effect tracking
              // scope, so a read here would subscribe that effect to `opened` and the
              // write below would re-trigger it forever.
              opened.value = opened.peek() + 1
            }}
          />
        </>
      )
    }

    const { container } = render(<Parent />)
    order.length = 0
    await act(async () => {
      container.querySelector('button')!.click()
    })

    // The parent's own re-render legitimately follows, so only the first two entries are
    // the contract: the child rendered, and only THEN did the parent's setter run.
    expect(order.slice(0, 2)).toEqual(['child-render', 'parent-setState'])
    expect(errors).toEqual([])
    spy.mockRestore()
  })
})

describe('useControllableSignal keeps its synchronous mirror (the render-read case)', () => {
  it('a controlled value read in render is never a tick stale', () => {
    // The counterpart contract: for a signal READ IN RENDER the write must stay
    // synchronous, and a render-phase write that only notifies the writing component's own
    // subscription is a legal same-fiber render-phase update.
    function Widget({ value }: { value: string }) {
      const [current] = useControllableSignal<string>({ value })
      return <span>{current.value}</span>
    }
    const { container, rerender } = render(<Widget value="a" />)
    expect(container.textContent).toBe('a')
    act(() => {
      rerender(<Widget value="b" />)
    })
    expect(container.textContent).toBe('b')
  })
})
