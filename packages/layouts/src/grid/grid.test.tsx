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

  it('scalar cols does not enter responsive mode', () => {
    const { container } = render(<Grid cols={3} />)
    const el = container.firstChild as HTMLElement
    expect(el.hasAttribute('data-responsive')).toBe(false)
    expect(el.style.getPropertyValue('--_grid-cols-md')).toBe('')
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

  it('responsive cols object sets per-tier vars and marks the element responsive', () => {
    const { container } = render(<Grid cols={{ base: 1, md: 2, lg: 3 }} />)
    const el = container.firstChild as HTMLElement
    expect(el.hasAttribute('data-responsive')).toBe(true)
    expect(el.style.getPropertyValue('--_grid-cols')).toBe('1')
    expect(el.style.getPropertyValue('--_grid-cols-md')).toBe('2')
    expect(el.style.getPropertyValue('--_grid-cols-lg')).toBe('3')
    // Undeclared tiers are omitted so the CSS fallback chain applies.
    expect(el.style.getPropertyValue('--_grid-cols-sm')).toBe('')
    expect(el.style.getPropertyValue('--_grid-cols-xl')).toBe('')
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
