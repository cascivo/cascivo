import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Columns } from './columns'

describe('Columns', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Columns>
        <div>Child</div>
      </Columns>,
    )
    expect(getByText('Child')).toBeInTheDocument()
  })

  it('sets count CSS var', () => {
    const { container } = render(<Columns count={3} />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_cols')).toBe('3')
  })

  it('sets gap CSS var', () => {
    const { container } = render(<Columns gap={6} />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_gap')).toBe(
      'var(--cascivo-space-6)',
    )
  })

  it('forwards className', () => {
    const { container } = render(<Columns className="custom" />)
    expect((container.firstChild as HTMLElement).classList.contains('custom')).toBe(true)
  })
})
