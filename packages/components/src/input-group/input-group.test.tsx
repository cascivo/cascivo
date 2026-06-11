import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InputGroup, ButtonGroup, InputGroupAddon } from './input-group'
import { Input } from '../input/input'
import { Button } from '../button/button'

describe('InputGroup', () => {
  it('renders children', () => {
    render(
      <InputGroup>
        <Input placeholder="Enter value" />
      </InputGroup>,
    )
    expect(screen.getByPlaceholderText('Enter value')).toBeTruthy()
  })

  it('renders prefix addon', () => {
    render(
      <InputGroup prefix="https://">
        <Input placeholder="domain.com" />
      </InputGroup>,
    )
    expect(screen.getByText('https://')).toBeTruthy()
  })

  it('renders suffix addon', () => {
    render(
      <InputGroup suffix=".com">
        <Input placeholder="Enter domain" />
      </InputGroup>,
    )
    expect(screen.getByText('.com')).toBeTruthy()
  })

  it('renders both prefix and suffix', () => {
    render(
      <InputGroup prefix="$" suffix="USD">
        <Input placeholder="0.00" />
      </InputGroup>,
    )
    expect(screen.getByText('$')).toBeTruthy()
    expect(screen.getByText('USD')).toBeTruthy()
  })

  it('sets data-has-prefix when prefix provided', () => {
    const { container } = render(
      <InputGroup prefix="@">
        <Input />
      </InputGroup>,
    )
    expect(container.querySelector('[data-has-prefix]')).toBeTruthy()
  })

  it('sets data-has-suffix when suffix provided', () => {
    const { container } = render(
      <InputGroup suffix="@example.com">
        <Input />
      </InputGroup>,
    )
    expect(container.querySelector('[data-has-suffix]')).toBeTruthy()
  })
})

describe('InputGroupAddon', () => {
  it('renders a leading addon inside the group', () => {
    render(
      <InputGroup>
        <InputGroupAddon>
          <svg data-testid="lead-icon" />
        </InputGroupAddon>
        <Input aria-label="Search" />
      </InputGroup>,
    )
    expect(screen.getByTestId('lead-icon')).toBeInTheDocument()
    const addon = screen.getByTestId('lead-icon').closest('[data-align]')
    expect(addon).toHaveAttribute('data-align', 'inline-start')
  })

  it('renders a trailing addon with align="inline-end"', () => {
    render(
      <InputGroup>
        <Input aria-label="Amount" />
        <InputGroupAddon align="inline-end">
          <span>kg</span>
        </InputGroupAddon>
      </InputGroup>,
    )
    expect(screen.getByText('kg').closest('[data-align]')).toHaveAttribute(
      'data-align',
      'inline-end',
    )
  })

  it('addon is decorative — hidden from AT by default', () => {
    render(
      <InputGroup>
        <InputGroupAddon>
          <svg />
        </InputGroupAddon>
        <Input aria-label="Search" />
      </InputGroup>,
    )
    const addon = document.querySelector('[data-align="inline-start"]')
    expect(addon).toHaveAttribute('aria-hidden', 'true')
  })

  it('boxed prefix prop still works alongside an addon', () => {
    render(
      <InputGroup prefix="https://">
        <InputGroupAddon>
          <svg data-testid="icon" />
        </InputGroupAddon>
        <Input aria-label="URL" />
      </InputGroup>,
    )
    expect(screen.getByText('https://')).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})

describe('ButtonGroup', () => {
  it('renders children', () => {
    render(
      <ButtonGroup>
        <Button>Left</Button>
        <Button>Right</Button>
      </ButtonGroup>,
    )
    expect(screen.getByText('Left')).toBeTruthy()
    expect(screen.getByText('Right')).toBeTruthy()
  })

  it('has role=group', () => {
    render(
      <ButtonGroup>
        <Button>A</Button>
        <Button>B</Button>
      </ButtonGroup>,
    )
    expect(screen.getByRole('group')).toBeTruthy()
  })
})
