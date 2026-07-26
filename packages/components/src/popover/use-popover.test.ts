import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePopover } from './use-popover'

describe('usePopover', () => {
  it('starts closed', () => {
    const { result } = renderHook(() => usePopover())
    expect(result.current.isOpen.value).toBe(false)
  })

  it('open/close/toggle update isOpen', () => {
    const { result } = renderHook(() => usePopover())
    act(() => result.current.open())
    expect(result.current.isOpen.value).toBe(true)
    act(() => result.current.close())
    expect(result.current.isOpen.value).toBe(false)
    act(() => result.current.toggle())
    expect(result.current.isOpen.value).toBe(true)
  })

  it('controlled open prop drives isOpen', () => {
    const { result, rerender } = renderHook(
      ({ open }: { open?: boolean }) => usePopover({ open }),
      { initialProps: { open: false } },
    )
    expect(result.current.isOpen.value).toBe(false)
    rerender({ open: true })
    expect(result.current.isOpen.value).toBe(true)
  })

  it('supportsAnchor fallback path exists (CSS.supports check)', () => {
    // In jsdom, CSS.supports returns false for anchor-name, exercising the fallback path
    const supported = typeof CSS !== 'undefined' && CSS.supports('anchor-name: --cascivo-a')
    // The hook should work regardless of whether anchor positioning is supported
    const { result } = renderHook(() => usePopover())
    expect(result.current.isOpen.value).toBe(false)
    expect(typeof supported).toBe('boolean')
  })
})

describe('usePopover — SSR-stable anchor names (regression: module-level counter)', () => {
  it('renders the same anchor name on every server render in one process', async () => {
    const { renderToString } = await import('react-dom/server')
    const { createElement } = await import('react')
    function Probe() {
      const { anchorName } = usePopover()
      return createElement('span', { 'data-anchor': anchorName })
    }
    const nameOf = (html: string) => /data-anchor="([^"]*)"/.exec(html)?.[1]
    const first = nameOf(renderToString(createElement(Probe)))
    const second = nameOf(renderToString(createElement(Probe)))
    expect(first).toMatch(/^--cascivo-popover-/)
    expect(second).toBe(first)
  })

  it('gives two instances in one tree distinct anchor names', async () => {
    const { renderToString } = await import('react-dom/server')
    const { createElement, Fragment } = await import('react')
    function Probe() {
      const { anchorName } = usePopover()
      return createElement('span', { 'data-anchor': anchorName })
    }
    const html = renderToString(
      createElement(Fragment, null, createElement(Probe), createElement(Probe)),
    )
    const names = [...html.matchAll(/data-anchor="([^"]*)"/g)].map((m) => m[1])
    expect(names).toHaveLength(2)
    expect(new Set(names).size).toBe(2)
  })
})
