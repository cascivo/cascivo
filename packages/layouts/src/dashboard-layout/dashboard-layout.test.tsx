import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DashboardLayout } from './dashboard-layout'

describe('DashboardLayout', () => {
  it('renders main content', () => {
    render(<DashboardLayout main={<div>Main</div>} />)
    expect(screen.getByText('Main')).toBeInTheDocument()
  })

  it('renders stats slot', () => {
    render(<DashboardLayout stats={<div>Stats</div>} main={<div>M</div>} />)
    expect(screen.getByText('Stats')).toBeInTheDocument()
  })

  it('renders aside slot', () => {
    render(<DashboardLayout main={<div>M</div>} aside={<div>Aside</div>} />)
    expect(screen.getByText('Aside')).toBeInTheDocument()
  })

  it('omits aside when not provided', () => {
    const { container } = render(<DashboardLayout main={<div>M</div>} />)
    expect(container.querySelector('.aside')).toBeNull()
  })
})
