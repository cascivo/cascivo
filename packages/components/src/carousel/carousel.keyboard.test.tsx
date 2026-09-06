/**
 * Carousel had three tests, none of which touched the accessibility of the slides themselves.
 * The headline failure covered here: inactive slides carried `aria-hidden` while remaining in
 * the layout and in the tab order, so a keyboard user could tab into content that assistive
 * technology had been told did not exist.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Carousel } from './carousel'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function slidesFixture(): React.ReactNode[] {
  return [
    <a key="a" href="#one">
      Link one
    </a>,
    <a key="b" href="#two">
      Link two
    </a>,
    <a key="c" href="#three">
      Link three
    </a>,
  ]
}

describe('inactive slides', () => {
  it('are inert rather than aria-hidden', () => {
    render(<Carousel slides={slidesFixture()} />)
    const groups = screen
      .getAllByRole('group', { hidden: true })
      .filter((el) => el.getAttribute('aria-roledescription') === 'slide')
    // aria-hidden on a slide that is still focusable is the canonical aria-hidden-focus
    // violation; inert removes exposure and focusability together.
    expect(groups[0]).not.toHaveAttribute('inert')
    expect(groups[1]).toHaveAttribute('inert')
    expect(groups[0]).not.toHaveAttribute('aria-hidden')
    expect(groups[1]).not.toHaveAttribute('aria-hidden')
  })

  it('moves inertness with the active slide', async () => {
    const user = userEvent.setup()
    render(<Carousel slides={slidesFixture()} />)
    await user.click(screen.getByRole('button', { name: 'Next slide' }))
    const groups = screen
      .getAllByRole('group', { hidden: true })
      .filter((el) => el.getAttribute('aria-roledescription') === 'slide')
    expect(groups[0]).toHaveAttribute('inert')
    expect(groups[1]).not.toHaveAttribute('inert')
  })
})

describe('children handling', () => {
  it('does not collapse a mapped list into one slide', () => {
    const items = ['a', 'b', 'c']
    render(
      <Carousel>
        <div>Intro</div>
        {items.map((i) => (
          <div key={i}>{i}</div>
        ))}
      </Carousel>,
    )
    // `Array.isArray(children)` saw [<Intro/>, [...]] and made the whole mapped list one
    // slide; Children.toArray flattens it.
    const groups = screen
      .getAllByRole('group', { hidden: true })
      .filter((el) => el.getAttribute('aria-roledescription') === 'slide')
    expect(groups).toHaveLength(4)
  })

  it('renders nothing gracefully when empty', () => {
    render(<Carousel />)
    expect(screen.getByRole('region', { name: 'Carousel' })).toBeInTheDocument()
  })
})

describe('navigation', () => {
  it('wraps in both directions when looping', async () => {
    const user = userEvent.setup()
    const onIndexChange = vi.fn()
    render(<Carousel slides={slidesFixture()} loop onIndexChange={onIndexChange} />)
    await user.click(screen.getByRole('button', { name: 'Previous slide' }))
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
    await user.click(screen.getByRole('button', { name: 'Next slide' }))
    expect(onIndexChange).toHaveBeenLastCalledWith(0)
  })

  it('never disables the nav buttons when looping', () => {
    render(<Carousel slides={slidesFixture()} loop />)
    expect(screen.getByRole('button', { name: 'Previous slide' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next slide' })).not.toBeDisabled()
  })

  it('disables next on the last slide', () => {
    render(<Carousel slides={slidesFixture()} defaultIndex={2} />)
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled()
  })

  it('arrowing the dots changes the slide, not just the focus', async () => {
    const user = userEvent.setup()
    const onIndexChange = vi.fn()
    render(<Carousel slides={slidesFixture()} onIndexChange={onIndexChange} />)
    screen.getByRole('button', { name: 'Go to slide 1' }).focus()
    await user.keyboard('{ArrowRight}')
    // The manifest has always advertised arrow keys; they used to move only the roving
    // tabindex, leaving the displayed slide behind.
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
  })

  it('honours a controlled index', async () => {
    const user = userEvent.setup()
    render(<Carousel slides={slidesFixture()} index={1} onIndexChange={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Next slide' }))
    expect(screen.getByRole('button', { name: 'Go to slide 2' })).toHaveAttribute('aria-current')
  })

  it('names the dot group separately from the region', () => {
    render(<Carousel slides={slidesFixture()} />)
    // Both used to be called "Carousel".
    expect(screen.getByRole('group', { name: 'Choose slide to display' })).toBeInTheDocument()
  })
})

describe('autoplay', () => {
  it('is off by default, with no play control', () => {
    render(<Carousel slides={slidesFixture()} />)
    expect(screen.queryByRole('button', { name: /slide show/ })).toBeNull()
  })

  it('advances on its own and offers a pause control', async () => {
    vi.useFakeTimers()
    const onIndexChange = vi.fn()
    render(<Carousel slides={slidesFixture()} autoplay={1000} onIndexChange={onIndexChange} />)
    // APG requires a pause control for anything that rotates by itself.
    expect(screen.getByRole('button', { name: 'Stop automatic slide show' })).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(1000)
    expect(onIndexChange).toHaveBeenCalledWith(1)
  })

  it('stops when paused and resumes when played', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onIndexChange = vi.fn()
    render(<Carousel slides={slidesFixture()} autoplay={1000} onIndexChange={onIndexChange} />)
    await user.click(screen.getByRole('button', { name: 'Stop automatic slide show' }))
    onIndexChange.mockClear()
    await vi.advanceTimersByTimeAsync(3000)
    expect(onIndexChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Start automatic slide show' })).toBeInTheDocument()
  })

  it('keeps the track quiet while rotating and announces when it is not', async () => {
    vi.useFakeTimers()
    const { container } = render(<Carousel slides={slidesFixture()} autoplay={1000} />)
    const track = container.querySelector('[aria-live]')
    // An auto-advancing live region that speaks every second is unusable, so APG asks for
    // "off" while rotating and "polite" when the user is driving.
    expect(track).toHaveAttribute('aria-live', 'off')
  })

  it('announces politely when not rotating', () => {
    const { container } = render(<Carousel slides={slidesFixture()} />)
    expect(container.querySelector('[aria-live]')).toHaveAttribute('aria-live', 'polite')
  })
})

describe('slide labelling', () => {
  it('numbers each slide', () => {
    render(<Carousel slides={slidesFixture()} />)
    const first = screen
      .getAllByRole('group', { hidden: true })
      .find((el) => el.getAttribute('aria-roledescription') === 'slide')
    expect(first).toHaveAttribute('aria-label', '1 of 3')
  })

  it('keeps the active slide reachable', () => {
    render(<Carousel slides={slidesFixture()} />)
    const active = screen
      .getAllByRole('group', { hidden: true })
      .find((el) => el.getAttribute('aria-roledescription') === 'slide')!
    expect(within(active).getByRole('link', { name: 'Link one' })).toBeInTheDocument()
  })
})
