import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SettingsProfile } from './settings-profile'

describe('SettingsProfile', () => {
  it('renders Personal info section', () => {
    render(<SettingsProfile />)
    expect(screen.getByRole('heading', { name: /personal info/i })).toBeInTheDocument()
  })

  it('renders name, email, and bio fields', () => {
    render(<SettingsProfile />)
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument()
  })

  it('renders Preferences section with three toggles', () => {
    render(<SettingsProfile />)
    expect(screen.getByRole('heading', { name: /preferences/i })).toBeInTheDocument()
    expect(screen.getAllByRole('switch')).toHaveLength(3)
  })

  it('renders Save Changes and Cancel buttons', () => {
    render(<SettingsProfile />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })
})
