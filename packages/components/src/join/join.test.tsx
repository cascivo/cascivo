import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Join } from './join'

describe('Join', () => {
  it('renders a div with data-orientation="horizontal" by default', () => {
    const { container } = render(
      <Join>
        <button>A</button>
      </Join>,
    )
    const div = container.firstElementChild
    expect(div?.tagName).toBe('DIV')
    expect(div).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('sets data-orientation="vertical" when specified', () => {
    const { container } = render(
      <Join orientation="vertical">
        <button>A</button>
      </Join>,
    )
    expect(container.firstElementChild).toHaveAttribute('data-orientation', 'vertical')
  })

  it('renders children', () => {
    const { getByText } = render(
      <Join>
        <button>Foo</button>
        <button>Bar</button>
      </Join>,
    )
    expect(getByText('Foo')).toBeInTheDocument()
    expect(getByText('Bar')).toBeInTheDocument()
  })

  it('passes className through', () => {
    const { container } = render(
      <Join className="custom">
        <button>A</button>
      </Join>,
    )
    expect(container.firstElementChild).toHaveClass('custom')
  })
})
