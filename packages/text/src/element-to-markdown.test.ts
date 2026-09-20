import { describe, expect, it } from 'vitest'
import { elementToMarkdown } from './element-to-markdown.ts'

function mount(html: string): HTMLElement {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.append(host)
  return host
}

describe('elementToMarkdown — live state, not markup state', () => {
  it('reads what was typed, not the value it was rendered with', () => {
    const host = mount('<input aria-label="Email" value="rendered@example.com"/>')
    const input = host.querySelector('input')
    if (input === null) throw new Error('no input')
    input.value = 'typed@example.com'
    expect(elementToMarkdown(host)).toBe('[input: Email = "typed@example.com"]')
  })

  it('reads a checkbox that was clicked', () => {
    const host = mount('<input type="checkbox" aria-label="Alerts"/>')
    const input = host.querySelector('input')
    if (input === null) throw new Error('no input')
    input.checked = true
    expect(elementToMarkdown(host)).toBe('[checkbox: Alerts = checked]')
  })

  it('reports an indeterminate checkbox as mixed', () => {
    const host = mount('<input type="checkbox" aria-label="All"/>')
    const input = host.querySelector('input')
    if (input === null) throw new Error('no input')
    input.indeterminate = true
    expect(elementToMarkdown(host)).toBe('[checkbox: All = mixed]')
  })

  it('reads the option someone selected', () => {
    const host = mount(
      '<select aria-label="Plan"><option value="a">Free</option><option value="b">Pro</option></select>',
    )
    const select = host.querySelector('select')
    if (select === null) throw new Error('no select')
    select.value = 'b'
    expect(elementToMarkdown(host)).toBe('[select: Plan = Pro]')
  })

  it('reads a disclosure that was opened', () => {
    const host = mount('<details><summary>Shipping</summary><p>Ships in 3 days.</p></details>')
    const details = host.querySelector('details')
    if (details === null) throw new Error('no details')
    details.open = true
    expect(elementToMarkdown(host)).toBe('Shipping [expanded]\n\nShips in 3 days.')
  })

  it('can prove a dialog closed, which the markup never can', () => {
    const host = mount('<dialog aria-label="Confirm"><p>Delete this?</p></dialog>')
    expect(elementToMarkdown(host)).toBe('[dialog: Confirm (closed)]\n\nDelete this?')
  })

  it('serializes the root element itself, ignoring its own hidden flags', () => {
    // <TextView> hides its source container with exactly these, and still reads it. The
    // flags mean "do not show this to a user"; the serializer IS the user here.
    const host = mount('<p>Body</p>')
    host.setAttribute('aria-hidden', 'true')
    host.setAttribute('inert', '')
    expect(elementToMarkdown(host)).toBe('Body')
  })

  it('still hides a subtree that a CHILD marks hidden', () => {
    const host = mount('<div aria-hidden="true"><p>gone</p></div><p>here</p>')
    expect(elementToMarkdown(host)).toBe('here')
  })
})
