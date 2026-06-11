import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatsCards } from './stats-cards'

describe('StatsCards', () => {
  it('renders without crashing', () => {
    render(<StatsCards />)
    expect(screen.getByText('Total users')).toBeInTheDocument()
  })
})
