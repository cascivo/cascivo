/**
 * Focus, bounds and announcement.
 *
 * The headline failure these cover: keyboard navigation only ever moved a roving `tabIndex`.
 * Real DOM focus stayed on the previously-focused button, and the moment an arrow crossed a
 * month boundary that button unmounted and focus fell to `<body>` — the user was ejected
 * from the widget mid-navigation. Every "keeps focus" test here fails against that build.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Calendar } from './calendar'

afterEach(cleanup)

const utc = (y: number, m: number, d: number): Date => new Date(Date.UTC(y, m, d))

/** The button carrying DOM focus, by its accessible name. */
function focusedName(): string | null {
  return document.activeElement?.getAttribute('aria-label') ?? null
}

describe('focus follows the cursor', () => {
  it('moves real focus with an arrow key', async () => {
    const user = userEvent.setup()
    render(<Calendar defaultValue={utc(2026, 2, 18)} locale="en-GB" />)
    const start = screen.getByRole('button', { name: /18 March 2026/ })
    start.focus()
    await user.keyboard('{ArrowRight}')
    expect(focusedName()).toMatch(/19 March 2026/)
  })

  it('keeps focus inside the widget across a month boundary', async () => {
    const user = userEvent.setup()
    render(<Calendar defaultValue={utc(2026, 2, 31)} locale="en-GB" />)
    screen.getByRole('button', { name: /31 March 2026/ }).focus()
    await user.keyboard('{ArrowRight}')
    // The old build left focus on an unmounted node, so activeElement became <body>.
    expect(document.activeElement).not.toBe(document.body)
    expect(focusedName()).toMatch(/1 April 2026/)
  })

  it('keeps focus when paging by month', async () => {
    const user = userEvent.setup()
    render(<Calendar defaultValue={utc(2026, 2, 18)} locale="en-GB" />)
    screen.getByRole('button', { name: /18 March 2026/ }).focus()
    await user.keyboard('{PageDown}')
    expect(focusedName()).toMatch(/18 April 2026/)
    await user.keyboard('{PageUp}')
    expect(focusedName()).toMatch(/18 March 2026/)
  })

  it('Shift+PageUp/PageDown moves a year', async () => {
    const user = userEvent.setup()
    render(<Calendar defaultValue={utc(2026, 2, 18)} locale="en-GB" />)
    screen.getByRole('button', { name: /18 March 2026/ }).focus()
    await user.keyboard('{Shift>}{PageDown}{/Shift}')
    expect(focusedName()).toMatch(/18 March 2027/)
  })

  it('Home and End reach the ends of the week', async () => {
    const user = userEvent.setup()
    render(<Calendar defaultValue={utc(2026, 2, 18)} locale="en-GB" />)
    screen.getByRole('button', { name: /18 March 2026/ }).focus()
    await user.keyboard('{Home}')
    expect(focusedName()).toMatch(/16 March 2026/)
    await user.keyboard('{End}')
    expect(focusedName()).toMatch(/22 March 2026/)
  })

  it('ArrowUp and ArrowDown move a week', async () => {
    const user = userEvent.setup()
    render(<Calendar defaultValue={utc(2026, 2, 18)} locale="en-GB" />)
    screen.getByRole('button', { name: /18 March 2026/ }).focus()
    await user.keyboard('{ArrowDown}')
    expect(focusedName()).toMatch(/25 March 2026/)
    await user.keyboard('{ArrowUp}')
    expect(focusedName()).toMatch(/18 March 2026/)
  })

  it('keeps exactly one day in the tab order', () => {
    render(<Calendar defaultValue={utc(2026, 2, 18)} locale="en-GB" />)
    const tabbable = screen.getAllByRole('button').filter((b) => b.getAttribute('tabindex') === '0')
    expect(tabbable).toHaveLength(1)
  })
})

describe('bounds', () => {
  it('refuses to arrow past min or max', async () => {
    const user = userEvent.setup()
    render(
      <Calendar
        defaultValue={utc(2026, 2, 10)}
        min={utc(2026, 2, 10)}
        max={utc(2026, 2, 20)}
        locale="en-GB"
      />,
    )
    screen.getByRole('button', { name: /10 March 2026/ }).focus()
    await user.keyboard('{ArrowLeft}')
    // The old build was unbounded, so this walked into a month where every day was disabled.
    expect(focusedName()).toMatch(/10 March 2026/)
  })

  it('skips a disabled day rather than landing on it', async () => {
    const user = userEvent.setup()
    render(
      <Calendar
        defaultValue={utc(2026, 2, 18)}
        disabled={(d) => d.getUTCDate() === 19}
        locale="en-GB"
      />,
    )
    screen.getByRole('button', { name: /18 March 2026/ }).focus()
    await user.keyboard('{ArrowRight}')
    expect(focusedName()).toMatch(/20 March 2026/)
  })

  it('disables the nav buttons at the bounds', () => {
    render(
      <Calendar
        defaultValue={utc(2026, 2, 10)}
        min={utc(2026, 2, 1)}
        max={utc(2026, 2, 31)}
        locale="en-GB"
      />,
    )
    // The old build let you page to 2085 where every day was aria-disabled.
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled()
  })

  it('refuses to select a disabled day', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Calendar
        defaultValue={utc(2026, 2, 18)}
        disabled={(d) => d.getUTCDate() === 19}
        onValueChange={onValueChange}
        locale="en-GB"
      />,
    )
    await user.click(screen.getByRole('button', { name: /19 March 2026/ }))
    expect(onValueChange).not.toHaveBeenCalled()
  })
})

