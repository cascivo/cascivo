import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLocale } from '@cascivo/i18n'
import { createRenderProbe } from '../test-utils/render-count'
import { readFileSync } from 'node:fs'
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
