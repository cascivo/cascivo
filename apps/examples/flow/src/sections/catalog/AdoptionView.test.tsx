import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdoptionView } from './AdoptionView'

it('renders four metric cards', () => {
  render(<AdoptionView />)
  expect(screen.getByText('Assets in the catalog')).toBeInTheDocument()
  expect(screen.getByText('Processes using catalog assets')).toBeInTheDocument()
})

it('renders the chart section heading', () => {
  render(<AdoptionView />)
  expect(screen.getByRole('heading', { name: /asset usage over time/i })).toBeInTheDocument()
})

it('renders top 5 assets section', () => {
  render(<AdoptionView />)
  expect(screen.getByRole('heading', { name: /top 5 assets/i })).toBeInTheDocument()
})
