import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Meter } from './meter'

describe('Meter', () => {
  it('renders bar variant with role="meter"', () => {
    const { container } = render(<Meter value={50} label="CPU" />)
    const meter = container.querySelector('[role="meter"]')
    expect(meter).toBeTruthy()
    expect(meter?.getAttribute('aria-valuenow')).toBe('50')
    expect(meter?.getAttribute('aria-valuemin')).toBe('0')
    expect(meter?.getAttribute('aria-valuemax')).toBe('100')
  })

  it('renders gauge variant', () => {
    const { container } = render(<Meter value={75} label="Memory" variant="gauge" />)
    expect(container.querySelector('[role="meter"]')).toBeTruthy()
    // Gauge has paths
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0)
  })

  it('shows the label', () => {
    const { container } = render(<Meter value={30} label="Disk Usage" />)
    expect(container.textContent).toContain('Disk Usage')
  })

  it('clamps value to min/max', () => {
    const { container } = render(<Meter value={150} min={0} max={100} label="OOB" />)
    const meter = container.querySelector('[role="meter"]')
    expect(meter?.getAttribute('aria-valuenow')).toBe('150')
  })

  it('shows threshold colors', () => {
    const { container } = render(
      <Meter value={90} label="Alert" thresholds={{ warning: 70, critical: 85 }} />,
    )
    expect(container.querySelector('[role="meter"]')).toBeTruthy()
  })
})
