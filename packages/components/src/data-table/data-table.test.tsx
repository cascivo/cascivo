import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLocale } from '@cascivo/i18n'
import { createRenderProbe } from '../test-utils/render-count'
import { readFileSync } from 'node:fs'
import { DataTable, type Column } from './data-table'
import styles from './data-table.module.css'
import { MAX_CANVAS_PX } from './virtual-window'

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

  it('renders with pagination and no labels prop without throwing (regression: builtin.dataTable i18n key drift)', () => {
    // A version-skewed @cascivo/i18n install once lacked the previousPage/nextPage
    // builtin keys, which crashed this render before any labels override applied.
    render(
      <DataTable
        columns={columns}
        rows={people}
        getRowId={(p) => p.id}
        pagination={{ pageSize: 10 }}
      />,
    )
    expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument()
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
    render(<DataTable columns={columns} rows={[]} getRowId={(p) => p.id} loading />)
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

describe('DataTable at a million rows', () => {
  // Built once: a million objects is ~350 ms, and it is the size the component claims.
  const million = Array.from({ length: 1_000_000 }, (_, i) => ({
    id: `r${i}`,
    name: `Row ${i}`,
    age: i % 100,
  }))
  const rowHeight = 49
  const viewport = 600
  // jsdom has no layout, so the scroller's height is given as a row count.
  const windowSize = Math.ceil(viewport / rowHeight)

  it('renders a bounded window, with spacers that never exceed the canvas cap', () => {
    render(
      <DataTable
        columns={columns}
        rows={million}
        getRowId={(r) => r.id}
        virtualized
        rowHeight={rowHeight}
        windowSize={windowSize}
        overscan={3}
      />,
    )
    const tbody = document.querySelector('tbody')!
    expect(tbody.querySelectorAll('tr[aria-rowindex]').length).toBeLessThanOrEqual(
      windowSize + 1 + 6,
    )
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '1000000')
    const spacers = [...tbody.querySelectorAll('tr[aria-hidden="true"]')]
    const spacerPx = spacers.reduce((sum, tr) => sum + Number.parseFloat(tr.style.height), 0)
    // 1,000,000 × 49 px is 49 M px, past Chromium's 33.5 M px element clamp; the canvas
    // is capped instead, so the scrollbar's bottom really is the last row.
    expect(spacerPx).toBeLessThanOrEqual(MAX_CANVAS_PX)
    expect(spacerPx).toBeGreaterThan(MAX_CANVAS_PX * 0.99)
  })

  it('reaches the last row at the bottom of the scrollbar', () => {
    render(
      <DataTable
        columns={columns}
        rows={million}
        getRowId={(r) => r.id}
        virtualized
        rowHeight={rowHeight}
        windowSize={windowSize}
        overscan={3}
      />,
    )
    const scroller = document.querySelector(`.${styles['scroller']}`) as HTMLDivElement
    Object.defineProperty(scroller, 'scrollTop', {
      writable: true,
      value: MAX_CANVAS_PX - windowSize * rowHeight,
    })
    scroller.dispatchEvent(new Event('scroll'))
    expect(screen.getByRole('cell', { name: 'Row 999999' })).toBeInTheDocument()
    expect(document.querySelector('tbody tr[aria-rowindex="1000000"]')).not.toBeNull()
    // …and the middle of the scrollbar is the middle of the data.
    Object.defineProperty(scroller, 'scrollTop', {
      writable: true,
      value: Math.floor((MAX_CANVAS_PX - windowSize * rowHeight) / 2),
    })
    scroller.dispatchEvent(new Event('scroll'))
    const first = Number(
      document.querySelector('tbody tr[aria-rowindex]')!.getAttribute('aria-rowindex'),
    )
    expect(Math.abs(first - 500_000)).toBeLessThan(20)
  })

  it('selecting every row keeps the render bounded', async () => {
    const onChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        rows={million}
        getRowId={(r) => r.id}
        virtualized
        rowHeight={rowHeight}
        windowSize={windowSize}
        selection={{ mode: 'multi', onChange }}
      />,
    )
    // Select all via the header checkbox, then scroll: neither may walk the selection per
    // rendered row. (Behavioral guard — the Set-based membership is what makes this pass in
    // a reasonable time; the O(rows × selected) version took seconds per render.)
    fireEvent.click(screen.getAllByRole('checkbox')[0]!)
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['r0', 'r999999']))
    expect(onChange.mock.calls[0]![0]).toHaveLength(1_000_000)
    const scroller = document.querySelector(`.${styles['scroller']}`) as HTMLDivElement
    for (let i = 1; i <= 20; i++) {
      Object.defineProperty(scroller, 'scrollTop', { writable: true, value: i * 50_000 })
      scroller.dispatchEvent(new Event('scroll'))
    }
    const rows = document.querySelectorAll('tbody tr[aria-rowindex]')
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) expect(row).toHaveAttribute('data-state', 'selected')
  }, 30_000)

  it('searches a million rows one keystroke at a time', () => {
    render(
      <DataTable
        columns={columns}
        rows={million}
        getRowId={(r) => r.id}
        virtualized
        rowHeight={rowHeight}
        windowSize={windowSize}
        searchable
      />,
    )
    const input = screen.getByRole('searchbox')
    for (const q of [
      'R',
      'Ro',
      'Row',
      'Row ',
      'Row 9',
      'Row 99',
      'Row 999',
      'Row 9999',
      'Row 99999',
    ]) {
      fireEvent.change(input, { target: { value: q } })
    }
    // 99999 and 999990–999999
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '11')
    expect(screen.getByRole('cell', { name: 'Row 99999' })).toBeInTheDocument()
  }, 30_000)
})

