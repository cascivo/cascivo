import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatBubble } from './chat-bubble'

describe('ChatBubble', () => {
  it('renders children in body', () => {
    render(<ChatBubble>Hello world</ChatBubble>)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('side="start" sets data-side="start"', () => {
    const { container } = render(<ChatBubble side="start">msg</ChatBubble>)
    expect(container.firstChild).toHaveAttribute('data-side', 'start')
  })

  it('side="end" sets data-side="end"', () => {
    const { container } = render(<ChatBubble side="end">msg</ChatBubble>)
    expect(container.firstChild).toHaveAttribute('data-side', 'end')
  })

  it('renders name in meta section', () => {
    render(<ChatBubble name="Alice">msg</ChatBubble>)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders time as a <time> element', () => {
    render(<ChatBubble time="10:42 AM">msg</ChatBubble>)
    const timeEl = screen.getByText('10:42 AM')
    expect(timeEl.tagName.toLowerCase()).toBe('time')
  })

  it('renders avatar when provided', () => {
    const { container } = render(
      <ChatBubble avatar={<img src="/avatar.png" alt="" />}>msg</ChatBubble>,
    )
    // The avatar slot is aria-hidden; query DOM directly
    expect(container.querySelector('[aria-hidden="true"] img')).toBeInTheDocument()
  })

  it('does not render avatar container when avatar is omitted', () => {
    const { container } = render(<ChatBubble>msg</ChatBubble>)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
  })

  it('does not render meta section when neither name nor time provided', () => {
    const { container } = render(<ChatBubble>msg</ChatBubble>)
    // No name or time elements should appear
    expect(container.querySelector('time')).toBeNull()
  })
})
