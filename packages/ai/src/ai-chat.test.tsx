import { render, screen } from '@testing-library/react'
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
})
