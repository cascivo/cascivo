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
})

describe('GridItem', () => {
  it('sets span CSS var', () => {
    const { container } = render(<GridItem span={4} />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_span')).toBe('4')
  })
})
