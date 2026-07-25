import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Presence } from './presence'
import { signal } from './signals'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Presence', () => {
  it('renders the child with data-state=open when present', () => {
    const { getByTestId } = render(
      <Presence present>
        <div data-testid="content">hi</div>
      </Presence>,
    )
    expect(getByTestId('content').getAttribute('data-state')).toBe('open')
  })

  it('renders nothing when not present and no animation', () => {
    const { queryByTestId } = render(
      <Presence present={false}>
        <div data-testid="content">hi</div>
      </Presence>,
    )
    expect(queryByTestId('content')).toBeNull()
  })

  // `await act` (not the sync form) because the present→absent mirror is deferred one
  // microtask by `useEffectPropSignal`: a synchronous mirror would run this component's
  // `useSignalEffect` during React's render phase, attaching the transition listeners
  // against a pre-commit ref. See docs/HEADLESS.md "Syncing a controlled prop".
  it('keeps the node mounted until transitionend when exiting with a transition', async () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      animationName: 'none',
      animationDuration: '0s',
      transitionDuration: '0.2s',
    } as CSSStyleDeclaration)

    const present = signal(true)
    const { getByTestId, queryByTestId } = render(
      <Presence present={present}>
        <div data-testid="content">hi</div>
      </Presence>,
    )
    const node = getByTestId('content')
    await act(async () => {
      present.value = false
    })
    // still mounted, now closing
    expect(getByTestId('content').getAttribute('data-state')).toBe('closed')
    await act(async () => {
      node.dispatchEvent(new Event('transitionend'))
    })
    expect(queryByTestId('content')).toBeNull()
  })
})
