import { describe, expect, it } from 'vitest'
import { snapshot } from './snapshot.ts'

function mount(html: string): HTMLElement {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.append(host)
  return host
}

const FORM = `
<form>
  <label for="n">Name</label><input id="n" value="Ada"/>
  <label>Plan<select><option value="f">Free</option><option value="p" selected>Pro</option></select></label>
  <input type="password" aria-label="Password" value="hunter2"/>
  <input aria-label="Card" data-agent-secret value="4242424242424242"/>
  <button data-agent-confirm>Delete account</button>
  <div data-agent-hidden><button>Invisible</button></div>
  <input type="checkbox" aria-label="Alerts" checked disabled/>
</form>`

describe('snapshot', () => {
  it('lists operable nodes with role, label, value and actions', () => {
    const { nodes, truncated } = snapshot(mount(FORM))
    expect(truncated).toBe(false)
    const by = (label: string) => nodes.find((n) => n.label === label)
    expect(by('Name')).toMatchObject({
      role: 'textbox',
      value: 'Ada',
      actions: ['setValue', 'clear'],
    })
    expect(by('Plan')).toMatchObject({
      role: 'combobox',
      value: 'p',
      actions: ['select'],
      options: [
        { value: 'f', label: 'Free' },
        { value: 'p', label: 'Pro' },
      ],
    })
    expect(by('Delete account')).toMatchObject({
      role: 'button',
      actions: ['press'],
      confirm: true,
    })
    expect(by('Alerts')).toMatchObject({ role: 'checkbox', checked: true, disabled: true })
  })

  it('never leaks a secret value and drops hidden subtrees', () => {
    const json = JSON.stringify(snapshot(mount(FORM)))
    expect(json).not.toContain('hunter2')
    expect(json).not.toContain('4242')
    expect(json).toContain('[redacted]')
    expect(json).not.toContain('Invisible')
  })

  it('keeps refs stable across calls and re-renders', () => {
    const host = mount(FORM)
    const a = snapshot(host).nodes.map((n) => n.ref)
    const b = snapshot(host).nodes.map((n) => n.ref)
    expect(b).toEqual(a)
    host.querySelector('input')?.setAttribute('value', 'Grace')
    expect(snapshot(host).nodes.map((n) => n.ref)).toEqual(a)
    expect(new Set(a).size).toBe(a.length)
  })

  it('maps dialog to close and listbox to select', () => {
    const { nodes } = snapshot(
      mount(
        '<div role="dialog" aria-label="Settings" aria-expanded="true"></div><ul role="listbox" aria-label="Fruit"><li role="option">Apple</li></ul>',
      ),
    )
    expect(nodes[0]).toMatchObject({ role: 'dialog', actions: ['close'], expanded: true })
    expect(nodes[1]).toMatchObject({
      role: 'listbox',
      actions: ['select'],
      options: [{ value: 'Apple', label: 'Apple' }],
    })
  })

  it('caps at 200 nodes and reports truncated', () => {
    const html = Array.from({ length: 250 }, (_, i) => `<button>B${i}</button>`).join('')
    const { nodes, truncated } = snapshot(mount(html))
    expect(nodes).toHaveLength(200)
    expect(truncated).toBe(true)
  })
})
