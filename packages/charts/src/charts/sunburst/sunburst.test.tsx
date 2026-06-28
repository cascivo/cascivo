import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sunburst } from './sunburst'

const data = {
  label: 'root',
  children: [
    {
      label: 'src',
      children: [
        { label: 'app', value: 40 },
        { label: 'lib', value: 25 },
      ],
    },
    { label: 'docs', value: 15 },
  ],
}

describe('Sunburst', () => {
  it('renders with an accessible title', () => {
    render(<Sunburst data={data} title="Disk" width={300} height={300} />)
    expect(screen.getByRole('img', { name: 'Disk' })).toBeTruthy()
  })
  it('renders an arc per non-root node', () => {
    const { container } = render(<Sunburst data={data} title="Disk" width={300} height={300} />)
    // src, app, lib, docs = 4 non-root nodes
    expect(container.querySelectorAll('path[data-depth]').length).toBe(4)
  })
  it('shows an empty placeholder for a valueless tree', () => {
    const { container } = render(
      <Sunburst data={{ label: 'root', children: [] }} title="E" width={300} height={300} />,
    )
    expect(container.querySelector('[data-empty]')).toBeTruthy()
  })
})
