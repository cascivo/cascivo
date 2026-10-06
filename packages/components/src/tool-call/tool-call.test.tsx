import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { ToolCall } from './tool-call'

describe('ToolCall', () => {
  it('shows the tool name and the status as text', () => {
    render(<ToolCall name="search_web" status="running" />)
    expect(screen.getByText('search_web')).toBeInTheDocument()
    expect(screen.getByText('Running')).toBeInTheDocument()
  })

  it('labels every status', () => {
    const cases = [
      ['pending', 'Pending'],
      ['running', 'Running'],
      ['awaiting-approval', 'Awaiting approval'],
      ['complete', 'Completed'],
      ['error', 'Error'],
      ['denied', 'Denied'],
    ] as const
    for (const [status, text] of cases) {
      const { unmount, container } = render(<ToolCall name="t" status={status} />)
      expect(container.firstElementChild).toHaveAttribute('data-status', status)
      expect(screen.getByText(text)).toBeInTheDocument()
      unmount()
    }
  })

  it('renders no disclosure when there is nothing to disclose', () => {
    const { container } = render(<ToolCall name="t" status="pending" />)
    expect(container.querySelector('details')).toBeNull()
  })

  it('puts input and output in a closed disclosure, preformatting strings', () => {
    const { container } = render(
      <ToolCall name="t" status="complete" input={'{ "a": 1 }'} output={<strong>42</strong>} />,
    )
    const details = container.querySelector('details')
    expect(details?.open).toBe(false)
    expect(screen.getByText('{ "a": 1 }').closest('pre')).not.toBeNull()
    expect(screen.getByText('42').closest('pre')).toBeNull()
    expect(screen.getByText('Input')).toBeInTheDocument()
    expect(screen.getByText('Output')).toBeInTheDocument()
  })

  it('opens itself on error', () => {
    const { container } = render(<ToolCall name="t" status="error" error="404" />)
    expect(container.querySelector('details')?.open).toBe(true)
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('keeps actions outside the disclosure', () => {
    const { container } = render(
      <ToolCall
        name="send_email"
        status="awaiting-approval"
        input="{}"
        actions={<button type="button">Approve</button>}
      />,
    )
    const details = container.querySelector('details')
    expect(details).not.toContainElement(screen.getByRole('button', { name: 'Approve' }))
  })

  it('localises through labels', () => {
    render(
      <ToolCall
        name="t"
        status="running"
        input="{}"
        labels={{ running: 'Läuft', input: 'Eingabe' }}
      />,
    )
    expect(screen.getByText('Läuft')).toBeInTheDocument()
    expect(screen.getByText('Eingabe')).toBeInTheDocument()
  })

  it('server-renders open on error', () => {
    const html = renderToString(<ToolCall name="t" status="error" error="boom" />)
    expect(html).toMatch(/<details[^>]*\sopen=""/)
  })
})
