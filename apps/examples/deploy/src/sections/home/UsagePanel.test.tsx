import { render, screen } from '@testing-library/react'
import { UsagePanel } from './UsagePanel'

it('renders Usage section heading', () => {
  render(<UsagePanel />)
  expect(screen.getByText(/usage/i)).toBeInTheDocument()
})

it('renders four usage metric rows', () => {
  render(<UsagePanel />)
  expect(screen.getByText(/fast data transfer/i)).toBeInTheDocument()
  expect(screen.getByText(/fast edge transfer/i)).toBeInTheDocument()
  expect(screen.getByText(/private data transfer/i)).toBeInTheDocument()
  expect(screen.getByText(/edge requests/i)).toBeInTheDocument()
})

it('renders Alerts section', () => {
  render(<UsagePanel />)
  expect(screen.getByText(/alerts/i)).toBeInTheDocument()
})

it('renders Recent Processes section', () => {
  render(<UsagePanel />)
  expect(screen.getByText(/recent processes/i)).toBeInTheDocument()
})