// A header cell's own label: the first node of its inner span (the header menu's popover
// content also lives inside the cell, so `textContent` would include every menu item).
const headerLabels = () =>
  screen
    .getAllByRole('columnheader')
    .map((th) =>
      (
        th.querySelector('[class*="headerInner"]')?.childNodes[0]?.textContent ?? th.textContent
      )?.trim(),
    )

describe('DataTable filters, toolbar, row actions, column visibility', () => {
  const invoices = [
    { id: 'i1', name: 'Acme', status: 'paid', amount: 120 },
    { id: 'i2', name: 'Globex', status: 'open', amount: 80 },
    { id: 'i3', name: 'Initech', status: 'paid', amount: 300 },
    { id: 'i4', name: 'Umbrella', status: 'overdue', amount: 45 },
  ]
  const filterColumns: Column<(typeof invoices)[number]>[] = [
    { key: 'name', header: 'Name', filter: 'text' },
    { key: 'status', header: 'Status', filter: 'select' },
    { key: 'amount', header: 'Amount', filter: 'range' },
  ]
  const bodyNames = () =>
    [
      ...document.querySelectorAll(
        'tbody tr.row td:first-child, tbody tr[class*="row"] td:first-child',
      ),
    ].map((td) => td.textContent)

  it('filters by text, range and faceted select, ANDed, and reports the filter map', async () => {
    const user = userEvent.setup()
    const onFiltersChange = vi.fn()
    render(
      <DataTable
        columns={filterColumns}
        rows={invoices}
        getRowId={(r) => r.id}
        onFiltersChange={onFiltersChange}
      />,
    )
    // Text filter narrows by substring.
    const nameFilter = screen.getByRole('searchbox', { name: 'Filter Name' })
    fireEvent.change(nameFilter, { target: { value: 'e' } })
    expect(bodyNames()).toEqual(['Acme', 'Globex', 'Initech', 'Umbrella'])
    fireEvent.change(nameFilter, { target: { value: 'in' } })
    expect(bodyNames()).toEqual(['Initech'])
    expect(onFiltersChange).toHaveBeenLastCalledWith({ name: { kind: 'text', value: 'in' } })
    fireEvent.change(nameFilter, { target: { value: '' } })
    expect(onFiltersChange).toHaveBeenLastCalledWith({})

    // Range filter: min 100 keeps 120 and 300.
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Filter Amount: Min' }), {
      target: { value: '100' },
    })
    expect(bodyNames()).toEqual(['Acme', 'Initech'])

    // Faceted select: opening the menu lists distinct values with counts; ticking one ANDs
    // with the range filter.
    await user.click(screen.getByRole('button', { name: 'Filter Status' }))
    const paid = screen.getByRole('checkbox', { name: 'paid (2)' })
    expect(screen.getByRole('checkbox', { name: 'overdue (1)' })).toBeInTheDocument()
    await user.click(paid)
    expect(bodyNames()).toEqual(['Acme', 'Initech'])
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      amount: { kind: 'range', min: 100 },
      status: { kind: 'select', values: ['paid'] },
    })

    // Clear filters button resets everything.
    await user.click(screen.getByRole('button', { name: /Clear filters/ }))
    expect(bodyNames()).toHaveLength(4)
  })

  it('accepts controlled filters', () => {
    render(
      <DataTable
        columns={filterColumns}
        rows={invoices}
        getRowId={(r) => r.id}
        filters={{ status: { kind: 'select', values: ['overdue'] } }}
      />,
    )
    expect(bodyNames()).toEqual(['Umbrella'])
  })

  it('shows noResultsState — not emptyState — when filters exclude every row', () => {
    render(
      <DataTable
        columns={filterColumns}
        rows={invoices}
        getRowId={(r) => r.id}
        searchable
        emptyState="Nothing here"
        noResultsState="Nothing matches"
      />,
    )
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'zzz' },
    })
    expect(screen.getByRole('cell', { name: 'Nothing matches' })).toBeInTheDocument()
  })

  it('renders the toolbar slot and a row actions menu that receives the row', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <DataTable
        columns={columns}
        rows={people}
        getRowId={(p) => p.id}
        toolbar={<button type="button">Export</button>}
        rowActions={() => [
          { id: 'edit', label: 'Edit', onSelect: onEdit },
          { id: 'delete', label: 'Delete', destructive: true, onSelect: () => {} },
        ]}
      />,
    )
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument()
    const menus = screen.getAllByRole('button', { name: 'Actions' })
    expect(menus).toHaveLength(people.length)
    await user.click(menus[0]!)
    // Every row's menu is in the DOM (popovers); the first is the one just opened.
    await user.click((await screen.findAllByRole('menuitem', { name: 'Edit' }))[0]!)
    expect(onEdit).toHaveBeenCalledWith(people[0])
  })

  it('hides columns through the Columns menu and never the last one', async () => {
    const user = userEvent.setup()
    const onColumnStateChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        rows={people}
        getRowId={(p) => p.id}
        columnSettings={{ visibility: true }}
        onColumnStateChange={onColumnStateChange}
      />,
    )
    const headers = headerLabels
    expect(headers()).toEqual(['Name', 'Age'])
    await user.click(screen.getByRole('button', { name: 'Columns' }))
    await user.click(screen.getByRole('checkbox', { name: 'Age' }))
    expect(headers()).toEqual(['Name'])
    expect(onColumnStateChange).toHaveBeenLastCalledWith({ hidden: ['age'] })
    // The remaining column's toggle is disabled.
    expect(screen.getByRole('checkbox', { name: 'Name' })).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: 'Age' }))
    expect(headers()).toEqual(['Name', 'Age'])
  })

  it('respects a controlled columnState and searches only visible columns', () => {
    render(
      <DataTable
        columns={columns}
        rows={people}
        getRowId={(p) => p.id}
        columnState={{ hidden: ['age'] }}
        searchable
      />,
    )
    expect(screen.queryByRole('columnheader', { name: 'Age' })).toBeNull()
    // people[2] is 34; no name contains "34" (names run Person 00–29).
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: String(people[2]!.age) },
    })
    // The age is hidden, so a query on it matches nothing.
    expect(screen.getByRole('cell', { name: 'No matching rows' })).toBeInTheDocument()
  })
})

