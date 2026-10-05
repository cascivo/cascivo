import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { Sources, sourceHref } from './sources'

describe('sourceHref', () => {
  it('passes absolute http(s) URLs', () => {
    expect(sourceHref('https://example.com/a?b=1')).toBe('https://example.com/a?b=1')
    expect(sourceHref('http://example.com')).toBe('http://example.com/')
  })

  it('refuses script, data, relative and malformed URLs', () => {
    for (const url of [
      'javascript:alert(1)',
      ' JavaScript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox',
      '/relative/path',
      '//evil.example',
      'not a url',
      '',
    ]) {
      expect(sourceHref(url), url).toBeUndefined()
    }
  })
})

describe('Sources', () => {
  const ITEMS = [
    { title: 'Refund policy', url: 'https://www.example.com/refunds' },
    { title: 'Terms', url: 'https://example.com/terms', description: '§4 covers it.' },
  ]

  it('summarises the count in a closed disclosure', () => {
    const { container } = render(<Sources items={ITEMS} />)
    const details = container.querySelector('details')
    expect(details?.open).toBe(false)
    expect(details?.querySelector('summary')).toHaveTextContent('Used 2 sources')
  })

  it('uses the singular for one source', () => {
    render(<Sources items={[ITEMS[0]!]} />)
    expect(screen.getByText('Used 1 source')).toBeInTheDocument()
  })

  it('lists numbered links with their host', () => {
    render(<Sources items={ITEMS} />)
    const rows = within(screen.getByRole('list', { hidden: true })).getAllByRole('listitem', {
      hidden: true,
    })
    expect(rows).toHaveLength(2)
    const link = within(rows[0]!).getByRole('link', { hidden: true })
    expect(link).toHaveAttribute('href', 'https://www.example.com/refunds')
    expect(rows[0]).toHaveTextContent('example.com')
    expect(rows[1]).toHaveTextContent('§4 covers it.')
  })

  it('renders an unsafe URL as text, not a link', () => {
    render(<Sources items={[{ title: 'Evil', url: 'javascript:alert(1)' }]} />)
    expect(screen.queryByRole('link', { hidden: true })).toBeNull()
    expect(screen.getByText('Evil').tagName).toBe('SPAN')
  })

  it('localises the summary', () => {
    render(<Sources items={ITEMS} labels={{ summary: '{count} Quellen' }} />)
    expect(screen.getByText('2 Quellen')).toBeInTheDocument()
  })
})
