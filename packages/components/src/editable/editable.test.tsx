import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editable } from './editable'

describe('Editable', () => {
  it('renders preview text', () => {
    render(<Editable value="Hello" onValueChange={() => {}} />)
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('renders placeholder when value is empty', () => {
    render(<Editable value="" onValueChange={() => {}} placeholder="Enter text" />)
    expect(screen.getByText('Enter text')).toBeTruthy()
  })

  it('has a button in preview state', () => {
    render(<Editable value="Click me" onValueChange={() => {}} />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('enters editing mode on click', async () => {
    render(<Editable value="Click me" onValueChange={() => {}} />)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  it('shows current value in input when editing', async () => {
    render(<Editable value="Hello" onValueChange={() => {}} />)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('textbox')).toHaveValue('Hello')
  })

  it('calls onValueChange on Enter', async () => {
    const handler = vi.fn()
    render(<Editable value="Hello" onValueChange={handler} />)
    await userEvent.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, 'World')
    await userEvent.keyboard('{Enter}')
    expect(handler).toHaveBeenCalledWith('World')
  })

  it('cancels on Escape', async () => {
    const handler = vi.fn()
    const cancelHandler = vi.fn()
    render(
      <Editable
        value="Hello"
        onValueChange={handler}
        onCancel={cancelHandler}
        submitOnBlur={false}
      />,
    )
    await userEvent.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'X')
    await userEvent.keyboard('{Escape}')
    expect(handler).not.toHaveBeenCalled()
    expect(cancelHandler).toHaveBeenCalled()
    // Returns to preview mode
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('submits on blur when submitOnBlur=true', async () => {
    const handler = vi.fn()
    render(<Editable value="Hello" onValueChange={handler} submitOnBlur />)
    await userEvent.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, 'Blurred')
    await userEvent.tab()
    expect(handler).toHaveBeenCalledWith('Blurred')
  })

  it('is disabled when disabled prop set', () => {
    render(<Editable value="Hello" onValueChange={() => {}} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
