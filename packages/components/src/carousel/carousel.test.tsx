import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Carousel } from './carousel'

afterEach(cleanup)

function setup() {
  render(
    <Carousel>
      <div>Slide one</div>
      <div>Slide two</div>
      <div>Slide three</div>
    </Carousel>,
  )
}

describe('Carousel', () => {
  it('renders a labelled carousel region with slide descriptions', () => {
    setup()
    const region = screen.getByRole('region', { name: 'Carousel' })
    expect(region).toHaveAttribute('aria-roledescription', 'carousel')
    const firstSlide = screen.getByText('Slide one').closest('[aria-roledescription="slide"]')
    expect(firstSlide).toHaveAttribute('aria-label', '1 of 3')
  })

  it('advances the active index when the next button is clicked', async () => {
    setup()
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Next slide' }))
    expect(screen.getByRole('button', { name: 'Go to slide 2' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('disables previous on the first slide', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled()
  })
})
