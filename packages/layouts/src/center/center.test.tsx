import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Center } from './center'

describe('Center', () => {
  it('renders children', () => {
    const { getByText } = render(<Center><p>Content</p></Center>)
    expect(getByText('Content')).toBeInTheDocument()
  })

  it('sets max CSS var', () => {
    const { container } = render(<Center maxWidth="60rem" />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_center-max')).toBe('60rem')
  })

  it('forwards className', () => {
    const { container } = render(<Center className="custom" />)
    expect((container.firstChild as HTMLElement).classList.contains('custom')).toBe(true)
  })
})