describe('DataTable column layout: menu, reorder, pin, resize', () => {
  const layoutColumns: Column<Person>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'age', header: 'Age' },
  ]
  const headers = headerLabels

  it('reorders, pins and hides through the header menu and reports the layout', async () => {
    const user = userEvent.setup()
    const onColumnStateChange = vi.fn()
    render(
      <DataTable
        columns={layoutColumns}
        rows={people.slice(0, 3)}
        getRowId={(p) => p.id}
        columnSettings={{ reorderable: true, pinnable: true, visibility: true }}
        onColumnStateChange={onColumnStateChange}
      />,
    )
    expect(headers()).toEqual(['Name', 'Age'])

    // Move Age left of Name.
    await user.click(screen.getByRole('button', { name: 'Options for Age' }))
    await user.click((await screen.findAllByRole('menuitem', { name: 'Move left' }))[1]!)
    expect(headers()).toEqual(['Age', 'Name'])
    expect(onColumnStateChange).toHaveBeenLastCalledWith({ order: ['age', 'name'] })

    // Pin Name to the start: it renders first again, and its cells are sticky.
    await user.click(screen.getByRole('button', { name: 'Options for Name' }))
    await user.click((await screen.findAllByRole('menuitem', { name: 'Pin to start' }))[1]!)
    expect(headers()).toEqual(['Name', 'Age'])
    expect(onColumnStateChange).toHaveBeenLastCalledWith({
      order: ['age', 'name'],
      pinned: { name: 'start' },
    })
    const nameHeader = screen.getByRole('columnheader', { name: /Name/ })
    expect(nameHeader).toHaveAttribute('data-pinned', 'start')
    expect(nameHeader).toHaveAttribute('data-pinned-edge')
    expect(document.querySelectorAll('tbody td[data-pinned="start"]')).toHaveLength(3)

    // Sorting is offered in the menu too.
    await user.click(screen.getByRole('button', { name: 'Options for Name' }))
    await user.click((await screen.findAllByRole('menuitem', { name: 'Sort descending' }))[0]!)
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending')

    // Hide Age from its menu; the last remaining column's Hide is disabled.
    await user.click(screen.getByRole('button', { name: 'Options for Age' }))
    await user.click((await screen.findAllByRole('menuitem', { name: 'Hide column' }))[1]!)
    expect(headers()).toEqual(['Name'])
    expect(onColumnStateChange).toHaveBeenLastCalledWith({
      order: ['age', 'name'],
      pinned: { name: 'start' },
      hidden: ['age'],
    })
  })

  it('resizes with the keyboard handle, switches to a fixed layout, and resets with Home', () => {
    const onColumnStateChange = vi.fn()
    const { container } = render(
      <DataTable
        columns={layoutColumns}
        rows={people.slice(0, 3)}
        getRowId={(p) => p.id}
        columnSettings={{ resizable: true }}
        defaultColumnState={{ widths: { name: 200 } }}
        onColumnStateChange={onColumnStateChange}
      />,
    )
    const root = container.firstChild as HTMLElement
    const col = () => container.querySelector('colgroup col') as HTMLTableColElement
    expect(col().style.width).toBe('200px')
    expect(root).toHaveAttribute('data-resized', 'true')

    const handle = screen.getByRole('separator', { name: 'Resize Name' })
    expect(handle).toHaveAttribute('aria-valuenow', '200')
    fireEvent.keyDown(handle, { key: 'ArrowRight' })
    expect(col().style.width).toBe('216px')
    fireEvent.keyDown(handle, { key: 'ArrowLeft', shiftKey: true })
    expect(col().style.width).toBe('152px')
    expect(onColumnStateChange).toHaveBeenLastCalledWith({ widths: { name: 152 } })
    // Cannot go below the minimum.
    for (let i = 0; i < 10; i++) fireEvent.keyDown(handle, { key: 'ArrowLeft', shiftKey: true })
    expect(col().style.width).toBe('48px')
    // Home returns to auto and the fixed layout is dropped with the last width.
    fireEvent.keyDown(handle, { key: 'Home' })
    expect(col().style.width).toBe('')
    expect(root).not.toHaveAttribute('data-resized')
  })

  it('honours a controlled columnState order and pins', () => {
    render(
      <DataTable
        columns={layoutColumns}
        rows={people.slice(0, 2)}
        getRowId={(p) => p.id}
        columnState={{ order: ['age', 'name'], pinned: { name: 'end' } }}
      />,
    )
    // Pinned-end renders last even though `order` puts it first among unpinned.
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Age', 'Name'])
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('data-pinned', 'end')
  })
})

