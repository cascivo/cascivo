import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Grid, GridItem } from './grid'

describe('Grid', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Grid>
        <div>Cell</div>
      </Grid>,
    )
    expect(getByText('Cell')).toBeInTheDocument()
  })

  it('sets col count CSS var', () => {
    const { container } = render(<Grid cols={3} />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_grid-cols')).toBe('3')
  })

  it('sets gap CSS var', () => {
    const { container } = render(<Grid gap={6} />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_grid-gap')).toBe(
      'var(--cascivo-space-6)',
    )
  })

  it('wraps the grid in a containment element that carries the column vars', () => {
    const { container } = render(<Grid cols={3} />)
    const outer = container.firstChild as HTMLElement
    const grid = outer.firstChild as HTMLElement
    // Outer element establishes the query container and carries the vars.
    expect(outer.style.getPropertyValue('--_grid-cols')).toBe('3')
    // Inner grid is a distinct element (needed so its @container column rules can
    // resolve against the outer element).
    expect(grid).not.toBe(outer)
  })

  it('scalar cols does not enter responsive mode', () => {
    const { container } = render(<Grid cols={3} />)
    const grid = (container.firstChild as HTMLElement).firstChild as HTMLElement
    expect(grid.hasAttribute('data-responsive')).toBe(false)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_grid-cols-md')).toBe('')
  })

  it('sets align/justify CSS vars only when provided', () => {
    const plain = render(<Grid />).container.firstChild as HTMLElement
    expect(plain.style.getPropertyValue('--_grid-align')).toBe('')
    expect(plain.style.getPropertyValue('--_grid-justify')).toBe('')

    const aligned = render(<Grid align="center" justify="end" />).container
      .firstChild as HTMLElement
    expect(aligned.style.getPropertyValue('--_grid-align')).toBe('center')
    expect(aligned.style.getPropertyValue('--_grid-justify')).toBe('end')
  })

  it('responsive cols object sets per-tier vars and marks the grid responsive', () => {
    const { container } = render(<Grid cols={{ base: 1, md: 2, lg: 3 }} />)
    const outer = container.firstChild as HTMLElement
    const grid = outer.firstChild as HTMLElement
    // The responsive-mode flag lives on the inner grid (where the @container rules are).
    expect(grid.hasAttribute('data-responsive')).toBe(true)
    // Column vars live on the outer element and inherit into the grid.
    expect(outer.style.getPropertyValue('--_grid-cols')).toBe('1')
    expect(outer.style.getPropertyValue('--_grid-cols-md')).toBe('2')
    expect(outer.style.getPropertyValue('--_grid-cols-lg')).toBe('3')
    // Undeclared tiers are omitted so the CSS fallback chain applies.
    expect(outer.style.getPropertyValue('--_grid-cols-sm')).toBe('')
    expect(outer.style.getPropertyValue('--_grid-cols-xl')).toBe('')
  })
})

describe('GridItem', () => {
  it('sets span CSS var', () => {
    const { container } = render(<GridItem span={4} />)
    const el = container.firstChild as HTMLElement
    expect(el.style.getPropertyValue('--_span')).toBe('4')
    expect(el.hasAttribute('data-responsive')).toBe(false)
  })

  it('responsive span object sets per-tier vars', () => {
    const { container } = render(<GridItem span={{ base: 1, lg: 2 }} />)
    const el = container.firstChild as HTMLElement
    expect(el.hasAttribute('data-responsive')).toBe(true)
    expect(el.style.getPropertyValue('--_span')).toBe('1')
    expect(el.style.getPropertyValue('--_span-lg')).toBe('2')
  })
})
