import { cleanup, render } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computePosition, useAnchorPosition, type AnchorPlacement } from './anchor'
import { useSignals } from './signals'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('computePosition (JS fallback math)', () => {
  const anchor = { top: 100, left: 200, right: 260, bottom: 130, width: 60, height: 30 }
  const floating = { width: 100, height: 40 }

  it('places below-start at the anchor bottom-left', () => {
    expect(computePosition(anchor, floating, 'bottom-start')).toEqual({ top: 130, left: 200 })
  })
  it('places above-end with the floating element ending at the anchor right', () => {
    expect(computePosition(anchor, floating, 'top-end')).toEqual({ top: 60, left: 160 })
  })
  it('centers on the bottom by default', () => {
    expect(computePosition(anchor, floating, 'bottom')).toEqual({ top: 130, left: 180 })
  })
  it('places to the right-start', () => {
    expect(computePosition(anchor, floating, 'right')).toEqual({ top: 95, left: 260 })
  })
})

function Harness({ placement }: { placement: AnchorPlacement }) {
  useSignals()
  const anchorRef = createRef<HTMLButtonElement>()
  const floatingRef = createRef<HTMLDivElement>()
  const { anchorStyle, floatingStyle, cssAnchorSupported } = useAnchorPosition({
    anchorRef,
    floatingRef,
    placement,
  })
  return (
    <div data-css-supported={String(cssAnchorSupported)}>
      <button ref={anchorRef} type="button" style={anchorStyle} data-testid="anchor" />
      <div ref={floatingRef} style={floatingStyle} data-testid="floating" />
    </div>
  )
}

describe('useAnchorPosition', () => {
  it('uses the CSS anchor path when supported', () => {
    vi.stubGlobal('CSS', { supports: () => true })
    const { getByTestId } = render(<Harness placement="bottom-start" />)
    expect(getByTestId('anchor').style.anchorName).toBeTruthy()
    expect(getByTestId('floating').style.positionAnchor).toBeTruthy()
  })

  it('falls back to JS fixed positioning when CSS anchor is unsupported', () => {
    vi.stubGlobal('CSS', { supports: () => false })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 200,
      right: 260,
      bottom: 130,
      width: 60,
      height: 30,
      x: 200,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect)
    const { getByTestId } = render(<Harness placement="bottom-start" />)
    const floating = getByTestId('floating')
    expect(floating.style.position).toBe('fixed')
    // anchor and floating share the mocked rect; bottom-start → top=130, left=200
    expect(floating.style.top).toBe('130px')
    expect(floating.style.left).toBe('200px')
  })
})