describe('DataTable multi-sort and persisted state', () => {
  const rows = [
    { id: 'r1', city: 'B', age: 30 },
    { id: 'r2', city: 'A', age: 40 },
    { id: 'r3', city: 'B', age: 20 },
    { id: 'r4', city: 'A', age: 10 },
  ]
  const twoColumns: Column<(typeof rows)[number]>[] = [
    { key: 'city', header: 'City', sortable: true },
    { key: 'age', header: 'Age', sortable: true },
  ]
  const cities = () =>
    [...document.querySelectorAll('tbody td:first-child')].map((td) => td.textContent)

  it('adds a tie-breaker on Shift-click and reports it as thenBy', () => {
    const onSortChange = vi.fn()
    render(
      <DataTable
        columns={twoColumns}
        rows={rows}
        getRowId={(r) => r.id}
        multiSort
        onSortChange={onSortChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'City' }))
    // Primary only: stable within the city groups.
    expect(cities()).toEqual(['A', 'A', 'B', 'B'])
    fireEvent.click(screen.getByRole('button', { name: /Age/ }), { shiftKey: true })
    expect(onSortChange).toHaveBeenLastCalledWith({
      key: 'city',
      direction: 'asc',
      thenBy: [{ key: 'age', direction: 'asc' }],
    })
    const ages = () =>
      [...document.querySelectorAll('tbody td:nth-child(2)')].map((td) => td.textContent)
    expect(ages()).toEqual(['10', '40', '20', '30'])
    // Both sorted headers expose their direction; the level badges read 1 and 2.
    expect(screen.getByRole('columnheader', { name: /City/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    expect(screen.getByRole('columnheader', { name: /Age/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    expect([...document.querySelectorAll('thead sup')].map((s) => s.textContent)).toEqual([
      '1',
      '2',
    ])
    // Shift-click the tie-breaker again flips it; a plain click replaces the whole sort.
    fireEvent.click(screen.getByRole('button', { name: /Age/ }), { shiftKey: true })
    expect(ages()).toEqual(['40', '10', '30', '20'])
    fireEvent.click(screen.getByRole('button', { name: /Age/ }))
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'age', direction: 'asc' })
    expect(document.querySelectorAll('thead sup')).toHaveLength(0)
  })

  it('ignores Shift without multiSort', () => {
    const onSortChange = vi.fn()
    render(
      <DataTable
        columns={twoColumns}
        rows={rows}
        getRowId={(r) => r.id}
        onSortChange={onSortChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'City' }))
    fireEvent.click(screen.getByRole('button', { name: 'Age' }), { shiftKey: true })
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'age', direction: 'asc' })
  })

  it('remembers column layout and sort under stateKey across mounts', async () => {
    const user = userEvent.setup()
    window.localStorage.removeItem('cascivo.data-table.people-test')
    const first = render(
      <DataTable
        columns={twoColumns}
        rows={rows}
        getRowId={(r) => r.id}
        stateKey="people-test"
        columnSettings={{ visibility: true }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Age' }))
    await user.click(screen.getByRole('button', { name: 'Columns' }))
    await user.click(screen.getByRole('checkbox', { name: 'City' }))
    expect(headerLabels()).toEqual(['Age'])
    expect(JSON.parse(window.localStorage.getItem('cascivo.data-table.people-test')!)).toEqual({
      v: 1,
      value: { columnState: { hidden: ['city'] }, sort: { key: 'age', direction: 'asc' } },
    })
    first.unmount()

    // A fresh mount with the same key comes back sorted and with the column hidden…
    render(
      <DataTable columns={twoColumns} rows={rows} getRowId={(r) => r.id} stateKey="people-test" />,
    )
    expect(headerLabels()).toEqual(['Age'])
    expect(screen.getByRole('columnheader', { name: /Age/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    // …while a controlled prop still wins over the stored value.
    cleanup()
    render(
      <DataTable
        columns={twoColumns}
        rows={rows}
        getRowId={(r) => r.id}
        stateKey="people-test"
        columnState={{}}
      />,
    )
    expect(headerLabels()).toEqual(['City', 'Age'])
    window.localStorage.removeItem('cascivo.data-table.people-test')
  })
})

describe('DataTable server mode', () => {
  it('renders rows verbatim, pages from totalItems, and reports the query on each change', () => {
    const onQueryChange = vi.fn()
    const rows = people.slice(0, 2)
    render(
      <DataTable
        columns={[
          { key: 'name', header: 'Name', sortable: true, filter: 'text' },
          { key: 'age', header: 'Age' },
        ]}
        rows={rows}
        getRowId={(p) => p.id}
        searchable
        pagination={{ pageSize: 2 }}
        server={{ totalItems: 7, onQueryChange }}
      />,
    )
    // Not called on mount: the rows given are the first page.
    expect(onQueryChange).not.toHaveBeenCalled()
    expect(screen.getByText('1–2 of 7')).toBeInTheDocument()

    // Search does not filter on the client; it is reported.
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'zzz' },
    })
    expect(screen.getAllByRole('row')).toHaveLength(1 + 1 + rows.length) // header, filter row, rows
    expect(onQueryChange).toHaveBeenLastCalledWith({
      sort: undefined,
      search: 'zzz',
      filters: {},
      page: 1,
      pageSize: 2,
    })

    // Sorting is reported, not applied.
    fireEvent.click(screen.getByRole('button', { name: 'Name' }))
    expect(onQueryChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: { key: 'name', direction: 'asc' } }),
    )
    // Column filters are reported, not applied.
    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter Name' }), {
      target: { value: 'q' },
    })
    expect(onQueryChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: { name: { kind: 'text', value: 'q' } } }),
    )
    // Paging: next page is enabled by totalItems (4 pages of 2), and reported.
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
  })

  it('lets the page be controlled', () => {
    const onPageChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        rows={people}
        getRowId={(p) => p.id}
        pagination={{ pageSize: 1, page: 2, onPageChange }}
      />,
    )
    expect(screen.getByRole('cell', { name: people[1]!.name })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
    // Still controlled at page 2 until the parent updates.
    expect(screen.getByRole('cell', { name: people[1]!.name })).toBeInTheDocument()
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

// Column-gutter guarantees (WS7). Assert on CSS source: JSDOM does not apply
// CSS-module styles, so computed padding is unavailable, but the source is the
// contract — an overridable inter-column gutter token plus content-wrapping so
// long unbroken tokens (commit hashes) can never spill into the next column.
describe('DataTable column gutter (CSS source)', () => {
  // vp runs package tests with cwd at the package root.
  const css = readFileSync('src/data-table/data-table.module.css', 'utf8')

  it('cells derive their inline padding from the overridable cell-gap token', () => {
    const matches = css.match(
      /padding-inline: var\(--cascivo-data-table-cell-gap, var\(--cascivo-space-4\)\)/g,
    )
    // Applied to both the header cells (th) and the body cells (td).
    expect(matches?.length).toBe(2)
  })

  it('body cells wrap long unbroken content instead of overflowing', () => {
    const tdBlock = css.slice(css.indexOf('.table td {'))
    expect(tdBlock).toMatch(/overflow-wrap: anywhere/)
  })
})

/**
 * Column sizing failure is a silent overflow, so the component measures it.
 *
 * `Column.width`'s doc comment is thorough and an adopter who read all of it still needed
 * three passes, because the arithmetic depends on the container width — which the component
 * knows and they do not. Their failing attempt grew the table past its card and cut the last
 * column off with no visible affordance (2026-08-22 report item 17).
 */
describe('DataTable overflow warning', () => {
  const cols = [
    { key: 'a', header: 'A', width: '20rem' },
    { key: 'b', header: 'B', width: '20rem' },
    { key: 'c', header: 'C' },
  ]
  const rows = [{ a: '1', b: '2', c: '3' }]

  /**
   * jsdom ships no `ResizeObserver`, and the production guard bails when it is absent — so
   * without this stub the test would assert nothing while appearing to pass. It fires once on
   * observe, which is what a real observer does on first attach.
   */
  function stubResizeObserver() {
    const original = (globalThis as { ResizeObserver?: unknown }).ResizeObserver
    ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
      constructor(private cb: () => void) {}
      observe() {
        this.cb()
      }
      unobserve() {}
      disconnect() {}
    }
    return () => {
      ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = original
    }
  }

  function mockScroller(scrollWidth: number, clientWidth: number) {
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        return this.className?.includes?.('scroller') ? scrollWidth : 0
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return this.className?.includes?.('scroller') ? clientWidth : 0
      },
    })
  }

  afterEach(() => {
    // @ts-expect-error restoring the prototype descriptors
    delete HTMLElement.prototype.scrollWidth
    // @ts-expect-error restoring the prototype descriptors
    delete HTMLElement.prototype.clientWidth
  })

  it('names the measured widths and the sized columns when the table overflows', async () => {
    mockScroller(1180, 1037)
    const restoreRO = stubResizeObserver()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<DataTable columns={cols} rows={rows} title="T" />)
    await waitFor(() => {
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('overflows its container'))
    })
    const message = warn.mock.calls.flat().join(' ')
    expect(message).toContain('1180')
    expect(message).toContain('1037')
    expect(message).toContain('a, b')
    warn.mockRestore()
    restoreRO()
  })

  it('stays silent when the table fits', async () => {
    mockScroller(1037, 1037)
    const restoreRO = stubResizeObserver()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<DataTable columns={cols} rows={rows} title="T" />)
    await new Promise((r) => setTimeout(r, 30))
    expect(
      warn.mock.calls.flat().join(' '),
      'a warning that fires on a correct configuration is worse than none',
    ).not.toContain('overflows its container')
    warn.mockRestore()
    restoreRO()
  })
})

