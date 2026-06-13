import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Bullet } from './bullet'

describe('Bullet', () => {
  it('renders a figure with label', () => {
    render(<Bullet value={72} target={80} ranges={[40, 70, 100]} label="Revenue %" />)
    expect(screen.getByText('Revenue %')).toBeDefined()
  })

  it('renders an svg', () => {
    const { container } = render(
      <Bullet value={50} target={60} ranges={[30, 60, 100]} label="Score" />,
    )
    expect(container.querySelector('svg')).toBeDefined()
  })

  it('applies className', () => {
    const { container } = render(
      <Bullet value={50} target={60} ranges={[30, 60, 100]} label="Score" className="my-bullet" />,
    )
    expect(container.querySelector('.my-bullet')).toBeDefined()
  })

  it('renders aria-live region for tooltip', () => {
    render(<Bullet value={72} target={80} ranges={[40, 70, 100]} label="Revenue %" />)
    expect(document.querySelector('[aria-live="polite"]')).toBeTruthy()
  })
})
