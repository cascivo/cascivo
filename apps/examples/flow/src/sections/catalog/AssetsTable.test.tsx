import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssetsTable } from './AssetsTable'

it('renders the search input', () => {
  render(<AssetsTable />)
  expect(screen.getByPlaceholderText(/search assets/i)).toBeInTheDocument()
})

it('renders asset names from seeded data', () => {
  render(<AssetsTable />)
  expect(screen.getByText('AI Agent Task')).toBeInTheDocument()
})

it('filters assets when typing in search', async () => {
  render(<AssetsTable />)
  await userEvent.type(screen.getByPlaceholderText(/search assets/i), 'Slack')
  expect(screen.getByText('Slack Connector')).toBeInTheDocument()
  expect(screen.queryByText('AI Agent Task')).toBeNull()
})
