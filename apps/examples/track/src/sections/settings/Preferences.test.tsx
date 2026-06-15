import { render, screen } from '@testing-library/react'
import { Preferences } from './Preferences'

it('renders General section', () => {
  render(<Preferences />)
  expect(screen.getByText(/general/i)).toBeInTheDocument()
})

it('renders display name input', () => {
  render(<Preferences />)
  expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
})

it('renders Light and Dark radio options', () => {
  render(<Preferences />)
  expect(screen.getByRole('radio', { name: /light/i })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: /dark/i })).toBeInTheDocument()
})
