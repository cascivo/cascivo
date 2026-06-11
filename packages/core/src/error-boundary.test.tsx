import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './error-boundary'

function Bomb({ throw: shouldThrow }: { throw: boolean }) {
  if (shouldThrow) throw new Error('Test error')
  return <div>Safe</div>
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary fallback={<div>Error</div>}><Bomb throw={false} /></ErrorBoundary>)
    expect(screen.getByText('Safe')).toBeInTheDocument()
  })

  it('renders fallback on error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary fallback={<div>Oops</div>}><Bomb throw={true} /></ErrorBoundary>)
    expect(screen.getByText('Oops')).toBeInTheDocument()
    spy.mockRestore()
  })

  it('supports render-prop fallback with reset', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary fallback={(_, reset) => <button onClick={reset}>Reset</button>}>
        <Bomb throw={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Reset')).toBeInTheDocument()
    spy.mockRestore()
  })
})
