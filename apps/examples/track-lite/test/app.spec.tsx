import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App'
import { resetStore } from '../src/store'

// The same flows track-lite-htmx/server/tests/smoke.rs drives over HTTP.
describe('track-lite', () => {
  beforeEach(() => resetStore())

  it('lists the seed', () => {
    render(<App teammateMs={0} />)
    expect(screen.getByText('6 issues')).toBeInTheDocument()
    expect(screen.getByText('Fix login redirect loop')).toBeInTheDocument()
  })

  it('creates an issue from the dialog and toasts', async () => {
    render(<App teammateMs={0} />)
    fireEvent.click(screen.getByRole('button', { name: 'New issue' }))
    // Modal opens from an effect (showModal), so the dialog appears a tick later.
    const create = await screen.findByRole('button', { name: 'Create issue' })
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Ship the compare doc' } })
    fireEvent.click(create)
    expect(screen.getByText('7 issues')).toBeInTheDocument()
    expect(screen.getByText('Ship the compare doc')).toBeInTheDocument()
    expect(screen.getByText('Issue created')).toBeInTheDocument()
  })

  it('shows the server-equal error for a short title', async () => {
    render(<App teammateMs={0} />)
    fireEvent.click(screen.getByRole('button', { name: 'New issue' }))
    const create = await screen.findByRole('button', { name: 'Create issue' })
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'ab' } })
    fireEvent.click(create)
    expect(screen.getByText('Use at least 3 characters.')).toBeInTheDocument()
    expect(screen.getByText('6 issues')).toBeInTheDocument()
  })

  it('advances and deletes an issue', () => {
    render(<App teammateMs={0} />)
    fireEvent.click(screen.getByRole('button', { name: 'Advance Write onboarding docs' }))
    const row = document.getElementById('issue-3')
    if (!row) throw new Error('row 3 missing')
    expect(within(row).getByText('Todo')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Write onboarding docs' }))
    expect(screen.getByText('5 issues')).toBeInTheDocument()
    expect(screen.getByText('Issue deleted')).toBeInTheDocument()
  })
})
