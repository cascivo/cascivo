import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Indicator } from './indicator'

describe('Indicator', () => {
  it('renders children and overlay', () => {
    const { getByText } = render(
      <Indicator overlay={<span>3</span>}>
        <button>Bell</button>
      </Indicator>,
    )
    expect(getByText('Bell')).toBeInTheDocument()
    expect(getByText('3')).toBeInTheDocument()
  })

  it('defaults data-placement to "top-end"', () => {
    const { container } = render(
      <Indicator overlay={<span>1</span>}>
        <button>X</button>
      </Indicator>,
    )
    expect(container.firstElementChild).toHaveAttribute('data-placement', 'top-end')
  })

  it('sets data-placement when placement prop is provided', () => {
    const { container } = render(
      <Indicator overlay={<span>!</span>} placement="bottom-start">
        <button>X</button>
      </Indicator>,
    )
    expect(container.firstElementChild).toHaveAttribute('data-placement', 'bottom-start')
  })

  it('overlay div has aria-hidden', () => {
    const { container } = render(
      <Indicator overlay={<span>2</span>}>
        <button>X</button>
      </Indicator>,
    )
    const overlayDiv = container.querySelector('[aria-hidden]')
    expect(overlayDiv).toBeInTheDocument()
  })
})
