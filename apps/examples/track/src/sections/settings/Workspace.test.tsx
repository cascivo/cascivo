import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Workspace } from './Workspace'

it('renders the Workspace heading', () => {
  render(<Workspace />)
  expect(screen.getByRole('heading', { name: /workspace/i })).toBeInTheDocument()
})

it('renders the name input', () => {
  render(<Workspace />)
  expect(screen.getByLabelText(/^name/i)).toBeInTheDocument()
})

it('renders the danger zone section', () => {
  render(<Workspace />)
  expect(screen.getByText(/danger zone/i)).toBeInTheDocument()
})

it('shows AlertDialog when Delete workspace is clicked', async () => {
  render(<Workspace />)
  await userEvent.click(screen.getByRole('button', { name: /delete workspace/i }))
  expect(screen.getByRole('alertdialog')).toBeInTheDocument()
})
