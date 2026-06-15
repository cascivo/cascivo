import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Deployments } from './Deployments'

it('renders five filter controls', () => {
  render(<Deployments />)
  expect(screen.getByPlaceholderText(/search branches/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/date range/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/authors/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/environments/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/repositories/i)).toBeInTheDocument()
})

it('shows No Results empty state when branch filter matches nothing', async () => {
  render(<Deployments />)
  await userEvent.type(screen.getByPlaceholderText(/search branches/i), 'zzznomatch')
  expect(screen.getByText(/no results/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
})
