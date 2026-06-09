import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from './select'

const options = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer', disabled: true },
]

describe('Select', () => {
  it('renders with label and options', () => {
    render(<Select label="Role" options={options} />)
    expect(screen.getByLabelText('Role')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument()
  })

  it('renders a disabled placeholder when provided', () => {
    render(<Select label="Role" placeholder="Choose a role" options={options} />)
    const placeholder = screen.getByRole('option', { name: 'Choose a role' })
    expect(placeholder).toBeDisabled()
  })

  it('marks individual options disabled', () => {
    render(<Select label="Role" options={options} />)
    expect(screen.getByRole('option', { name: 'Viewer' })).toBeDisabled()
  })

  it('shows error and marks invalid', () => {
    render(<Select label="Role" options={options} error="Required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
    expect(screen.getByLabelText('Role')).toHaveAttribute('aria-invalid', 'true')
  })

  it('calls onChange when an option is selected', async () => {
    const handler = vi.fn()
    render(<Select label="Role" options={options} onChange={handler} />)
    await userEvent.selectOptions(screen.getByLabelText('Role'), 'editor')
    expect(handler).toHaveBeenCalled()
  })
})
