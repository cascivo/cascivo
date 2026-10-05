import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiBadge } from './ai-badge'

describe('AiBadge', () => {
  it('renders a static marker with an accessible description', () => {
    const { container } = render(<AiBadge />)
    expect(container).toHaveTextContent('AI')
    expect(screen.getByText('AI-generated')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('becomes a button whose name starts with its visible text when it has an explanation', () => {
    render(<AiBadge>Generated from recent tickets.</AiBadge>)
    expect(screen.getByRole('button', { name: 'AI Show information' })).toHaveTextContent('AI')
  })

  it('opens the explanation on click', async () => {
    render(<AiBadge>Generated from recent tickets.</AiBadge>)
    expect(screen.queryByText('Generated from recent tickets.')).toBeNull()
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Generated from recent tickets.')).toBeInTheDocument()
  })

  it('localises through labels', () => {
    render(<AiBadge labels={{ text: 'KI', explain: 'Mehr erfahren' }}>Erklärung</AiBadge>)
    expect(screen.getByRole('button', { name: 'KI Mehr erfahren' })).toBeInTheDocument()
  })

  it('merges className', () => {
    const { container } = render(<AiBadge className="custom" />)
    expect(container.firstElementChild).toHaveClass('custom')
  })
})
