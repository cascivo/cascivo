import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DismissableLayer } from './dismissable-layer'

afterEach(cleanup)

describe('DismissableLayer', () => {
  it('dismisses on an outside pointer press', () => {
    const onDismiss = vi.fn()
    render(
      <DismissableLayer onDismiss={onDismiss}>
        <button type="button">inside</button>
      </DismissableLayer>,
    )
    fireEvent.pointerDown(document.body)
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('does not dismiss on an inside pointer press', () => {
    const onDismiss = vi.fn()
    const { getByText } = render(
      <DismissableLayer onDismiss={onDismiss}>
        <button type="button">inside</button>
      </DismissableLayer>,
    )
    fireEvent.pointerDown(getByText('inside'))
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismisses on Escape', () => {
    const onDismiss = vi.fn()
    render(
      <DismissableLayer onDismiss={onDismiss}>
        <span>x</span>
      </DismissableLayer>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('only the top-most nested layer dismisses on Escape', () => {
    const outer = vi.fn()
    const inner = vi.fn()
    render(
      <DismissableLayer onDismiss={outer}>
        <DismissableLayer onDismiss={inner}>
          <span>x</span>
        </DismissableLayer>
      </DismissableLayer>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(inner).toHaveBeenCalledOnce()
    expect(outer).not.toHaveBeenCalled()
  })

  it('respects escapeDismisses=false', () => {
    const onDismiss = vi.fn()
    render(
      <DismissableLayer onDismiss={onDismiss} escapeDismisses={false}>
        <span>x</span>
      </DismissableLayer>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
