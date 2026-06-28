import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Toolbox } from './toolbox'
import { LineChart } from '../charts/line-chart/line-chart'

describe('Toolbox', () => {
  it('renders four labelled buttons by default and they are keyboard-reachable', () => {
    const noop = () => {}
    const { getByText } = render(
      <Toolbox
        options={{}}
        onPng={noop}
        onSvg={noop}
        onToggleData={noop}
        onRestore={noop}
        showData={false}
      />,
    )
    for (const label of ['Export PNG', 'Export SVG', 'Data view', 'Restore']) {
      const btn = getByText(label)
      expect(btn.tagName).toBe('BUTTON')
    }
  })

  it('invokes the restore callback on click', () => {
    const onRestore = vi.fn()
    const { getByText } = render(
      <Toolbox
        options={{ restore: true }}
        onPng={() => {}}
        onSvg={() => {}}
        onToggleData={() => {}}
        onRestore={onRestore}
        showData={false}
      />,
    )
    fireEvent.click(getByText('Restore'))
    expect(onRestore).toHaveBeenCalledOnce()
  })
})

describe('LineChart toolbox integration', () => {
  const series = [
    {
      id: 'a',
      label: 'A',
      data: [
        { x: 0, y: 1 },
        { x: 1, y: 4 },
      ],
    },
  ]

  it('renders the toolbox and toggles a visible data-view table', () => {
    const { getByText, container } = render(
      <LineChart
        series={series}
        x={(d) => d.x}
        y={(d) => d.y}
        title="T"
        width={400}
        height={300}
        toolbox
      />,
    )
    expect(getByText('Export PNG')).toBeTruthy()
    // No visible data view until toggled.
    expect(container.querySelector('[data-data-view]')).toBeNull()
    fireEvent.click(getByText('Data view'))
    expect(container.querySelector('[data-data-view]')).toBeTruthy()
  })
})
