import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { StoryClock } from '../../core/use-story.ts'
import type { FlowEdge, FlowNode } from '../../engine/types.ts'
import { FlowStory } from './flow-story.tsx'

const nodes: FlowNode[] = [
  { id: 'A', position: { x: 0, y: 0 }, data: { label: 'Client' } },
  { id: 'B', position: { x: 200, y: 0 }, data: { label: 'Gateway' } },
  { id: 'C', position: { x: 400, y: 0 }, data: { label: 'Service' } },
]
const edges: FlowEdge[] = [
  { id: 'ab', source: 'A', target: 'B' },
  { id: 'bc', source: 'B', target: 'C' },
]
const script = [
  { from: 'A', to: 'B', label: 'Request sent' },
  { from: 'B', to: 'A', label: 'Acknowledged' },
  { from: 'B', to: 'C', label: 'Forwarded' },
]

function fakeClock() {
  let pending: { id: number; cb: () => void }[] = []
  let id = 0
  const clock: StoryClock = {
    setTimeout: (cb) => {
      pending.push({ id: ++id, cb })
      return id
    },
    clearTimeout: (h) => {
      pending = pending.filter((p) => p.id !== h)
    },
  }
  return { clock, tick: () => pending.splice(0).forEach((p) => p.cb()) }
}

const activeEdge = (container: HTMLElement) =>
  container.querySelector('svg[data-active="true"]') as SVGElement | null

describe('FlowStory', () => {
  it('renders the graph and the first caption; highlights the first edge', () => {
    const { clock } = fakeClock()
    const { container, getByText } = render(
      <FlowStory nodes={nodes} edges={edges} script={script} clock={clock} />,
    )
    expect(getByText('Request sent')).toBeInTheDocument()
    const edge = activeEdge(container)!
    expect(edge.dataset['edgeId']).toBe('ab')
    expect(edge.dataset['direction']).toBe('forward')
  })

  it('ticking advances the active edge and swaps the caption (B→A is reverse)', () => {
    const { clock, tick } = fakeClock()
    const { container, getByText } = render(
      <FlowStory nodes={nodes} edges={edges} script={script} clock={clock} />,
    )
    act(() => tick())
    expect(getByText('Acknowledged')).toBeInTheDocument()
    const edge = activeEdge(container)!
    expect(edge.dataset['edgeId']).toBe('ab')
    expect(edge.dataset['direction']).toBe('reverse')
  })

  it('controls advance and pause the storyline', () => {
    const { clock } = fakeClock()
    const { getByLabelText, getByText } = render(
      <FlowStory nodes={nodes} edges={edges} script={script} clock={clock} autoPlay={false} />,
    )
    fireEvent.click(getByLabelText('Next step'))
    expect(getByText('Acknowledged')).toBeInTheDocument()
    // autoPlay is off → the play control is offered.
    expect(getByLabelText('Play')).toBeInTheDocument()
  })

  it('the caption region is aria-live', () => {
    const { clock } = fakeClock()
    const { container } = render(
      <FlowStory nodes={nodes} edges={edges} script={script} clock={clock} />,
    )
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull()
  })

  it('is a view by default — nodes are static and have no handles', () => {
    const { clock } = fakeClock()
    const { container } = render(
      <FlowStory nodes={nodes} edges={edges} script={script} clock={clock} />,
    )
    expect(container.querySelector('[data-flow-handle]')).toBeNull()
    expect(container.querySelector('[data-node-id="A"]')).toHaveAttribute('data-static', 'true')
  })
})
