import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Toggletip } from './toggletip'

afterEach(cleanup)

// jsdom lacks CSS anchor positioning, so useAnchorPosition's fallback marks the freshly
// mounted bubble visibility:hidden until it computes a position. The element is fully present
// in the DOM, so role queries for the open bubble pass { hidden: true }.
describe('Toggletip', () => {
  it('renders the trigger and is closed by default', () => {
    const { getByRole, queryByRole } = render(
      <Toggletip trigger="info" labels={{ label: 'More info' }}>
        Helpful content
      </Toggletip>,
    )
    const trigger = getByRole('button', { name: 'More info' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(queryByRole('status', { hidden: true })).toBeNull()
  })

  it('opens on trigger click and shows the content', () => {
    const { getByRole } = render(
      <Toggletip trigger="info" labels={{ label: 'More info' }}>
        Helpful content
      </Toggletip>,
    )
    const trigger = getByRole('button', { name: 'More info' })
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const bubble = getByRole('status', { hidden: true })
    expect(bubble.textContent).toBe('Helpful content')
  })

  it('toggles closed on a second click', () => {
    const { getByRole, queryByRole } = render(
      <Toggletip trigger="info" labels={{ label: 'More info' }}>
        Helpful content
      </Toggletip>,
    )
    const trigger = getByRole('button', { name: 'More info' })
    fireEvent.click(trigger)
    expect(queryByRole('status', { hidden: true })).toBeTruthy()
    fireEvent.click(trigger)
    expect(queryByRole('status', { hidden: true })).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes on Escape', () => {
    const { getByRole, queryByRole } = render(
      <Toggletip trigger="info" labels={{ label: 'More info' }}>
        Helpful content
      </Toggletip>,
    )
    fireEvent.click(getByRole('button', { name: 'More info' }))
    expect(queryByRole('status', { hidden: true })).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(queryByRole('status', { hidden: true })).toBeNull()
  })

  it('respects defaultOpen', () => {
    const { getByRole } = render(
      <Toggletip trigger="info" labels={{ label: 'More info' }} defaultOpen>
        Helpful content
      </Toggletip>,
    )
    expect(getByRole('status', { hidden: true })).toBeTruthy()
    expect(getByRole('button', { name: 'More info' }).getAttribute('aria-expanded')).toBe('true')
  })

  it('supports controlled open with onOpenChange', () => {
    const onOpenChange = vi.fn()
    const { getByRole, queryByRole } = render(
      <Toggletip
        trigger="info"
        labels={{ label: 'More info' }}
        open={false}
        onOpenChange={onOpenChange}
      >
        Helpful content
      </Toggletip>,
    )
    // Controlled and closed: clicking requests open via callback but does not open locally.
    expect(queryByRole('status', { hidden: true })).toBeNull()
    fireEvent.click(getByRole('button', { name: 'More info' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(queryByRole('status', { hidden: true })).toBeNull()
  })
})
