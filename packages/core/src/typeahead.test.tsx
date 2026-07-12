import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useTypeahead } from './typeahead'

afterEach(cleanup)

function List({ onMatch, resetMs }: { onMatch: (q: string) => void; resetMs?: number }) {
  const typeahead = useTypeahead(resetMs === undefined ? { onMatch } : { onMatch, resetMs })
  return <div data-testid="list" tabIndex={0} onKeyDown={typeahead.onKeyDown} />
}

describe('useTypeahead', () => {
  it('accumulates printable characters into a lowercased query', () => {
    const onMatch = vi.fn()
    const { getByTestId } = render(<List onMatch={onMatch} />)
    const list = getByTestId('list')
    fireEvent.keyDown(list, { key: 'A' })
    fireEvent.keyDown(list, { key: 'b' })
    expect(onMatch.mock.calls).toEqual([['a'], ['ab']])
  })

  it('ignores non-printable keys (Enter/Arrow/Escape/Tab)', () => {
    const onMatch = vi.fn()
    const { getByTestId } = render(<List onMatch={onMatch} />)
    const list = getByTestId('list')
    for (const key of ['Enter', 'ArrowDown', 'Escape', 'Tab']) {
      fireEvent.keyDown(list, { key })
    }
    expect(onMatch).not.toHaveBeenCalled()
  })

  it('ignores modified keypresses (Ctrl/Meta/Alt)', () => {
    const onMatch = vi.fn()
    const { getByTestId } = render(<List onMatch={onMatch} />)
    const list = getByTestId('list')
    fireEvent.keyDown(list, { key: 'a', ctrlKey: true })
    fireEvent.keyDown(list, { key: 'a', metaKey: true })
    expect(onMatch).not.toHaveBeenCalled()
  })

  it('treats Space as a query char only once a query is in progress', () => {
    const onMatch = vi.fn()
    const { getByTestId } = render(<List onMatch={onMatch} />)
    const list = getByTestId('list')
    fireEvent.keyDown(list, { key: ' ' }) // leading space: left for activation
    expect(onMatch).not.toHaveBeenCalled()
    fireEvent.keyDown(list, { key: 'a' })
    fireEvent.keyDown(list, { key: ' ' }) // now part of the query
    expect(onMatch.mock.calls).toEqual([['a'], ['a ']])
  })

  it('resets the buffer after the inactivity window', () => {
    vi.useFakeTimers()
    try {
      const onMatch = vi.fn()
      const { getByTestId } = render(<List onMatch={onMatch} resetMs={300} />)
      const list = getByTestId('list')
      fireEvent.keyDown(list, { key: 'a' })
      vi.advanceTimersByTime(301)
      fireEvent.keyDown(list, { key: 'b' })
      // Second keypress starts a fresh query, not "ab".
      expect(onMatch.mock.calls).toEqual([['a'], ['b']])
    } finally {
      vi.useRealTimers()
    }
  })
})
