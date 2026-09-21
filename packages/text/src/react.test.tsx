import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextView } from './react.tsx'

describe('TextView', () => {
  it('renders the document instead of the UI', async () => {
    render(
      <TextView>
        <h1>Billing</h1>
        <button type="button">Save</button>
      </TextView>,
    )
    await waitFor(() => {
      expect(screen.getByText(/# Billing/)).toBeDefined()
    })
    expect(screen.getByText(/\[button: Save\]/)).toBeDefined()
  })

  it('does not expose the source UI to a user or to assistive technology', () => {
    const { container } = render(
      <TextView>
        <button type="button">Save</button>
      </TextView>,
    )
    const source = container.querySelector('div[aria-hidden="true"]')
    expect(source).not.toBeNull()
    expect(source?.hasAttribute('inert')).toBe(true)
    expect((source as HTMLElement).style.display).toBe('none')
    // One tree, not two: the button exists once, inside the hidden source.
    expect(container.querySelectorAll('button')).toHaveLength(1)
  })

  it('follows what someone types', async () => {
    const { container } = render(
      <TextView>
        <input aria-label="Email" defaultValue="" />
      </TextView>,
    )
    const input = container.querySelector('input')
    if (input === null) throw new Error('no input')
    fireEvent.input(input, { target: { value: 'ada@example.com' } })
    await waitFor(() => {
      expect(container.querySelector('pre')?.textContent).toBe('[input: Email = "ada@example.com"]')
    })
  })

  it('follows a structural change', async () => {
    function Probe({ extra }: { extra: boolean }) {
      return (
        <TextView>
          <p>One</p>
          {extra ? <p>Two</p> : null}
        </TextView>
      )
    }
    const { container, rerender } = render(<Probe extra={false} />)
    await waitFor(() => {
      expect(container.querySelector('pre')?.textContent).toBe('One')
    })
    rerender(<Probe extra />)
    await waitFor(() => {
      expect(container.querySelector('pre')?.textContent).toBe('One\n\nTwo')
    })
  })

  it('honours options', async () => {
    const { container } = render(
      <TextView options={{ annotate: false }}>
        <input aria-label="Email" defaultValue="x" />
        <p>Body</p>
      </TextView>,
    )
    await waitFor(() => {
      expect(container.querySelector('pre')?.textContent).toBe('Body')
    })
  })
})
