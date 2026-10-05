import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { ChainOfThought } from './chain-of-thought'
import type { ChainOfThoughtItem } from './chain-of-thought'

const ITEMS: ChainOfThoughtItem[] = [
  { id: 'a', title: 'Searched the docs', status: 'complete' },
  { id: 'b', title: 'Reading 3 pages', status: 'active' },
  { id: 'c', title: 'Write the answer', status: 'pending' },
]

describe('ChainOfThought', () => {
  it('renders an ordered list of steps with their status', () => {
    render(<ChainOfThought items={ITEMS} />)
    const steps = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(steps).toHaveLength(3)
    expect(steps.map((s) => s.getAttribute('data-status'))).toEqual([
      'complete',
      'active',
      'pending',
    ])
  })

  it('speaks each step’s status as text', () => {
    render(<ChainOfThought items={ITEMS} />)
    const [done, active, pending] = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(done).toHaveTextContent('Searched the docs, Done')
    expect(active).toHaveTextContent('Reading 3 pages, In progress')
    expect(pending).toHaveTextContent('Write the answer, Pending')
  })

  it('marks the active step current and the list busy', () => {
    render(<ChainOfThought items={ITEMS} />)
    expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Reading 3 pages').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    )
  })

  it('is not busy once nothing is active', () => {
    render(<ChainOfThought items={[{ id: 'a', title: 'Done', status: 'complete' }]} />)
    expect(screen.getByRole('list')).not.toHaveAttribute('aria-busy')
  })

  it('accepts the current / upcoming aliases', () => {
    render(
      <ChainOfThought
        items={[
          { id: 'a', title: 'Now', status: 'current' },
          { id: 'b', title: 'Later', status: 'upcoming' },
        ]}
      />,
    )
    const [now, later] = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(now).toHaveAttribute('data-status', 'active')
    expect(later).toHaveAttribute('data-status', 'pending')
  })

  it('turns a step with detail into a closed disclosure', () => {
    const { container } = render(
      <ChainOfThought
        items={[{ id: 'a', title: 'Searched the web', status: 'complete', detail: 'Three hits' }]}
      />,
    )
    const details = container.querySelector('details')
    expect(details).not.toBeNull()
    expect(details?.open).toBe(false)
    expect(details?.querySelector('summary')).toHaveTextContent('Searched the web')
    expect(screen.getByText('Three hits')).toBeInTheDocument()
  })

  it('localises the spoken status', () => {
    render(
      <ChainOfThought
        items={[{ id: 'a', title: 'Gesucht', status: 'complete' }]}
        labels={{ complete: 'Fertig' }}
      />,
    )
    expect(screen.getByRole('listitem')).toHaveTextContent('Gesucht, Fertig')
  })

  it('server-renders the full chain', () => {
    const html = renderToString(<ChainOfThought items={ITEMS} />)
    expect(html).toContain('Reading 3 pages')
    expect(html).toContain('<ol')
  })
})
