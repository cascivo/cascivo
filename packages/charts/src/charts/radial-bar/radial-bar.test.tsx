import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RadialBar } from './radial-bar'

const data = [
  { id: 'rev', label: 'Revenue', value: 84 },
  { id: 'nps', label: 'NPS', value: 61 },
  { id: 'ret', label: 'Retention', value: 72 },
]

describe('RadialBar', () => {
  it('renders with an accessible title', () => {
    render(<RadialBar data={data} title="Goals" width={300} height={300} />)
    expect(screen.getByRole('img', { name: 'Goals' })).toBeTruthy()
  })

  it('renders a track + value arc per ring', () => {
    const { container } = render(<RadialBar data={data} title="Goals" width={300} height={300} />)
    // 2 paths per ring (track + value) when every value > 0
    expect(container.querySelectorAll('path[d]').length).toBe(data.length * 2)
  })

  it('renders a center label', () => {
    const { container } = render(
      <RadialBar
        data={data}
        title="Goals"
        width={300}
        height={300}
        centerValue="72%"
        centerLabel="On track"
      />,
    )
    const center = container.querySelector('[data-center]')!
    expect(center.textContent).toContain('72%')
    expect(center.textContent).toContain('On track')
  })

  it('renders the fallback table', () => {
    const { container } = render(<RadialBar data={data} title="Goals" width={300} height={300} />)
    expect(container.querySelector('table')).toBeTruthy()
  })

  it('shows an empty placeholder with no data', () => {
    const { container } = render(<RadialBar data={[]} title="Goals" width={300} height={300} />)
    expect(container.querySelector('[data-empty]')).toBeTruthy()
  })
})
