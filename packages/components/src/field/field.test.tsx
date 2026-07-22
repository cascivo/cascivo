import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Field } from './field'

afterEach(cleanup)

// A minimal control that renders its own <label> when given one — mirrors how
// Input/Textarea behave, without importing them.
function LabelledControl({ label, ...rest }: { label?: string; id?: string }) {
  return (
    <>
      {label && <label htmlFor={rest.id}>{label}</label>}
      <input {...rest} />
    </>
  )
}

describe('Field', () => {
  it('renders the label associated with the control', () => {
    render(
      <Field label="Email">
        <input />
      </Field>,
    )
    const input = screen.getByLabelText('Email')
    expect(input).toBeInTheDocument()
    expect(input.id).toBeTruthy()
  })

  it('warns (once) when the Field and its child both define a label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <Field label="Country">
        <LabelledControl label="Country" />
      </Field>,
    )
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/both the Field and its child control define a `label`/)
    warn.mockRestore()
  })

  it('does not warn when only the Field defines a label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <Field label="City">
        <LabelledControl />
      </Field>,
    )
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('wires aria-describedby to the description', () => {
    render(
      <Field label="Email" description="We never share it.">
        <input data-testid="control" />
      </Field>,
    )
    const input = screen.getByTestId('control')
    const description = screen.getByText('We never share it.')
    expect(input.getAttribute('aria-describedby')).toBe(description.id)
  })

  it('marks the control invalid and announces the error', () => {
    render(
      <Field label="Email" error="Email is required">
        <input data-testid="control" />
      </Field>,
    )
    const input = screen.getByTestId('control')
    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('Email is required')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.getAttribute('aria-describedby')).toBe(error.id)
  })

  it('joins description and error ids in aria-describedby', () => {
    render(
      <Field label="Email" description="Helper" error="Bad">
        <input data-testid="control" />
      </Field>,
    )
    const input = screen.getByTestId('control')
    const description = screen.getByText('Helper')
    const error = screen.getByRole('alert')
    expect(input.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id}`)
  })

  it('shows a required marker on the label', () => {
    render(
      <Field label="Email" required>
        <input />
      </Field>,
    )
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
  })

  it('disables the control and label when disabled', () => {
    render(
      <Field label="Email" disabled>
        <input data-testid="control" />
      </Field>,
    )
    expect(screen.getByTestId('control')).toBeDisabled()
    expect(screen.getByText('Email')).toHaveAttribute('data-disabled', '')
  })
})
