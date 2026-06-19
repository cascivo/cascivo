import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDraggable, type UseDraggableOptions } from './draggable'

function dispatch(target: EventTarget, type: string, x: number, y: number): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }))
  })
}

function setup(options: UseDraggableOptions = {}) {
  const handle = document.createElement('div')
  document.body.appendChild(handle)
  const view = renderHook(() => {
    const r = useDraggable(options)
    r.handleRef.current = handle
    return r
  })
  return { ...view, handle }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useDraggable', () => {
  it('tracks the pointer delta and toggles isDragging', () => {
    const onDragEnd = vi.fn()
    const { result, handle } = setup({ onDragEnd })
    expect(result.current.offset.value).toEqual({ x: 0, y: 0 })

    dispatch(handle, 'pointerdown', 10, 10)
    expect(result.current.isDragging.value).toBe(true)

    dispatch(window, 'pointermove', 40, 30)
    expect(result.current.offset.value).toEqual({ x: 30, y: 20 })

    dispatch(window, 'pointerup', 40, 30)
    expect(result.current.isDragging.value).toBe(false)
    expect(onDragEnd).toHaveBeenCalledWith({ x: 30, y: 20 })
  })

  it('constrains to a single axis', () => {
    const { result, handle } = setup({ axis: 'x' })
    dispatch(handle, 'pointerdown', 0, 0)
    dispatch(window, 'pointermove', 25, 50)
    expect(result.current.offset.value).toEqual({ x: 25, y: 0 })
  })

  it('reset() zeroes the offset', () => {
    const { result, handle } = setup()
    dispatch(handle, 'pointerdown', 0, 0)
    dispatch(window, 'pointermove', 15, 15)
    expect(result.current.offset.value).toEqual({ x: 15, y: 15 })
    act(() => result.current.reset())
    expect(result.current.offset.value).toEqual({ x: 0, y: 0 })
  })

  it('attaches no listeners when disabled', () => {
    const { result, handle } = setup({ isDisabled: true })
    dispatch(handle, 'pointerdown', 0, 0)
    dispatch(window, 'pointermove', 20, 20)
    expect(result.current.isDragging.value).toBe(false)
    expect(result.current.offset.value).toEqual({ x: 0, y: 0 })
  })
})