describe('DataTable grid keyboard mode and inline editing', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ id: `g${i}`, name: `Row ${i}`, qty: i }))
  type Item = (typeof rows)[number]
  const gridColumns: Column<Item>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'qty', header: 'Qty' },
  ]
  const cellAt = (row: number, col: number) =>
    document.querySelector<HTMLElement>(`[data-cell="${row},${col}"]`)!
  const active = () => (document.activeElement as HTMLElement).dataset['cell']

  it('is one Tab stop: the first header cell, with every control out of the tab order', () => {
    render(
      <DataTable
        columns={gridColumns}
        rows={rows}
        getRowId={(r) => r.id}
        keyboardNavigation="grid"
        selection={{ mode: 'multi' }}
        rowActions={() => [{ id: 'x', label: 'X', onSelect: () => {} }]}
      />,
    )
    const table = screen.getByRole('grid')
    const stops = [...table.querySelectorAll('[tabindex="0"]')]
    expect(stops).toHaveLength(1)
    expect(stops[0]).toHaveAttribute('data-cell', '-1,0')
    expect(screen.getByRole('button', { name: 'Name' })).toHaveAttribute('tabindex', '-1')
    for (const box of screen.getAllByRole('checkbox')) expect(box).toHaveAttribute('tabindex', '-1')
    for (const menu of screen.getAllByRole('button', { name: 'Actions' }))
      expect(menu).toHaveAttribute('tabindex', '-1')
  })

  it('moves the focused cell with the arrows, Home/End, Ctrl+Home/End and PageDown', () => {
    render(
      <DataTable
        columns={gridColumns}
        rows={rows}
        getRowId={(r) => r.id}
        keyboardNavigation="grid"
        windowSize={5}
      />,
    )
    const start = cellAt(-1, 0)
    start.focus()
    fireEvent.keyDown(start, { key: 'ArrowDown' })
    expect(active()).toBe('0,0')
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' })
    expect(active()).toBe('0,1')
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' })
    expect(active()).toBe('0,1')
    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    expect(active()).toBe('0,0')
    fireEvent.keyDown(document.activeElement!, { key: 'PageDown' })
    expect(active()).toBe('5,0')
    fireEvent.keyDown(document.activeElement!, { key: 'End', ctrlKey: true })
    expect(active()).toBe('11,1')
    fireEvent.keyDown(document.activeElement!, { key: 'Home', ctrlKey: true })
    expect(active()).toBe('0,0')
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
    expect(active()).toBe('-1,0')
    // The Tab stop followed the focus.
    expect(document.querySelectorAll('[role="grid"] [tabindex="0"]')).toHaveLength(1)
    expect(cellAt(-1, 0)).toHaveAttribute('tabindex', '0')
  })

  it("Enter moves into the cell's control and Escape comes back out", () => {
    render(
      <DataTable
        columns={gridColumns}
        rows={rows}
        getRowId={(r) => r.id}
        keyboardNavigation="grid"
      />,
    )
    const header = cellAt(-1, 0)
    header.focus()
    fireEvent.keyDown(header, { key: 'Enter' })
    const sortButton = screen.getByRole('button', { name: 'Name' })
    expect(document.activeElement).toBe(sortButton)
    fireEvent.keyDown(sortButton, { key: 'Escape' })
    expect(document.activeElement).toBe(header)
    // Clicking into another cell's control moves the Tab stop there.
    fireEvent.focus(cellAt(2, 1))
    expect(cellAt(2, 1)).toHaveAttribute('tabindex', '0')
    expect(header).toHaveAttribute('tabindex', '-1')
  })

  it('scrolls a virtualized table to a row outside the window, then focuses it', () => {
    render(
      <DataTable
        columns={gridColumns}
        rows={Array.from({ length: 1000 }, (_, i) => ({ id: `v${i}`, name: `Row ${i}`, qty: i }))}
        getRowId={(r) => r.id}
        keyboardNavigation="grid"
        virtualized
        rowHeight={40}
        windowSize={10}
      />,
    )
    const scroller = document.querySelector(`.${styles['scroller']}`) as HTMLDivElement
    Object.defineProperty(scroller, 'scrollTop', { writable: true, value: 0 })
    const header = cellAt(-1, 1)
    header.focus()
    fireEvent.keyDown(header, { key: 'End', ctrlKey: true })
    expect(document.querySelector('[data-cell="999,1"]')).toBeNull()
    expect(scroller.scrollTop).toBe(1000 * 40 - 10 * 40)
    // The scroll lands the last row in the window and the pending focus finds it.
    scroller.dispatchEvent(new Event('scroll'))
    expect(active()).toBe('999,1')
  })

  it('edits a cell in place and commits through onCellEdit', async () => {
    const user = userEvent.setup()
    const onCellEdit = vi.fn()
    render(
      <DataTable
        columns={[
          { key: 'name', header: 'Name', editable: true },
          { key: 'qty', header: 'Qty', editable: true, render: (r) => <b>{r.qty}</b> },
        ]}
        rows={rows.slice(0, 3)}
        getRowId={(r) => r.id}
        onCellEdit={onCellEdit}
      />,
    )
    // A custom `render` wins over `editable`.
    expect(screen.queryAllByRole('button', { name: 'Edit Qty' })).toHaveLength(0)
    const previews = screen.getAllByRole('button', { name: 'Edit Name' })
    expect(previews).toHaveLength(3)
    await user.click(previews[1]!)
    const input = screen.getByRole('textbox', { name: 'Edit Name' })
    await user.clear(input)
    await user.type(input, 'Renamed{Enter}')
    expect(onCellEdit).toHaveBeenCalledWith(rows[1], 'name', 'Renamed')
    // Nothing is editable without a commit handler.
    cleanup()
    render(
      <DataTable
        columns={[{ key: 'name', header: 'Name', editable: true }]}
        rows={rows.slice(0, 3)}
        getRowId={(r) => r.id}
      />,
    )
    expect(screen.queryAllByRole('button', { name: 'Edit Name' })).toHaveLength(0)
  })

  it('in grid mode, Enter on an editable cell opens the editor and Escape returns to the cell', () => {
    render(
      <DataTable
        columns={[{ key: 'name', header: 'Name', editable: true }]}
        rows={rows.slice(0, 3)}
        getRowId={(r) => r.id}
        keyboardNavigation="grid"
        onCellEdit={() => {}}
      />,
    )
    const cell = cellAt(1, 0)
    cell.focus()
    fireEvent.keyDown(cell, { key: 'Enter' })
    const input = screen.getByRole('textbox', { name: 'Edit Name' })
    expect(document.activeElement).toBe(input)
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(document.activeElement).toBe(cellAt(1, 0))
  })
})

