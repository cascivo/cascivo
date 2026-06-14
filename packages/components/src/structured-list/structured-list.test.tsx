import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StructuredList, type StructuredListItem } from './structured-list'

const items: StructuredListItem[] = [
  { id: 'a', cells: ['Ada', 'Engineer'] },
  { id: 'b', cells: ['Grace', 'Admiral'] },
  { id: 'c', cells: ['Alan', 'Theorist'] },
]

afterEach(cleanup)

describe('StructuredList (static)', () => {
  it('renders headers and rows', () => {
    render(<StructuredList headers={['Name', 'Role']} items={items} aria-label="People" />)
    expect(screen.getByRole('table', { name: 'People' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(items.length + 1)
  })

  it('does not render selection controls', () => {
    render(<StructuredList items={items} />)
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })
})

describe('StructuredList (selectable)', () => {
  it('renders a radiogroup of rows', () => {
    render(<StructuredList selectable items={items} aria-label="Pick one" />)
    expect(screen.getByRole('radiogroup', { name: 'Pick one' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(items.length)
  })

  it('honors defaultValue', () => {
    render(<StructuredList selectable defaultValue="b" items={items} />)
    expect(screen.getByRole('radio', { name: 'Grace' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Ada' })).toHaveAttribute('aria-checked', 'false')
  })

  it('selects a row on click and fires onSelect', async () => {
    const picked: string[] = []
    render(<StructuredList selectable items={items} onSelect={(id) => picked.push(id)} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Grace' }))
    expect(screen.getByRole('radio', { name: 'Grace' })).toHaveAttribute('aria-checked', 'true')
    expect(picked).toEqual(['b'])
  })

  it('selects with keyboard (Enter)', async () => {
    render(<StructuredList selectable items={items} />)
    const first = screen.getByRole('radio', { name: 'Ada' })
    first.focus()
    await userEvent.keyboard('{Enter}')
    expect(first).toHaveAttribute('aria-checked', 'true')
  })

  it('moves focus with ArrowDown', async () => {
    render(<StructuredList selectable items={items} />)
    const first = screen.getByRole('radio', { name: 'Ada' })
    first.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'Grace' })).toHaveFocus()
  })
})
