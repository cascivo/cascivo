import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { Reasoning } from './reasoning'

function details(container: HTMLElement): HTMLDetailsElement {
  const el = container.querySelector('details')
  if (!el) throw new Error('Reasoning did not render a <details>')
  return el
}

describe('Reasoning', () => {
  it('is open, busy and shows the thinking label while streaming', () => {
    const { container } = render(<Reasoning streaming>Working it out</Reasoning>)
    const el = details(container)
    expect(el.open).toBe(true)
    expect(screen.getByText('Thinking…')).toBeInTheDocument()
    expect(screen.getByText('Working it out')).toHaveAttribute('aria-busy', 'true')
  })

  it('closes and settles when streaming ends', () => {
    const { container, rerender } = render(<Reasoning streaming>Trace</Reasoning>)
    rerender(<Reasoning duration={12}>Trace</Reasoning>)
    const el = details(container)
    expect(el.open).toBe(false)
    expect(screen.getByText('Thought for 12 seconds')).toBeInTheDocument()
    expect(screen.getByText('Trace')).not.toHaveAttribute('aria-busy')
  })

  it('uses the singular for one second and a generic label without a duration', () => {
    const { rerender } = render(<Reasoning duration={1}>Trace</Reasoning>)
    expect(screen.getByText('Thought for 1 second')).toBeInTheDocument()
    rerender(<Reasoning>Trace</Reasoning>)
    expect(screen.getByText('Reasoning')).toBeInTheDocument()
  })

  it('leaves the reader’s own toggle alone while the props are unchanged', () => {
    const { container, rerender } = render(<Reasoning duration={3}>Trace</Reasoning>)
    const el = details(container)
    el.open = true
    rerender(<Reasoning duration={3}>Trace</Reasoning>)
    expect(el.open).toBe(true)
  })

  it('accepts label and labels overrides', () => {
    const { rerender } = render(
      <Reasoning duration={4} labels={{ thoughtFor: 'Took {count}s' }}>
        Trace
      </Reasoning>,
    )
    expect(screen.getByText('Took 4s')).toBeInTheDocument()
    rerender(
      <Reasoning streaming label="Planning">
        Trace
      </Reasoning>,
    )
    expect(screen.getByText('Planning')).toBeInTheDocument()
  })

  it('server-renders open while streaming, so it works before hydration', () => {
    const html = renderToString(<Reasoning streaming>Trace</Reasoning>)
    expect(html).toMatch(/<details[^>]*\sopen=""/)
  })
})
