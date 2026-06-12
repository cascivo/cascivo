import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Prose } from './prose'

describe('Prose', () => {
  it('renders children inside a div wrapper', () => {
    render(
      <Prose>
        <h2>Title</h2>
        <p>Paragraph</p>
      </Prose>,
    )
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Title')
    expect(heading.parentElement?.tagName).toBe('DIV')
    expect(screen.getByText('Paragraph')).toBeInTheDocument()
  })

  it('renders raw HTML via dangerouslySetInnerHTML', () => {
    render(<Prose dangerouslySetInnerHTML={{ __html: '<p>From markdown</p>' }} />)
    expect(screen.getByText('From markdown')).toBeInTheDocument()
  })

  it('forwards arbitrary attributes and merges className', () => {
    render(
      <Prose className="custom" id="article">
        <p>Body</p>
      </Prose>,
    )
    const wrapper = screen.getByText('Body').parentElement
    expect(wrapper).toHaveClass('custom')
    expect(wrapper).toHaveAttribute('id', 'article')
  })
})
