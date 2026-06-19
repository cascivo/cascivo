import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDisclosure } from './disclosure'

describe('useDisclosure', () => {
  it('defaults to closed and flips with open/close/toggle', () => {
    const { result } = renderHook(() => useDisclosure())
    expect(result.current.isOpen.value).toBe(false)

    act(() => result.current.open())
    expect(result.current.isOpen.value).toBe(true)

    act(() => result.current.close())
    expect(result.current.isOpen.value).toBe(false)

    act(() => result.current.toggle())
    expect(result.current.isOpen.value).toBe(true)
  })

  it('honors defaultOpen', () => {
    const { result } = renderHook(() => useDisclosure({ defaultOpen: true }))
    expect(result.current.isOpen.value).toBe(true)
  })

  it('is controlled when isOpen is provided and routes changes through onOpenChange', () => {
    const onOpenChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useDisclosure({ isOpen: open, onOpenChange }),
      { initialProps: { open: false } },
    )
    expect(result.current.isOpen.value).toBe(false)

    // Controlled: local request does not mutate, only notifies the parent.
    act(() => result.current.open())
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(result.current.isOpen.value).toBe(false)

    // Parent applies the new value.
    rerender({ open: true })
    expect(result.current.isOpen.value).toBe(true)
  })
})
