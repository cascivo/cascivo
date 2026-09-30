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
})
