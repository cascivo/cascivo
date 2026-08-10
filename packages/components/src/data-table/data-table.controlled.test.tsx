import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DataTable, type Column } from './data-table'

/*
 * Controlled selection must not update React state during render (2026-08-08 report A).
 *
 * `DataTable` mirrored `selection.selected` into a signal with a bare render-phase write —
 * the shape CLAUDE.md forbids and `useControllableSignal` exists to replace. Preact signals
 * notify subscribers synchronously, so the write drove an update out of a render pass and
 * React 19 reported "Cannot update a component while rendering a different component".
 *
 * The adopter's bisection is the test: uncontrolled is silent, controlled is not — and
 * uncontrolled is precisely the branch where the render-phase write does not execute.
 *
 * Asserting on console.error is deliberate. The warning IS the failure mode here: the
 * selection still ends up correct, so a state assertion passes on the broken build.
 */
interface Person {
  id: string
  name: string
}

const people: Person[] = Array.from({ length: 5 }, (_, i) => ({
  id: `p${i}`,
  name: `Person ${i}`,
}))

const columns: Column<Person>[] = [{ key: 'name', header: 'Name' }]

function ControlledTable({ onSelect }: { onSelect?: (ids: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([])
  return (
    <>
      <span data-testid="count">{selected.length}</span>
      <DataTable
        columns={columns}
        rows={people}
        getRowId={(p) => p.id}
        selection={{
          mode: 'multi',
          selected,
          onChange: (ids) => {
            setSelected(ids)
            onSelect?.(ids)
          },
        }}
      />
    </>
  )
}

let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  errorSpy.mockRestore()
})

const errorText = () => errorSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n')

describe('DataTable controlled selection', () => {
  it('logs no React error when a row is checked', async () => {
    const user = userEvent.setup()
    render(<ControlledTable />)

    const boxes = screen.getAllByRole('checkbox')
    await user.click(boxes[1]!)

    expect(errorText()).not.toMatch(/while rendering a different component/i)
    expect(errorText()).toBe('')
  })

  it('drives the parent state it is given', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ControlledTable onSelect={onSelect} />)

    const boxes = screen.getAllByRole('checkbox')
    await user.click(boxes[1]!)
    expect(onSelect).toHaveBeenCalledWith(['p0'])
    expect(screen.getByTestId('count')).toHaveTextContent('1')

    await user.click(boxes[2]!)
    expect(screen.getByTestId('count')).toHaveTextContent('2')

    // Unchecking must remove exactly one id, not reset.
    await user.click(boxes[1]!)
    expect(screen.getByTestId('count')).toHaveTextContent('1')
  })

  it('select-all is controlled by the parent too', async () => {
    const user = userEvent.setup()
    render(<ControlledTable />)

    await user.click(screen.getAllByRole('checkbox')[0]!)
    expect(screen.getByTestId('count')).toHaveTextContent(String(people.length))
    expect(errorText()).toBe('')
  })

  it('a parent that ignores onChange keeps the selection empty (React semantics)', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={columns}
        rows={people}
        getRowId={(p) => p.id}
        selection={{ mode: 'multi', selected: [], onChange: () => {} }}
      />,
    )
    await user.click(screen.getAllByRole('checkbox')[1]!)
    expect(screen.getAllByRole('checkbox')[1]!).not.toBeChecked()
    expect(errorText()).toBe('')
  })

  it('uncontrolled selection still owns its own state', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={columns}
        rows={people}
        getRowId={(p) => p.id}
        selection={{ mode: 'multi' }}
      />,
    )
    await user.click(screen.getAllByRole('checkbox')[1]!)
    expect(screen.getAllByRole('checkbox')[1]!).toBeChecked()
    expect(errorText()).toBe('')
  })
})
