import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarketingFeatures } from './marketing-features'

describe('MarketingFeatures', () => {
  it('renders section heading', () => {
    render(<MarketingFeatures />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('renders six feature cells', () => {
    render(<MarketingFeatures />)
    expect(screen.getAllByTestId('feature-cell')).toHaveLength(6)
  })

  it('each feature cell has a title and description', () => {
    render(<MarketingFeatures />)
    const cells = screen.getAllByTestId('feature-cell')
    cells.forEach((cell) => {
      expect(cell.querySelector('h3')).not.toBeNull()
      expect(cell.querySelector('p')).not.toBeNull()
    })
  })
})
