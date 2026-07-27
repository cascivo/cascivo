import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataTable, type Column } from './data-table'

interface Row {
  id: string
  hash: string
  message: string
}
const rows: Row[] = [
  { id: '1', hash: 'a1b2c3d', message: 'fix: stop the free-form column collapsing' },
  { id: '2', hash: 'e4f5a6b', message: 'chore: bump deps' },
]

describe('DataTable column sizing', () => {
  it('keeps the auto layout when any column is unsized, so it cannot collapse', () => {
    const columns: Column<Row>[] = [
      { key: 'hash', header: 'Commit', width: '8rem' },
      { key: 'message', header: 'Message' },
    ]
    const { container } = render(
      <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} pagination />,
    )
    expect(container.querySelector('[data-fixed-layout]')).toBeNull()
  })

  it('uses the fixed layout only when every column declares a width', () => {
    const columns: Column<Row>[] = [
      { key: 'hash', header: 'Commit', width: '8rem' },
      { key: 'message', header: 'Message', width: '24rem' },
    ]
    const { container } = render(
      <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} pagination />,
    )
    expect(container.querySelector('[data-fixed-layout="true"]')).not.toBeNull()
  })

  it('marks only sized columns for aggressive wrapping', () => {
    const columns: Column<Row>[] = [
      { key: 'hash', header: 'Commit', width: '8rem' },
      { key: 'message', header: 'Message' },
    ]
    const { container } = render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} />)
    const headers = [...container.querySelectorAll('th')]
    expect(headers[0]!.getAttribute('data-sized')).toBe('true')
    expect(headers[1]!.getAttribute('data-sized')).toBeNull()
  })

  it('emits minWidth on the col so a free-form column keeps a floor', () => {
    const columns: Column<Row>[] = [
      { key: 'hash', header: 'Commit', width: '8rem' },
      { key: 'message', header: 'Message', minWidth: '20rem' },
    ]
    const { container } = render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} />)
    const cols = [...container.querySelectorAll('col')]
    expect(cols[1]!.style.minWidth).toBe('20rem')
    expect(cols[1]!.style.width).toBe('')
  })
})
