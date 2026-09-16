import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import hl from './highlight.module.css'
import { Highlight } from './highlight.tsx'

describe('Highlight', () => {
  it('renders a <pre> with token spans for a js snippet', () => {
    const { container } = render(<Highlight language="javascript" value="const x = 1" />)
    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre!.textContent).toBe('const x = 1')
    // The keyword is its own span.
    const keyword = [...container.querySelectorAll('span')].find((s) => s.textContent === 'const')
    expect(keyword).toBeDefined()
  })

  it('renders the gutter when lineNumbers is set', () => {
    const { container } = render(<Highlight value={'a\nb\nc'} lineNumbers />)
    expect(container.querySelector(`.${hl['gutterBg']}`)).not.toBeNull()
    const numbers = [...container.querySelectorAll(`code > .${hl['num']}`)]
    expect(numbers.map((n) => n.textContent)).toEqual(['1', '2', '3'])
  })

  // The regression this structure exists for: a separate gutter column numbers its
  // rows one line box at a time, so one soft-wrapped line pushes every number below
  // it out of step with the code. Pairing each number with its own line as adjacent
  // cells of ONE grid row makes that impossible — jsdom has no layout, so what is
  // asserted here is the pairing the grid row depends on.
  it('pairs every line number with its own line, in order', () => {
    const { container } = render(<Highlight value={'a\nb\nc'} lineNumbers wrap />)
    const cells = [...(container.querySelector('code') as HTMLElement).children]
    expect(cells.map((c) => c.textContent)).toEqual(['1', 'a', '2', 'b', '3', 'c'])
    // Numbers are decorative: never announced, never copied with the code.
    expect(cells[0]!.getAttribute('aria-hidden')).toBe('true')
    expect(cells[1]!.getAttribute('aria-hidden')).toBeNull()
  })

  it('emits no gutter cells when lineNumbers is off', () => {
    const { container } = render(<Highlight value={'a\nb'} />)
    expect(container.querySelectorAll(`.${hl['num']}`)).toHaveLength(0)
    expect(container.querySelector(`.${hl['gutterBg']}`)).toBeNull()
  })

  it('keeps a row for blank lines', () => {
    const { container } = render(<Highlight value={'a\n\nb'} />)
    const code = container.querySelector('code')
    // three line rows (a, blank, b)
    expect(code!.children).toHaveLength(3)
    expect(code!.children[1]!.textContent).toBe('​')
  })

  it('threads cross-line fenced state via the range path (identical output)', () => {
    const value = ['# Title', '', '```ts', 'const x = 1', 'let y = 2', '```', 'after'].join('\n')
    const { container } = render(<Highlight language="markdown" value={value} />)
    // Inside the fence the whole line is a single `string`-kind span — identical to
    // the whole-document path (the range tokenizer threads the fence state in).
    const fenced = [...container.querySelectorAll('span')].find(
      (s) => s.className === hl['string'] && s.textContent === 'const x = 1',
    )
    expect(fenced).toBeDefined()
    // One row per source line (blank lines kept).
    expect(container.querySelector('code')!.children).toHaveLength(7)
  })

  it('exposes an aria-label when provided', () => {
    const { container } = render(<Highlight value="x" label="Example" />)
    expect(container.querySelector('[aria-label="Example"]')).not.toBeNull()
  })

  it('tags token spans with their kind class so themes have a stable hook', () => {
    const { container } = render(<Highlight language="javascript" value="const x = 1" />)
    const keyword = [...container.querySelectorAll('span')].find((s) => s.textContent === 'const')
    expect(keyword?.className).toBe(hl['keyword'])
  })
})
