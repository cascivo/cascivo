import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LogViewer, type LogLine } from './log-viewer.tsx'

function makeLines(n: number): LogLine[] {
  return Array.from({ length: n }, (_, i) => ({ id: i, text: `line ${i}` }))
}

describe('LogViewer', () => {
  it('virtualizes — only a bounded number of rows mount for a huge log', () => {
    render(<LogViewer lines={makeLines(10_000)} />)
    const region = screen.getByRole('log')
    const sizer = region.firstElementChild as HTMLElement
    expect(sizer).toBeTruthy()
    const rendered = sizer.children.length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(100)
  })

  it('renders the empty state when there are no lines', () => {
    render(<LogViewer lines={[]} />)
    expect(screen.getByText('No log output')).toBeInTheDocument()
  })

  it('applies the level as a data attribute', () => {
    render(
      <LogViewer
        lines={[
          { id: 1, text: 'all good', level: 'info' },
          { id: 2, text: 'boom', level: 'error' },
        ]}
      />,
    )
    const row = screen.getByText('boom').closest('[data-level]')
    expect(row).toHaveAttribute('data-level', 'error')
  })

  it('highlights search matches with <mark>', () => {
    const { container } = render(
      <LogViewer
        lines={[
          { id: 1, text: 'compiling' },
          { id: 2, text: 'error: failed' },
        ]}
      />,
    )
    fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'error' } })
    expect(container.querySelector('mark')?.textContent).toBe('error')
    expect(screen.getByText('1 matches')).toBeInTheDocument()
  })

  it('toggles follow state', () => {
    render(<LogViewer lines={makeLines(5)} />)
    const toggle = screen.getByRole('button', { name: 'Following' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Jump to latest' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('copies the full buffer text', () => {
    const writeText = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(
      <LogViewer
        lines={[
          { id: 1, text: 'one' },
          { id: 2, text: 'two' },
        ]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(writeText).toHaveBeenCalledWith('one\ntwo')
    vi.unstubAllGlobals()
  })

  it('reads from a live signal source', () => {
    const lines = makeLines(3)
    const sig = { value: lines as readonly LogLine[] }
    render(<LogViewer lines={sig} />)
    expect(screen.getByRole('log')).toBeInTheDocument()
    expect(screen.getByText('line 0')).toBeInTheDocument()
  })
})
