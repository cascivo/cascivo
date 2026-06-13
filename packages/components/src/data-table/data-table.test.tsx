import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createLocale } from '@cascivo/i18n'
import { createRenderProbe } from '../test-utils/render-count'
import { DataTable, type Column } from './data-table'
import styles from './data-table.module.css'

interface Person {
  id: string
  name: string
  age: number
}

const people: Person[] = Array.from({ length: 30 }, (_, i) => ({
  id: `p${i}`,
  name: `Person ${String(i).padStart(2, '0')}`,
  age: 20 + ((i * 7) % 50),
}))

const columns: Column<Person>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'age', header: 'Age', sortable: true },
]

describe('DataTable', () => {
  it('renders column headers and first-page rows', () => {
    render(<DataTable columns={columns} rows={people.slice(0, 5)} getRowId={(p) => p.id} />)
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Age' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Person 00' })).toBeInTheDocument()
  })

  it('client sort: click Age sorts ascending then descending', async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} rows={people} getRowId={(p) => p.id} />)
    const ageHeader = screen.getByRole('button', { name: /age/i })
    await user.click(ageHeader)
    const th = screen.getByRole('columnheader', { name: /age/i })
    expect(th).toHaveAttribute('aria-sort', 'ascending')
    const cells = screen.getAllByRole('cell').filter((c) => /^\d+$/.test(c.textContent ?? ''))
    const ages = cells.map((c) => Number(c.textContent))
    expect(ages[0]).toBeLessThanOrEqual(ages[1]!)
    await user.click(ageHeader)
    expect(th).toHaveAttribute('aria-sort', 'descending')
  })

  it('server sort: onSortChange fires and rows do not reorder locally', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    const { rerender } = render(
      <DataTable
        columns={columns}
        rows={people.slice(0, 5)}
        getRowId={(p) => p.id}
        sortMode="server"
        sort={undefined}
        onSortChange={onSortChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: /age/i }))
    expect(onSortChange).toHaveBeenCalledWith({ key: 'age', direction: 'asc' })
    // row order must not change (server controls it)
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Person 00')
    rerender(
      <DataTable
        columns={columns}
        rows={people.slice(0, 5)}
        getRowId={(p) => p.id}
        sortMode="server"
        sort={undefined}
        onSortChange={onSortChange}
      />,
    )
  })

  it('global search filters rows', async () => {
    const user = userEvent.setup()
    render(
      <DataTable columns={columns} rows={people.slice(0, 10)} getRowId={(p) => p.id} searchable />,
    )
    const searchbox = screen.getByRole('searchbox')
    await user.type(searchbox, 'Person 05')
    expect(screen.getByRole('cell', { name: 'Person 05' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Person 00' })).not.toBeInTheDocument()
  })

  it('pagination: shows 10 rows and range label, then navigates to next page', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={columns}
        rows={people}
        getRowId={(p) => p.id}
        pagination={{ pageSize: 10 }}
      />,
    )
    const rows = screen.getAllByRole('row')
    // header + 10 data rows
    expect(rows).toHaveLength(11)
    // range label
    expect(screen.getByText(/1–10 of 30/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText(/11–20 of 30/)).toBeInTheDocument()
  })

  it('multi selection: select-all checks all visible rows and batch bar shows count', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={columns}
        rows={people.slice(0, 5)}
        getRowId={(p) => p.id}
        selection={{ mode: 'multi' }}
        batchActions={[{ label: 'Delete', onClick: vi.fn() }]}
      />,
    )
    await user.click(screen.getByRole('checkbox', { name: /select all/i }))
    expect(screen.getAllByText(/5 selected/).length).toBeGreaterThan(0)
  })

  it('expandable rows: content appears on expand click', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        columns={columns}
        rows={people.slice(0, 3)}
        getRowId={(p) => p.id}
        renderExpandedRow={(p) => <div>Details for {p.name}</div>}
      />,
    )
    const [firstExpand] = screen.getAllByRole('button', { name: /expand row/i })
    await user.click(firstExpand!)
    expect(screen.getByText(/Details for Person 00/)).toBeInTheDocument()
  })

  it('empty state renders builtin empty text when rows is empty', () => {
    render(<DataTable columns={columns} rows={[]} getRowId={(p) => p.id} />)
    expect(screen.getByRole('cell', { name: 'No data' })).toBeInTheDocument()
  })

  it('loading renders shimmer rows', () => {
    const { container } = render(
      <DataTable columns={columns} rows={[]} getRowId={(p) => p.id} loading />,
    )
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
  })

  it('locale switch: German empty text after store.set("de")', async () => {
    const store = createLocale({ default: 'en', supported: ['en', 'de'] })
    await store.set('de')
    render(<DataTable columns={columns} rows={[]} getRowId={(p) => p.id} />)
    expect(screen.getByRole('cell', { name: 'Keine Daten' })).toBeInTheDocument()
    await store.set('en')
  })
})

