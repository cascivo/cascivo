import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SettingsLayout } from './settings-layout'

describe('SettingsLayout', () => {
  it('renders menu', () => {
    render(
      <SettingsLayout menu={<nav>Menu</nav>}>
        <div>Content</div>
      </SettingsLayout>,
    )
    expect(screen.getByText('Menu')).toBeInTheDocument()
  })

  it('renders content', () => {
    render(
      <SettingsLayout menu={<nav>M</nav>}>
        <div>Settings content</div>
      </SettingsLayout>,
    )
    expect(screen.getByText('Settings content')).toBeInTheDocument()
  })

  it('forwards className', () => {
    const { container } = render(
      <SettingsLayout menu={<nav>M</nav>} className="custom">
        <div>C</div>
      </SettingsLayout>,
    )
    expect(container.firstChild).toHaveClass('custom')
  })
})
