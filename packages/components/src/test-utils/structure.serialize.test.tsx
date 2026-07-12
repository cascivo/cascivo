import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { structuralTree } from './structure.ts'

describe('structuralTree serializer', () => {
  it('keeps role/aria-*/data-* and tag; drops class, style and text', () => {
    const { container } = render(
      <div role="group" className="x y" style={{ color: 'red' }} data-state="open">
        hello <span aria-hidden="true">icon</span>
      </div>,
    )
    const tree = structuralTree(container.firstElementChild!)
    expect(tree).toEqual({
      tag: 'div',
      attrs: { 'data-state': 'open', role: 'group' },
      children: [{ tag: 'span', attrs: { 'aria-hidden': 'true' } }],
    })
  })

  it('drops volatile id/for and normalizes aria id-references for stable snapshots', () => {
    const { container } = render(
      <input id=":r7:" aria-describedby=":r8:" aria-invalid="true" type="email" />,
    )
    const tree = structuralTree(container.firstElementChild!)
    // `id` is dropped entirely; aria-describedby keeps the wiring as `<id>`.
    expect(tree.attrs).toEqual({
      'aria-describedby': '<id>',
      'aria-invalid': 'true',
      type: 'email',
    })
  })
})
