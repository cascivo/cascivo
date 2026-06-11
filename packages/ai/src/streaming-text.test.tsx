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
})