describe('selection', () => {
  it('selects with Enter and with Space', async () => {
    for (const key of ['{Enter}', '{ }']) {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(
        <Calendar defaultValue={utc(2026, 2, 18)} onValueChange={onValueChange} locale="en-GB" />,
      )
      screen.getByRole('button', { name: /18 March 2026/ }).focus()
      await user.keyboard(key)
      expect(onValueChange, key).toHaveBeenCalled()
      cleanup()
    }
  })

  it('marks the selected day on the focusable element', () => {
    render(<Calendar value={utc(2026, 2, 18)} onValueChange={() => {}} locale="en-GB" />)
    // aria-selected used to sit on the <td> while focus landed on the inner button, so the
    // selected state was never announced.
    expect(screen.getByRole('button', { name: /18 March 2026/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('omits aria-selected on the other days rather than saying false thirty times', () => {
    render(<Calendar value={utc(2026, 2, 18)} onValueChange={() => {}} locale="en-GB" />)
    expect(screen.getByRole('button', { name: /17 March 2026/ })).not.toHaveAttribute(
      'aria-selected',
    )
  })

  it('follows a changed controlled value into view', () => {
    const { rerender } = render(
      <Calendar value={utc(2026, 5, 15)} onValueChange={() => {}} locale="en-GB" />,
    )
    expect(screen.getByRole('grid', { name: /June 2026/ })).toBeInTheDocument()
    rerender(<Calendar value={utc(2026, 8, 3)} onValueChange={() => {}} locale="en-GB" />)
    // The old build seeded the view once at mount, so the selection went off-screen.
    expect(screen.getByRole('grid', { name: /September 2026/ })).toBeInTheDocument()
  })

  it('continues arrowing from where the user clicked', async () => {
    const user = userEvent.setup()
    render(<Calendar defaultValue={utc(2026, 2, 18)} locale="en-GB" />)
    await user.click(screen.getByRole('button', { name: /25 March 2026/ }))
    await user.keyboard('{ArrowRight}')
    expect(focusedName()).toMatch(/26 March 2026/)
  })
})

describe('today', () => {
  it('marks today from the local calendar', () => {
    const now = new Date()
    const label = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())))
    render(<Calendar locale="en-GB" />)
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-current', 'date')
  })

  it('offers a Today button that jumps the view and takes focus', async () => {
    const user = userEvent.setup()
    render(<Calendar defaultValue={utc(2020, 0, 15)} showToday locale="en-GB" />)
    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(document.activeElement).toHaveAttribute('aria-current', 'date')
  })

  it('hides the Today button by default', () => {
    render(<Calendar locale="en-GB" />)
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull()
  })
})

describe('announcement and structure', () => {
  it('announces the month without rewriting the grid name', async () => {
    const user = userEvent.setup()
    render(<Calendar defaultValue={utc(2026, 2, 18)} locale="en-GB" />)
    const live = screen
      .getAllByRole('status', { hidden: true })
      .find((el) => el.getAttribute('aria-live') === 'polite')
    expect(live).toHaveTextContent('March 2026')
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(live).toHaveTextContent('April 2026')
    // The visible label is no longer itself a live region — announcing there would have
    // mutated the accessible name of the grid the user's focus sits inside.
    const visible = screen.getAllByText('April 2026').find((el) => el !== live)
    expect(visible).toBeDefined()
    expect(visible).not.toHaveAttribute('aria-live')
  })

  it('takes an explicit grid name', () => {
    render(<Calendar defaultValue={utc(2026, 2, 18)} ariaLabel="Departure date" />)
    expect(screen.getByRole('grid', { name: 'Departure date' })).toBeInTheDocument()
  })

  it('renders week numbers on request', () => {
    render(<Calendar defaultValue={utc(2026, 2, 18)} showWeekNumbers locale="en-GB" />)
    const rowHeaders = screen.getAllByRole('rowheader')
    expect(rowHeaders.length).toBeGreaterThan(0)
    expect(rowHeaders[0]).toHaveTextContent(/^\d+$/)
  })

  it('hides the nav when asked', () => {
    render(<Calendar defaultValue={utc(2026, 2, 18)} hideNav />)
    expect(screen.queryByRole('button', { name: 'Previous month' })).toBeNull()
  })

  it('reports view changes to a controlled parent', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(<Calendar month={2} year={2026} onViewChange={onViewChange} locale="en-GB" />)
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(onViewChange).toHaveBeenCalledWith({ month: 3, year: 2026 })
    // Controlled: the parent ignored it, so the view stays put.
    expect(screen.getByRole('grid', { name: /March 2026/ })).toBeInTheDocument()
  })

  it('reports day hover', async () => {
    const user = userEvent.setup()
    const onDayHover = vi.fn()
    render(<Calendar defaultValue={utc(2026, 2, 18)} onDayHover={onDayHover} locale="en-GB" />)
    await user.hover(screen.getByRole('button', { name: /19 March 2026/ }))
    expect(onDayHover).toHaveBeenCalled()
  })

  it('applies the range styling hooks', () => {
    render(
      <Calendar
        defaultValue={utc(2026, 2, 18)}
        isInRange={(d) => d.getUTCDate() === 19}
        isRangeStart={(d) => d.getUTCDate() === 18}
        isRangeEnd={(d) => d.getUTCDate() === 20}
        locale="en-GB"
      />,
    )
    expect(screen.getByRole('button', { name: /19 March 2026/ })).toHaveAttribute('data-in-range')
    expect(screen.getByRole('button', { name: /18 March 2026/ })).toHaveAttribute(
      'data-range-start',
    )
    expect(screen.getByRole('button', { name: /20 March 2026/ })).toHaveAttribute('data-range-end')
  })
})
