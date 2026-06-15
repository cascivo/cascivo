import { render, screen } from '@testing-library/react'
import { Settings } from './Settings'

it('renders Preferences and Workspace tabs', () => {
  render(<Settings />)
  expect(screen.getByRole('tab', { name: /preferences/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /workspace/i })).toBeInTheDocument()
})

it('defaults to Preferences tab', () => {
  render(<Settings />)
  expect(screen.getByRole('tab', { name: /preferences/i })).toHaveAttribute('aria-selected', 'true')
})
