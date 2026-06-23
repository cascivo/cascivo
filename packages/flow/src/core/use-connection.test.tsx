import { fireEvent, render } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FlowHandle } from '../flows/flow-handle/flow-handle.tsx'
import type { Connection } from '../engine/types.ts'
import { useConnection } from './use-connection.ts'

function Harness({
  onConnect,
  isValid,
}: {
  onConnect: (c: Connection) => void
  isValid?: (c: Connection) => boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useConnection({ containerRef: ref, clientToFlow: (x, y) => ({ x, y }), onConnect, isValid })
  return (
    <div ref={ref}>
      <div data-node-id="a">
        <FlowHandle type="source" id="s" />
      </div>
      <div data-node-id="b">
        <FlowHandle type="target" id="t" />
      </div>
    </div>
  )
}

describe('useConnection', () => {
  it('a source→target drag fires onConnect with the right ids', () => {
    const onConnect = vi.fn()
    const { container } = render(<Harness onConnect={onConnect} />)
    const source = container.querySelector('[data-handle-type="source"]') as HTMLElement
    const target = container.querySelector('[data-handle-type="target"]') as HTMLElement

    fireEvent.pointerDown(source, { clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 50, clientY: 0, pointerId: 1 })
    fireEvent.pointerUp(target, { clientX: 100, clientY: 0, pointerId: 1 })

    expect(onConnect).toHaveBeenCalledTimes(1)
    expect(onConnect).toHaveBeenCalledWith({
      source: 'a',
      target: 'b',
      sourceHandle: 's',
      targetHandle: 't',
    })
  })

  it('an invalid drop does not connect', () => {
    const onConnect = vi.fn()
    const { container } = render(<Harness onConnect={onConnect} isValid={() => false} />)
    const source = container.querySelector('[data-handle-type="source"]') as HTMLElement
    const target = container.querySelector('[data-handle-type="target"]') as HTMLElement
    fireEvent.pointerDown(source, { clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerUp(target, { clientX: 0, clientY: 0, pointerId: 1 })
    expect(onConnect).not.toHaveBeenCalled()
  })

  it('dropping on empty space does not connect', () => {
    const onConnect = vi.fn()
    const { container } = render(<Harness onConnect={onConnect} />)
    const source = container.querySelector('[data-handle-type="source"]') as HTMLElement
    fireEvent.pointerDown(source, { clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerUp(container, { clientX: 0, clientY: 0, pointerId: 1 })
    expect(onConnect).not.toHaveBeenCalled()
  })
})
