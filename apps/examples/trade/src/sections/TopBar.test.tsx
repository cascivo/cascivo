import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ToastProvider } from '@cascivo/react'
import { TopBar } from './TopBar'
import { profileOpen } from '../store/ui'

beforeEach(() => {
  profileOpen.value = false
})

describe('TopBar profile panel', () => {
  it('opens the panel and sets --trade-panel-top from the avatar rect', () => {
    const { container } = render(
      <ToastProvider>
        <TopBar />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /profile menu/i }))
    expect(profileOpen.value).toBe(true)
    // The wrapper carries the measured top offset as a custom property.
    const wrapper = container.querySelector('[style*="--trade-panel-top"]')
    expect(wrapper).toBeTruthy()
    expect(wrapper!.getAttribute('style')).toMatch(/--trade-panel-top:\s*\d+px/)
  })

  it('does not give the panel content a fixed inline size (inline style)', () => {
    render(
      <ToastProvider>
        <TopBar />
      </ToastProvider>,
    )
    // The Net Worth value must be present (not clipped away).
    expect(screen.getAllByText(/Net Worth/i).length).toBeGreaterThan(0)
  })
})