describe('DataTable grouping, totals, pinned rows and column groups', () => {
  const orders = [
    { id: 'o1', region: 'EU', status: 'open', amount: 10 },
    { id: 'o2', region: 'US', status: 'open', amount: 20 },
    { id: 'o3', region: 'EU', status: 'closed', amount: 5 },
    { id: 'o4', region: 'EU', status: 'open', amount: 7 },
  ]
  type Order = (typeof orders)[number]
  const orderColumns: Column<Order>[] = [
    { key: 'region', header: 'Region' },
    { key: 'status', header: 'Status', aggregate: 'count' },
    { key: 'amount', header: 'Amount', align: 'end', aggregate: 'sum' },
  ]
  const bodyRows = () =>
    [...document.querySelectorAll('tbody tr')].map((tr) =>
      [...tr.querySelectorAll('td')].map((td) => td.textContent?.trim()).join('|'),
    )

  it('interleaves collapsible group rows with counts and aggregates', () => {
    render(
      <DataTable columns={orderColumns} rows={orders} getRowId={(o) => o.id} groupBy="region" />,
    )
    expect(bodyRows()).toEqual([
      'EU(3)|3|22',
      'EU|open|10',
      'EU|closed|5',
      'EU|open|7',
      'US(1)|1|20',
      'US|open|20',
    ])
    const eu = screen.getByRole('button', { name: /EU/ })
    expect(eu).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(eu)
    expect(eu).toHaveAttribute('aria-expanded', 'false')
    expect(bodyRows()).toEqual(['EU(3)|3|22', 'US(1)|1|20', 'US|open|20'])
  })

  it('nests two levels, keeps the sort inside groups and selects only leaves', () => {
    const onChange = vi.fn()
    render(
      <DataTable
        columns={[{ ...orderColumns[0]!, sortable: true }, orderColumns[1]!, orderColumns[2]!]}
        rows={orders}
        getRowId={(o) => o.id}
        groupBy={['region', 'status']}
        defaultSort={{ key: 'amount', direction: 'asc' }}
        selection={{ mode: 'multi', onChange }}
      />,
    )
    const groups = [...document.querySelectorAll('tbody tr[data-depth]')].map(
      (tr) => `${tr.getAttribute('data-depth')}:${tr.querySelector('button')?.textContent}`,
    )
    expect(groups).toEqual(['0:EU(3)', '1:closed(1)', '1:open(2)', '0:US(1)', '1:open(1)'])
    fireEvent.click(screen.getByRole('checkbox', { name: /select all/i }))
    expect(onChange).toHaveBeenLastCalledWith(['o3', 'o4', 'o1', 'o2'])
  })

  it('renders a totals row over the filtered rows, not the page', () => {
    render(
      <DataTable
        columns={orderColumns}
        rows={orders}
        getRowId={(o) => o.id}
        totals
        searchable
        pagination={{ pageSize: 2 }}
      />,
    )
    const totalsRow = () =>
      [...document.querySelectorAll('tfoot td')].map((td) => td.textContent?.trim()).join('|')
    expect(totalsRow()).toBe('Total|4|42')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'EU' } })
    expect(totalsRow()).toBe('Total|3|22')
  })

  it('renders pinned rows outside sort, filters and the virtual window', () => {
    const many = Array.from({ length: 500 }, (_, i) => ({
      id: `m${i}`,
      region: 'EU',
      status: 'open',
      amount: i,
    }))
    render(
      <DataTable
        columns={orderColumns}
        rows={many}
        getRowId={(o) => o.id}
        pinnedRows={{
          top: [{ id: 'top', region: 'Pinned top', status: '', amount: 0 }],
          bottom: [{ id: 'bottom', region: 'Pinned bottom', status: '', amount: 0 }],
        }}
        virtualized
        rowHeight={40}
        windowSize={10}
        searchable
      />,
    )
    const first = () => document.querySelector('tbody tr')
    const last = () => document.querySelector('tbody tr:last-child')
    expect(first()).toHaveAttribute('data-pinned-row', 'top')
    expect(last()).toHaveAttribute('data-pinned-row', 'bottom')
    // Pinned rows are not counted as body rows and survive a search that excludes them.
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '500')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '49' } })
    expect(document.querySelectorAll('tbody tr[aria-rowindex]').length).toBeLessThan(500)
    expect(first()?.textContent).toContain('Pinned top')
    expect(last()?.textContent).toContain('Pinned bottom')
  })

  it('spans a column-group header over adjacent columns', () => {
    render(
      <DataTable
        columns={orderColumns}
        rows={orders}
        getRowId={(o) => o.id}
        selection={{ mode: 'multi' }}
        columnGroups={[{ header: 'Order', columns: ['status', 'amount'] }]}
      />,
    )
    const groupRow = document.querySelector('thead tr[data-group-header]')!
    const spans = [...groupRow.querySelectorAll('th')].map(
      (th) => `${th.textContent}:${th.colSpan}`,
    )
    expect(spans).toEqual([':1', ':1', 'Order:2'])
    expect(screen.getByRole('columnheader', { name: 'Order' })).toHaveAttribute('scope', 'colgroup')
    // The real header row still has one cell per column.
    expect(screen.getByRole('columnheader', { name: 'Region' })).toBeInTheDocument()
  })
})

