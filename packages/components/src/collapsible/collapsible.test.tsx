import { afterEach, describe, it, expect } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToStaticMarkup } from 'react-dom/server'
import { Collapsible } from './collapsible'

afterEach(cleanup)

/**
 * `<summary>` is not exposed as `role="button"` by jsdom and carries no `aria-expanded`
 * attribute — the expanded state is native. Assertions read `details.open` instead.
 */
function details(): HTMLDetailsElement {
  const el = screen.getByText('Toggle').closest('details')
  if (!el) throw new Error('no <details> ancestor')
  return el as HTMLDetailsElement
}

describe('Collapsible', () => {
  it('renders the trigger and content', () => {
    render(<Collapsible trigger="Toggle">Body</Collapsible>)
    expect(screen.getByText('Toggle')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it('is closed by default', () => {
    render(<Collapsible trigger="Toggle">Body</Collapsible>)
    expect(details().open).toBe(false)
  })

  it('toggles open and closed on click', async () => {
    render(<Collapsible trigger="Toggle">Body</Collapsible>)
    await userEvent.click(screen.getByText('Toggle'))
    expect(details().open).toBe(true)
    await userEvent.click(screen.getByText('Toggle'))
    expect(details().open).toBe(false)
  })

  it('respects defaultOpen', () => {
    render(
      <Collapsible defaultOpen trigger="Toggle">
        Body
      </Collapsible>,
    )
    expect(details().open).toBe(true)
  })

  it('links trigger and region via aria attributes', () => {
    render(<Collapsible trigger="Toggle">Body</Collapsible>)
    const trigger = screen.getByText('Toggle')
    const region = screen.getByRole('region')
    expect(trigger.getAttribute('aria-controls')).toBe(region.getAttribute('id'))
    expect(region.getAttribute('aria-labelledby')).toBe(trigger.getAttribute('id'))
  })

  it('does not toggle when disabled', async () => {
    render(
      <Collapsible disabled trigger="Toggle">
        Body
      </Collapsible>,
    )
    await userEvent.click(screen.getByText('Toggle'))
    expect(details().open).toBe(false)
    expect(screen.getByText('Toggle')).toHaveAttribute('aria-disabled', 'true')
  })

  it('calls onOpenChange once per toggle', async () => {
    const seen: boolean[] = []
    render(
      <Collapsible trigger="Toggle" onOpenChange={(o) => seen.push(o)}>
        Body
      </Collapsible>,
    )
    await userEvent.click(screen.getByText('Toggle'))
    await userEvent.click(screen.getByText('Toggle'))
    expect(seen).toEqual([true, false])
  })

  it('renders its content server-side, with no JavaScript', () => {
    const html = renderToStaticMarkup(
      <Collapsible defaultOpen trigger="Toggle">
        Body
      </Collapsible>,
    )
    expect(html).toContain('<details')
    expect(html).toContain('open')
    expect(html).toContain('Body')
  })

  it('survives a second toggle while controlled', async () => {
    // The parent pins `open`, so the disclosure must return to open after every toggle.
    render(
      <Collapsible open trigger="Toggle" onOpenChange={() => {}}>
        Body
      </Collapsible>,
    )
    await userEvent.click(screen.getByText('Toggle'))
    expect(details().open).toBe(true)
    await userEvent.click(screen.getByText('Toggle'))
    expect(details().open).toBe(true)
  })
})

describe('Collapsible — APG disclosure conformance (manifest-backed)', () => {
  /**
   * The manifest claims role `button` + keys Enter/Space. Those now come from the platform:
   * `<summary>`'s implicit ARIA role is `button` per HTML-AAM, and the HTML spec defines
   * Enter/Space activation for it.
   *
   * jsdom implements neither — it does not map the role and does not activate `<summary>`
   * on keydown (verified) — so these assert the structural contract that earns the
   * behaviour instead of simulating it. Real-browser keyboard verification belongs in the
   * Playwright suite; see docs/plans/details-disclosure-plan.md §3.3.
   */
  it('builds the disclosure on native <details>/<summary>', () => {
    render(<Collapsible trigger="Details">Body</Collapsible>)
    const trigger = screen.getByText('Details')
    expect(trigger.tagName).toBe('SUMMARY')
    expect(trigger.parentElement?.tagName).toBe('DETAILS')
    // `<summary>` must be the first child or the browser synthesises its own.
    expect(trigger.parentElement?.firstElementChild).toBe(trigger)
  })

  it('points the trigger at a labelled region', () => {
    render(<Collapsible trigger="Details">Body</Collapsible>)
    const controls = screen.getByText('Details').getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    expect(document.getElementById(controls!)).toHaveAttribute('role', 'region')
  })

  it('does not re-declare the native role or expanded state', () => {
    render(<Collapsible trigger="Details">Body</Collapsible>)
    const trigger = screen.getByText('Details')
    expect(trigger.getAttribute('role')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBeNull()
  })
})
