import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Flex } from './flex'

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
