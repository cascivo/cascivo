import { render, screen } from '@testing-library/react'
import { IssueListView } from './IssueListView'

it('renders the Forum / Issues breadcrumb', () => {
  render(<IssueListView />)
  expect(screen.getAllByText('Forum').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Issues').length).toBeGreaterThan(0)
})

it('renders All Issues tab', () => {
  render(<IssueListView />)
  expect(screen.getByRole('tab', { name: 'All Issues' })).toBeInTheDocument()
})
