import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MediaMasonry } from './media-masonry'

describe('MediaMasonry', () => {
  it('renders children', () => {
    const { getByText } = render(
      <MediaMasonry>
        <div>Tile 1</div>
        <div>Tile 2</div>
      </MediaMasonry>,
    )
    expect(getByText('Tile 1')).toBeInTheDocument()
    expect(getByText('Tile 2')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    const { getByText } = render(
      <MediaMasonry title="Gallery">
        <div>Tile</div>
      </MediaMasonry>,
    )
    expect(getByText('Gallery')).toBeInTheDocument()
  })

  it('renders h2 by default for section title', () => {
    const { container } = render(
      <MediaMasonry title="Gallery">
        <div>Tile</div>
      </MediaMasonry>,
    )
    expect(container.querySelector('h2')).not.toBeNull()
  })

  it('does not render header when title and description are absent', () => {
    const { container } = render(
      <MediaMasonry>
        <div>Tile</div>
      </MediaMasonry>,
    )
    expect(container.querySelector('h2')).toBeNull()
  })
})
