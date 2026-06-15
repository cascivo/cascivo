import { render, screen } from '@testing-library/react'
import { IssueRow } from './IssueRow'
import type { Issue } from '../store/issues'

const issue: Issue = {
  id: 'issue-1',
  title: 'Fix login bug',
  status: 'in-progress',
  priority: 'high',
  assigneeId: 'user-1',
  labelIds: [],
  createdAt: new Date(2026, 5, 10).toISOString(),
}

it('renders issue ID with FO prefix', () => {
  render(<IssueRow issue={issue} index={1} />)
  expect(screen.getByText('FO-1')).toBeInTheDocument()
})

it('renders issue title', () => {
  render(<IssueRow issue={issue} index={1} />)
  expect(screen.getByText('Fix login bug')).toBeInTheDocument()
})

it('has data-status attribute for CSS status circle', () => {
  const { container } = render(<IssueRow issue={issue} index={1} />)
  expect(container.querySelector('[data-status="in-progress"]')).toBeInTheDocument()
})