describe('DataTable CSV export', () => {
  it('downloads the filtered, sorted rows with the visible columns as headers', async () => {
    const blobs: Blob[] = []
    const clicks: string[] = []
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: (blob: Blob) => {
        blobs.push(blob)
        return 'blob:test'
      },
    })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => {} })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicks.push(this.download)
      })
    render(
      <DataTable
        columns={[
          { key: 'name', header: 'Name, full' },
          { key: 'age', header: 'Age', render: (p) => <b>{p.age}</b> },
        ]}
        rows={people.slice(0, 4)}
        getRowId={(p) => p.id}
        title="People"
        searchable
        pagination={{ pageSize: 2 }}
        defaultSort={{ key: 'age', direction: 'desc' }}
        exportable
      />,
    )
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Person 0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }))
    expect(clicks).toEqual(['People.csv'])
    // A UTF-8 byte-order mark leads, so spreadsheet apps decode the file as UTF-8.
    const bytes = new Uint8Array(await blobs[0]!.arrayBuffer())
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf])
    const sorted = people.slice(0, 4).sort((a, b) => b.age - a.age)
    expect(new TextDecoder().decode(bytes)).toBe(
      '"Name, full",Age\r\n' + sorted.map((p) => `${p.name},${p.age}\r\n`).join(''),
    )
    click.mockRestore()
  })
})
