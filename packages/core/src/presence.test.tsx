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

  it('keeps the node mounted until transitionend when exiting with a transition', () => {
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
    act(() => {
      present.value = false
    })
    // still mounted, now closing
    expect(getByTestId('content').getAttribute('data-state')).toBe('closed')
    act(() => {
      node.dispatchEvent(new Event('transitionend'))
    })
    expect(queryByTestId('content')).toBeNull()
  })
})
