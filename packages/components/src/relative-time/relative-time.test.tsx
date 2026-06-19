import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
