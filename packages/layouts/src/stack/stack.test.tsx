import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Stack } from './stack'

describe('Stack', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Stack>
        <div>Hello</div>
      </Stack>,
    )
    expect(getByText('Hello')).toBeInTheDocument()
  })

  it('defaults to vertical direction', () => {
    const { container } = render(<Stack />)
    expect(container.firstChild).toHaveAttribute('data-direction', 'vertical')
  })

  it('sets horizontal direction', () => {
    const { container } = render(<Stack direction="horizontal" />)
    expect(container.firstChild).toHaveAttribute('data-direction', 'horizontal')
  })

  it('sets gap CSS variable', () => {
    const { container } = render(<Stack gap={6} />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_stack-gap')).toBe(
      'var(--cascivo-space-6)',
    )
  })

  it('sets data-wrap when wrap=true', () => {
    const { container } = render(<Stack wrap />)
    expect(container.firstChild).toHaveAttribute('data-wrap', '')
  })

  it('omits data-wrap when wrap=false', () => {
    const { container } = render(<Stack />)
    expect(container.firstChild).not.toHaveAttribute('data-wrap')
  })

  it('forwards className', () => {
    const { container } = render(<Stack className="custom" />)
    expect(container.firstChild).toHaveClass('custom')
  })
})
