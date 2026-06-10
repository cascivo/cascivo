import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SettingsFormPage } from './settings-form-page'

describe('SettingsFormPage', () => {
  it('renders without crashing', () => {
    render(<SettingsFormPage />)
    expect(screen.getByText('Profile settings')).toBeInTheDocument()
  })
})
