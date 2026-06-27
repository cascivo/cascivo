import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Text, wrapText } from './text'

describe('wrapText', () => {
  it('returns a single line when no width is given', () => {
    expect(wrapText('a b c d', 0, 12)).toEqual(['a b c d'])
  })
  it('wraps a long string into multiple lines under the width', () => {
    // fallback estimate ≈ chars * 12 * 0.55 ≈ 6.6px/char; width 40 → ~6 chars/line
    const lines = wrapText('one two three four', 40, 12)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.join(' ')).toBe('one two three four')
  })
  it('never drops content', () => {
    const lines = wrapText('supercalifragilistic expialidocious', 30, 12)
    expect(lines.join(' ')).toContain('supercalifragilistic')
  })
})

describe('Text', () => {
  it('renders a single tspan unwrapped', () => {
    const { container } = render(
      <svg>
        <Text x={5} y={10}>
          Hello
        </Text>
      </svg>,
    )
    expect(container.querySelectorAll('tspan').length).toBe(1)
    expect(container.querySelector('text')?.getAttribute('x')).toBe('5')
  })
  it('renders multiple tspans when wrapped', () => {
    const { container } = render(
      <svg>
        <Text x={0} y={0} width={30} fontSize={12}>
          one two three four five
        </Text>
      </svg>,
    )
    expect(container.querySelectorAll('tspan').length).toBeGreaterThan(1)
  })
})
