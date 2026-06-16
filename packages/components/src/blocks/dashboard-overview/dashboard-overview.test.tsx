import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DashboardOverview } from './dashboard-overview'

describe('DashboardOverview', () => {
  it('renders welcome heading', () => {
    render(<DashboardOverview />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders four stat cards', () => {
    render(<DashboardOverview />)
    expect(screen.getAllByTestId('stat-card')).toHaveLength(4)
  })

  it('renders Revenue, Active Users, Orders, Conversion Rate labels', () => {
    render(<DashboardOverview />)
    expect(screen.getByText(/revenue/i)).toBeInTheDocument()
    expect(screen.getByText(/active users/i)).toBeInTheDocument()
    expect(screen.getByText(/orders/i)).toBeInTheDocument()
    expect(screen.getByText(/conversion rate/i)).toBeInTheDocument()
  })
})
