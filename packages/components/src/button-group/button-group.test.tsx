import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ButtonGroup } from './button-group'

afterEach(cleanup)

function Buttons() {
  return (
    <>
      <button type="button">One</button>
      <button type="button">Two</button>
      <button type="button">Three</button>
    </>
  )
}

describe('ButtonGroup', () => {
  it('renders a labeled group containing its children', () => {
    render(
      <ButtonGroup aria-label="Actions">
        <Buttons />
      </ButtonGroup>,
    )
    const group = screen.getByRole('group', { name: 'Actions' })
    expect(group).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('applies orientation and size data attributes', () => {
    render(
      <ButtonGroup orientation="vertical" size="lg" aria-label="Views">
        <Buttons />
      </ButtonGroup>,
    )
    const group = screen.getByRole('group')
    expect(group).toHaveAttribute('data-orientation', 'vertical')
    expect(group).toHaveAttribute('data-size', 'lg')
  })

  it('does not move focus with arrow keys when roving is off', async () => {
    render(
      <ButtonGroup aria-label="Actions">
        <Buttons />
      </ButtonGroup>,
    )
    const [one] = screen.getAllByRole('button')
    one.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(one).toHaveFocus()
  })

  it('moves focus across buttons with arrow keys when roving', async () => {
    render(
      <ButtonGroup roving aria-label="Actions">
        <Buttons />
      </ButtonGroup>,
    )
    const [one, two, three] = screen.getAllByRole('button')
    one.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(two).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(three).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(one).toHaveFocus()
  })

  it('does not wrap past the ends unless loop is set', async () => {
    render(
      <ButtonGroup roving aria-label="Actions">
        <Buttons />
      </ButtonGroup>,
    )
    const [one] = screen.getAllByRole('button')
    one.focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(one).toHaveFocus()
  })

  it('wraps with loop enabled', async () => {
    render(
      <ButtonGroup roving loop aria-label="Actions">
        <Buttons />
      </ButtonGroup>,
    )
    const buttons = screen.getAllByRole('button')
    buttons[0]!.focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(buttons[2]).toHaveFocus()
  })

  it('uses vertical arrow keys when orientation is vertical', async () => {
    render(
      <ButtonGroup roving orientation="vertical" aria-label="Actions">
        <Buttons />
      </ButtonGroup>,
    )
    const [one, two] = screen.getAllByRole('button')
    one.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(two).toHaveFocus()
  })
})
