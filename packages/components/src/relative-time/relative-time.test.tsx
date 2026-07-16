import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { createLocale } from '@cascivo/i18n'
import { RelativeTime } from './relative-time'

const NOW = Date.UTC(2026, 5, 19, 12, 0, 0)

describe('RelativeTime', () => {
  it('renders a <time> with the relative phrase, datetime, and absolute title', () => {
    createLocale({ default: 'en', supported: ['en'] })
    const date = NOW - 3 * 60 * 1000 // 3 minutes ago
    render(<RelativeTime date={date} now={NOW} />)
    const el = screen.getByText('3 minutes ago')
    expect(el.tagName.toLowerCase()).toBe('time')
    expect(el).toHaveAttribute('datetime', new Date(date).toISOString())
    expect(el.getAttribute('title')).toBeTruthy()
  })

  it('updates the phrase when "now" advances (deterministic, no real timers)', () => {
    createLocale({ default: 'en', supported: ['en'] })
    const date = NOW - 2 * 60 * 60 * 1000 // 2 hours before NOW
    const { rerender } = render(<RelativeTime date={date} now={NOW} />)
    expect(screen.getByText('2 hours ago')).toBeInTheDocument()
    rerender(<RelativeTime date={date} now={NOW + 60 * 60 * 1000} />)
    expect(screen.getByText('3 hours ago')).toBeInTheDocument()
  })

  it('supports natural-language formatting', () => {
    createLocale({ default: 'en', supported: ['en'] })
    const date = NOW - 24 * 60 * 60 * 1000 // 1 day ago
    render(<RelativeTime date={date} now={NOW} format={{ numeric: 'auto' }} />)
    expect(screen.getByText('yesterday')).toBeInTheDocument()
  })

  it('renders without scheduling work when sync is off', () => {
    createLocale({ default: 'en', supported: ['en'] })
    render(<RelativeTime date={NOW - 5000} now={NOW} sync={false} />)
    expect(screen.getByText('5 seconds ago')).toBeInTheDocument()
  })

  it('renders the same relative phrase on server and client when now is fixed', () => {
    createLocale({ default: 'en', supported: ['en'] })
    const el = <RelativeTime date={NOW - 3 * 60 * 1000} now={NOW} />
    expect(renderToString(el)).toContain('3 minutes ago')
    render(el)
    expect(screen.getByText('3 minutes ago')).toBeInTheDocument()
  })

  it('hydrates without a mismatch warning even when the server clock differs', () => {
    createLocale({ default: 'en', supported: ['en'] })
    const nowSpy = vi.spyOn(Date, 'now')
    const errors: unknown[][] = []
    const errSpy = vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args))
    const date = NOW - 5000
    const container = document.createElement('div')
    document.body.appendChild(container)
    try {
      // Server renders at NOW ("5 seconds ago"); the client clock is 2 minutes
      // later ("2 minutes ago"). suppressHydrationWarning must keep React from
      // treating that expected text difference as a mismatch.
      nowSpy.mockReturnValue(NOW)
      container.innerHTML = renderToString(<RelativeTime date={date} />)
      nowSpy.mockReturnValue(NOW + 120 * 1000)
      act(() => {
        hydrateRoot(container, <RelativeTime date={date} />)
      })
      const hydrationErrors = errors.filter((args) =>
        args.some((a) => typeof a === 'string' && /hydrat|did not match|tree hydrated/i.test(a)),
      )
      expect(hydrationErrors).toEqual([])
    } finally {
      errSpy.mockRestore()
      nowSpy.mockRestore()
      container.remove()
    }
  })

  it('corrects the server text on the client after mount when sync is off', () => {
    createLocale({ default: 'en', supported: ['en'] })
    vi.useFakeTimers()
    // No `now` prop: the effect refreshes `now` to the client clock once on mount.
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(NOW + 90 * 1000)
    try {
      const date = NOW // server would render "now"/seconds; client is 90s later
      render(<RelativeTime date={date} sync={false} />)
      act(() => {
        vi.runOnlyPendingTimers()
      })
      expect(screen.getByText('1 minute ago')).toBeInTheDocument()
    } finally {
      nowSpy.mockRestore()
      vi.useRealTimers()
    }
  })
})
