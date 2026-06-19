import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Avatar } from '../avatar/avatar'
import { AvatarGroup } from './avatar-group'

function people(n: number) {
  return Array.from({ length: n }, (_, i) => (
    <Avatar key={i} fallback={String.fromCharCode(65 + i)} />
  ))
}

describe('AvatarGroup', () => {
  it('caps visible avatars and shows a +N overflow chip with an aria-label', () => {
    render(<AvatarGroup max={3}>{people(5)}</AvatarGroup>)
    // 3 visible + 1 overflow chip = 4 role="img" nodes
    expect(screen.getAllByRole('img')).toHaveLength(4)
    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '2 more' })).toBeInTheDocument()
  })

  it('uses total to override the displayed overflow count', () => {
    render(
      <AvatarGroup max={3} total={120}>
        {people(5)}
      </AvatarGroup>,
    )
    expect(screen.getByText('+117')).toBeInTheDocument()
  })

  it('renders no overflow chip when under the cap', () => {
    render(<AvatarGroup max={5}>{people(3)}</AvatarGroup>)
    expect(screen.getAllByRole('img')).toHaveLength(3)
    expect(screen.queryByText(/^\+/)).toBeNull()
  })

  it('reflects the spacing prop via data-spacing', () => {
    const { container } = render(<AvatarGroup spacing="lg">{people(2)}</AvatarGroup>)
    expect(container.querySelector('[data-spacing="lg"]')).toBeInTheDocument()
  })

  it('does not import banned React hooks', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const source = readFileSync(join(here, 'avatar-group.tsx'), 'utf8')
    expect(source).not.toMatch(/\buseState\b|\buseEffect\b|\buseContext\b|\buseReducer\b/)
  })
})
