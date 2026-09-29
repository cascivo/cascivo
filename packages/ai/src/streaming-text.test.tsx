import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StreamingText } from './streaming-text'

describe('StreamingText', () => {
  it('eventually displays the full text', async () => {
    render(<StreamingText text="Hello" speed={10} />)
    await waitFor(() => expect(screen.getByText(/Hello/)).toBeInTheDocument(), { timeout: 2000 })
  })

  it('calls onComplete when done', async () => {
    const onComplete = vi.fn()
    render(<StreamingText text="Hi" speed={10} onComplete={onComplete} />)
    await waitFor(() => expect(onComplete).toHaveBeenCalled(), { timeout: 2000 })
  })

  // Regression: the effect read `text` from a closure, so once it caught up with the first
  // chunk it never re-ran — a reply streamed into AiChat froze at its first token.
  it('keeps revealing text as the prop grows during a stream', async () => {
    const { rerender } = render(<StreamingText text="Hel" speed={10} />)
    await waitFor(() => expect(screen.getByText('Hel')).toBeInTheDocument(), { timeout: 2000 })
    rerender(<StreamingText text="Hello, world" speed={10} />)
    await waitFor(() => expect(screen.getByText('Hello, world')).toBeInTheDocument(), {
      timeout: 2000,
    })
  })
})
