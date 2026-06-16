import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DashboardTable } from './dashboard-table'

describe('DashboardTable', () => {
  it('renders table with data rows', () => {
    render(<DashboardTable />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('renders search input', () => {
    render(<DashboardTable />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('filters rows when search input changes', async () => {
    const user = userEvent.setup()
    render(<DashboardTable />)
    const search = screen.getByRole('searchbox')
    await user.type(search, 'alice')
    const dataRows = screen.getAllByRole('row').filter((r) => r.closest('tbody') !== null)
    expect(dataRows.length).toBe(1)
    expect(dataRows[0]).toHaveTextContent(/alice/i)
  })

  it('renders pagination buttons', () => {
    render(<DashboardTable />)
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('renders export button', () => {
    render(<DashboardTable />)
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  })
})
