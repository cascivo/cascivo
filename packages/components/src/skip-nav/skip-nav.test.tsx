import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SkipNavLink, SkipNavTarget } from './skip-nav'

describe('SkipNavLink', () => {
  it('renders a link to the default target with the default i18n label', () => {
    render(<SkipNavLink />)
    const link = screen.getByRole('link', { name: 'Skip to content' })
    expect(link).toHaveAttribute('href', '#cascade-skip-target')
  })

  it('links to a custom targetId', () => {
    render(<SkipNavLink targetId="main" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '#main')
  })

  it('overrides the label via the labels prop', () => {
    render(<SkipNavLink labels={{ label: 'Zum Inhalt springen' }} />)
    expect(screen.getByRole('link', { name: 'Zum Inhalt springen' })).toBeInTheDocument()
  })

  it('is reachable as the first tab stop', async () => {
    render(
      <>
        <SkipNavLink />
        <button type="button">After</button>
      </>,
    )
    await userEvent.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
  })

  it('merges className', () => {
    render(<SkipNavLink className="custom" />)
    expect(screen.getByRole('link')).toHaveClass('custom')
  })
})

describe('SkipNavTarget', () => {
  it('renders the default id and is programmatically focusable', () => {
    const { container } = render(<SkipNavTarget />)
    const target = container.querySelector('#cascade-skip-target')
    expect(target).toBeInTheDocument()
    expect(target).toHaveAttribute('tabindex', '-1')
  })

  it('accepts a custom id matching a custom link', () => {
    const { container } = render(
      <>
        <SkipNavLink targetId="main" />
        <SkipNavTarget id="main" />
      </>,
    )
    expect(container.querySelector('#main')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '#main')
  })
})
