import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyDashboard } from './empty-dashboard'

describe('EmptyDashboard', () => {
  it('renders without crashing', () => {
    render(<EmptyDashboard />)
    expect(screen.getByText('No data yet')).toBeInTheDocument()
  })
})
