import { render, screen } from '@testing-library/react'
import { FlagsView } from './FlagsView'

it('renders No flags found empty state', () => {
  render(<FlagsView />)
  expect(screen.getByText(/no flags found/i)).toBeInTheDocument()
})

it('renders Create Flag button', () => {
  render(<FlagsView />)
  expect(screen.getAllByRole('button', { name: /create flag/i }).length).toBeGreaterThanOrEqual(1)
})

it('renders Marketplace Providers section heading', () => {
  render(<FlagsView />)
  expect(screen.getByText(/marketplace providers/i)).toBeInTheDocument()
})

it('renders three provider cards', () => {
  render(<FlagsView />)
  expect(screen.getByText('Statsig')).toBeInTheDocument()
  expect(screen.getByText('GrowthBook')).toBeInTheDocument()
  expect(screen.getByText('PostHog')).toBeInTheDocument()
})

it('renders a Create button on each provider card', () => {
  render(<FlagsView />)
  expect(screen.getAllByRole('button', { name: /^create$/i }).length).toBe(3)
})
