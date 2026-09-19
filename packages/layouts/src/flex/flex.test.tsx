import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Flex, FlexItem } from './flex'

describe('Flex', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Flex>
        <div>Hello</div>
      </Flex>,
    )
    expect(getByText('Hello')).toBeInTheDocument()
  })

  it('defaults to vertical direction', () => {
    const { container } = render(<Flex />)
    expect(container.firstChild).toHaveAttribute('data-direction', 'vertical')
  })

  it('sets horizontal direction', () => {
    const { container } = render(<Flex direction="horizontal" />)
    expect(container.firstChild).toHaveAttribute('data-direction', 'horizontal')
  })

  it('sets gap CSS variable', () => {
    const { container } = render(<Flex gap={6} />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_flex-gap')).toBe(
      'var(--cascivo-space-6)',
    )
  })

  it('sets data-wrap when wrap=true', () => {
    const { container } = render(<Flex wrap />)
    expect(container.firstChild).toHaveAttribute('data-wrap', '')
  })

  it('omits data-wrap when wrap=false', () => {
    const { container } = render(<Flex />)
    expect(container.firstChild).not.toHaveAttribute('data-wrap')
  })

  it('forwards className', () => {
    const { container } = render(<Flex className="custom" />)
    expect(container.firstChild).toHaveClass('custom')
  })
})

describe('FlexItem (2026-08-31 report §24)', () => {
  it('maps each size onto a main-axis behaviour', () => {
    const { container } = render(
      <Flex direction="horizontal">
        <FlexItem size="fixed">a</FlexItem>
        <FlexItem size="grow">b</FlexItem>
        <FlexItem size="shrink">c</FlexItem>
        <FlexItem>d</FlexItem>
      </Flex>,
    )
    const sizes = [...container.querySelectorAll('[data-size]')].map((el) =>
      el.getAttribute('data-size'),
    )
    expect(sizes).toEqual(['fixed', 'grow', 'shrink', 'auto'])
  })

  it('passes basis through as flex-basis', () => {
    const { container } = render(<FlexItem basis="0" size="grow" />)
    expect((container.firstElementChild as HTMLElement).style.flexBasis).toBe('0px')
  })

  it('flags truncate so the item can shrink below its content width', () => {
    const { container } = render(<FlexItem truncate>a-very-long-unbreakable-url</FlexItem>)
    expect(container.firstElementChild).toHaveAttribute('data-truncate')
  })

  it('does not flag truncate by default', () => {
    const { container } = render(<FlexItem>a</FlexItem>)
    expect(container.firstElementChild).not.toHaveAttribute('data-truncate')
  })
})
