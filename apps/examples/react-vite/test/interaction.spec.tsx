import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App'

// Signal writes must re-render the UI. Runs in the normal test pass and again in the React
// Compiler leg (vite.compiler.config.ts), where a component the compiler memoized away from
// its signals would leave these assertions reading stale text.
describe('App interactions', () => {
  it('re-renders when a click writes a signal', () => {
    render(<App />)
    expect(screen.getByText('Notifications are on.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /toggle notifications/i }))
    expect(screen.getByText('Notifications are off.')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /notifications/i })).not.toBeChecked()
  })

  it('re-renders when a component callback writes a signal', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('switch', { name: /notifications/i }))
    expect(screen.getByText('Notifications are off.')).toBeInTheDocument()
  })

  it('moves data-theme when a theme button is pressed', () => {
    const { container } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'dark' }))
    expect(container.querySelector('main')).toHaveAttribute('data-theme', 'dark')
  })
})