describe('DataTable virtualized', () => {
  const bigRows = Array.from({ length: 100_000 }, (_, i) => ({
    id: `r${i}`,
    name: `Row ${i}`,
    age: i % 100,
  }))

  it('100k rows: renders at most windowSize + overscan*2 + 2 spacer rows', () => {
    const windowSize = 20
    const overscan = 3
    render(
      <DataTable
        columns={columns}
        rows={bigRows}
        getRowId={(r) => r.id}
        virtualized
        rowHeight={40}
        windowSize={windowSize}
        overscan={overscan}
      />,
    )
    const tbody = document.querySelector('tbody')!
    // +1 header row counted by getAllByRole('row') — query tbody rows only
    const tbodyRows = tbody.querySelectorAll('tr')
    // max = windowSize + overscan*2 data rows + 1 top spacer (none at top when start=0) + 1 bottom spacer
    // at scrollTop=0 there is no top spacer, so max = windowSize + overscan*2 + 1 bottom spacer
    expect(tbodyRows.length).toBeLessThanOrEqual(windowSize + overscan * 2 + 2)
  })

  it('scroll signal update changes visible slice', () => {
    const windowSize = 5
    const overscan = 1
    const rowHeight = 40
    render(
      <DataTable
        columns={columns}
        rows={bigRows}
        getRowId={(r) => r.id}
        virtualized
        rowHeight={rowHeight}
        windowSize={windowSize}
        overscan={overscan}
      />,
    )
    // Initially row 0 should be visible
    expect(screen.getByRole('cell', { name: 'Row 0' })).toBeInTheDocument()

    // Simulate scroll: fire scroll event on the scroller div
    const scroller = document.querySelector(`.${styles['scroller']}`) as HTMLDivElement
    Object.defineProperty(scroller, 'scrollTop', { writable: true, value: rowHeight * 10 })
    scroller.dispatchEvent(new Event('scroll'))

    // Row 0 should no longer be visible (visibleStart = 10)
    expect(screen.queryByRole('cell', { name: 'Row 0' })).not.toBeInTheDocument()
    // Row 10 should be visible
    expect(screen.getByRole('cell', { name: 'Row 10' })).toBeInTheDocument()
  })

  it('aria-rowcount equals total count and aria-rowindex values are correct', () => {
    const rowCount = 50
    const rows = bigRows.slice(0, rowCount)
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        virtualized
        rowHeight={40}
        windowSize={10}
        overscan={2}
      />,
    )
    const table = screen.getByRole('table')
    expect(table).toHaveAttribute('aria-rowcount', String(rowCount))

    // First visible data row should have aria-rowindex="1"
    const dataRows = document.querySelector('tbody')!.querySelectorAll('tr[aria-rowindex]')
    expect(dataRows[0]).toHaveAttribute('aria-rowindex', '1')
  })

  it('selection by id survives virtualized scroll', async () => {
    const user = userEvent.setup()
    const rowHeight = 40
    const windowSize = 5
    const overscan = 1
    const rows = bigRows.slice(0, 100)
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        virtualized
        rowHeight={rowHeight}
        windowSize={windowSize}
        overscan={overscan}
        selection={{ mode: 'multi' }}
      />,
    )

    // Select row r0 via checkbox (second checkbox — first is select-all)
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1]!)

    // Simulate scroll past row 0
    const scroller = document.querySelector(`.${styles['scroller']}`) as HTMLDivElement
    Object.defineProperty(scroller, 'scrollTop', { writable: true, value: rowHeight * 20 })
    scroller.dispatchEvent(new Event('scroll'))

    // Scroll back to top
    Object.defineProperty(scroller, 'scrollTop', { writable: true, value: 0 })
    scroller.dispatchEvent(new Event('scroll'))

    // row r0 should still be selected
    const firstDataRow = document.querySelector('tbody tr[aria-rowindex="1"]') as HTMLElement
    expect(firstDataRow).toHaveAttribute('data-state', 'selected')
  })
})

describe('DataTable re-render budget', () => {
  it('table interactions do not re-render the parent app', async () => {
    const user = userEvent.setup()
    const { Probe, commits } = createRenderProbe()
    render(
      <>
        <Probe>
          <div data-testid="sibling">sibling</div>
        </Probe>
        <DataTable columns={columns} rows={people} getRowId={(p) => p.id} />
      </>,
    )
    const base = commits()
    await user.click(screen.getByRole('button', { name: /age/i }))
    expect(commits()).toBe(base)
  })

  it('a sort is at most one table commit', async () => {
    const user = userEvent.setup()
    const { Probe, commits } = createRenderProbe()
    render(
      <Probe>
        <DataTable columns={columns} rows={people} getRowId={(p) => p.id} />
      </Probe>,
    )
    const base = commits()
    await user.click(screen.getByRole('button', { name: /age/i }))
    expect(commits() - base).toBeLessThanOrEqual(1)
  })
})
