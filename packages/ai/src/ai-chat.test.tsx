import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AiChat } from './ai-chat'

const messages = [
  { id: '1', role: 'user' as const, content: 'Hello' },
  { id: '2', role: 'assistant' as const, content: 'Hi there!' },
]

describe('AiChat', () => {
  it('renders messages', () => {
    render(<AiChat messages={messages} onSend={() => {}} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })

  it('calls onSend on Enter', async () => {
    const onSend = vi.fn()
    render(<AiChat messages={[]} onSend={onSend} />)
    const textarea = screen.getByRole('textbox')
    await userEvent.type(textarea, 'test{Enter}')
    expect(onSend).toHaveBeenCalledWith('test')
  })

  function fakeLayout(log: HTMLElement, scrollHeight: number, clientHeight: number): void {
    Object.defineProperty(log, 'scrollHeight', { configurable: true, value: scrollHeight })
    Object.defineProperty(log, 'clientHeight', { configurable: true, value: clientHeight })
  }

  // Regression: the log never scrolled, so a streamed reply grew below the fold.
  it('follows new content while the reader is at the bottom', async () => {
    const { rerender } = render(<AiChat messages={messages} onSend={() => {}} />)
    const log = screen.getByRole('log')
    fakeLayout(log, 800, 200)
    rerender(
      <AiChat
        messages={[...messages, { id: '3', role: 'user', content: 'More' }]}
        onSend={() => {}}
      />,
    )
    await waitFor(() => expect(log.scrollTop).toBe(800))
  })

  it('leaves the position alone once the reader scrolls up', async () => {
    const { rerender } = render(<AiChat messages={messages} onSend={() => {}} />)
    const log = screen.getByRole('log')
    fakeLayout(log, 800, 200)
    log.scrollTop = 100
    fireEvent.scroll(log)
    rerender(
      <AiChat
        messages={[...messages, { id: '3', role: 'user', content: 'More' }]}
        onSend={() => {}}
      />,
    )
    await new Promise((r) => setTimeout(r, 0))
    expect(log.scrollTop).toBe(100)
  })

  it('is not a live region, so a streamed reply is never read out token by token', () => {
    render(<AiChat messages={messages} onSend={() => {}} isStreaming streamingText="Hel" />)
    expect(screen.getByRole('log')).toHaveAttribute('aria-live', 'off')
  })

  it('holds the reply slot with a typing indicator until the first token', () => {
    const { rerender } = render(<AiChat messages={messages} onSend={() => {}} isStreaming />)
    expect(screen.getByRole('status', { name: 'Assistant is typing' })).toBeInTheDocument()
    rerender(<AiChat messages={messages} onSend={() => {}} isStreaming streamingText="Hel" />)
    expect(screen.queryByRole('status', { name: 'Assistant is typing' })).toBeNull()
  })

  it('offers Stop while streaming when onStop is given', async () => {
    const onStop = vi.fn()
    const { rerender } = render(<AiChat messages={messages} onSend={() => {}} isStreaming />)
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()
    rerender(<AiChat messages={messages} onSend={() => {}} isStreaming onStop={onStop} />)
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it('announces the finished reply once streaming ends', async () => {
    const { rerender } = render(
      <AiChat messages={messages} onSend={() => {}} isStreaming streamingText="Sure" />,
    )
    rerender(
      <AiChat
        messages={[...messages, { id: '3', role: 'assistant', content: 'Sure, here it is.' }]}
        onSend={() => {}}
      />,
    )
    await waitFor(() =>
      expect(
        Array.from(document.querySelectorAll('[aria-live="polite"]')).some(
          (el) => el.textContent === 'Sure, here it is.',
        ),
      ).toBe(true),
    )
  })
})
