import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Timeline } from './timeline'

afterEach(cleanup)

const items = [
  { id: '1', title: 'Placed', time: '09:00', status: 'complete' as const },
  { id: '2', title: 'Shipped', time: '12:30', status: 'current' as const },
  { id: '3', title: 'Delivered', description: 'At door', status: 'upcoming' as const },
]

describe('Timeline', () => {
  it('renders an ordered list of items', () => {
    const { container, getAllByRole } = render(<Timeline items={items} />)
    expect(container.querySelector('ol')).not.toBeNull()
    expect(getAllByRole('listitem')).toHaveLength(3)
  })

  it('defaults orientation to vertical and reflects it via data attribute', () => {
    const { container } = render(<Timeline items={items} />)
    expect(container.querySelector('ol')!.getAttribute('data-orientation')).toBe('vertical')
  })

  it('reflects horizontal orientation', () => {
    const { container } = render(<Timeline items={items} orientation="horizontal" />)
    expect(container.querySelector('ol')!.getAttribute('data-orientation')).toBe('horizontal')
  })

  it('sets data-status on each item', () => {
    const { getAllByRole } = render(<Timeline items={items} />)
    const li = getAllByRole('listitem')
    expect(li[0]!.getAttribute('data-status')).toBe('complete')
    expect(li[1]!.getAttribute('data-status')).toBe('current')
    expect(li[2]!.getAttribute('data-status')).toBe('upcoming')
  })

  it('sets aria-current="step" only on the current item', () => {
    const { getAllByRole } = render(<Timeline items={items} />)
    const li = getAllByRole('listitem')
    expect(li[0]!.getAttribute('aria-current')).toBeNull()
    expect(li[1]!.getAttribute('aria-current')).toBe('step')
    expect(li[2]!.getAttribute('aria-current')).toBeNull()
  })

  it('defaults status to upcoming when omitted', () => {
    const { getByRole } = render(<Timeline items={[{ id: 'x', title: 'Solo' }]} />)
    expect(getByRole('listitem').getAttribute('data-status')).toBe('upcoming')
  })

  it('renders time and description text', () => {
    const { container, getByText } = render(<Timeline items={items} />)
    expect(container.querySelector('time')!.textContent).toBe('09:00')
    expect(getByText('At door')).toBeDefined()
  })

  it('omits data-tone entirely when no tone is given', () => {
    const { getByRole } = render(<Timeline items={[{ id: 'x', title: 'Solo' }]} />)
    expect(getByRole('listitem').getAttribute('data-tone')).toBeNull()
  })

  it('sets data-tone from the canonical tone vocabulary', () => {
    const { getAllByRole } = render(
      <Timeline
        items={[
          { id: '1', title: 'Alert', tone: 'danger' },
          { id: '2', title: 'Merge', tone: 'success' },
          { id: '3', title: 'Note', tone: 'neutral' },
        ]}
      />,
    )
    expect(getAllByRole('listitem').map((li) => li.getAttribute('data-tone'))).toEqual([
      'danger',
      'success',
      'neutral',
    ])
  })

  it('normalizes the tone aliases, so either spelling reaches the same stylesheet value', () => {
    const { getAllByRole } = render(
      <Timeline
        items={[
          { id: '1', title: 'a', tone: 'error' },
          { id: '2', title: 'b', tone: 'destructive' },
          { id: '3', title: 'c', tone: 'default' },
        ]}
      />,
    )
    expect(getAllByRole('listitem').map((li) => li.getAttribute('data-tone'))).toEqual([
      'danger',
      'danger',
      'neutral',
    ])
  })

  it('keeps status independent of tone, so a feed entry can carry both', () => {
    const { getByRole } = render(
      <Timeline items={[{ id: '1', title: 'Shipped', status: 'current', tone: 'info' }]} />,
    )
    const li = getByRole('listitem')
    expect(li.getAttribute('data-status')).toBe('current')
    expect(li.getAttribute('data-tone')).toBe('info')
    // aria-current is a statement about sequence position, so tone must not touch it.
    expect(li.getAttribute('aria-current')).toBe('step')
  })
})
