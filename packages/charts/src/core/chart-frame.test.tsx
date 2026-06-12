import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChartFrame } from './chart-frame'

describe('ChartFrame', () => {
  it('renders svg with role="img"', () => {
    render(
      <ChartFrame title="Test chart" height={200}>
        {() => null}
      </ChartFrame>,
    )
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('sets aria-label from title', () => {
    render(
      <ChartFrame title="Revenue chart" height={200}>
        {() => null}
      </ChartFrame>,
    )
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Revenue chart')
  })

  it('renders desc element for description', () => {
    render(
      <ChartFrame title="T" description="Monthly revenue" height={200}>
        {() => null}
      </ChartFrame>,
    )
    expect(screen.getByText('Monthly revenue')).toBeInTheDocument()
  })

  it('emits data-plain attribute when plain is true', () => {
    const { container } = render(
      <ChartFrame title="T" height={200} plain>
        {() => null}
      </ChartFrame>,
    )
    expect((container.firstChild as HTMLElement).hasAttribute('data-plain')).toBe(true)
  })

  it('does not emit data-plain when plain is absent', () => {
    const { container } = render(
      <ChartFrame title="T" height={200}>
        {() => null}
      </ChartFrame>,
    )
    expect((container.firstChild as HTMLElement).hasAttribute('data-plain')).toBe(false)
  })

  it('renders fallback content', () => {
    render(
      <ChartFrame
        title="T"
        height={200}
        fallback={
          <table>
            <tbody>
              <tr>
                <td>Data</td>
              </tr>
            </tbody>
          </table>
        }
      >
        {() => null}
      </ChartFrame>,
    )
    expect(screen.getByText('Data')).toBeInTheDocument()
  })
})
