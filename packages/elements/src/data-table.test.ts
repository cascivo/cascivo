import axe from 'axe-core'
import { Idiomorph } from 'idiomorph'
import { beforeAll, describe, expect, it } from 'vitest'
import { define } from './data-table.ts'

const rows = [
  ['r1', 'Bob', '30'],
  ['r2', 'alice', '4'],
  ['r3', 'Cy', '200'],
]
const html = (attrs = '', btnAttrs = '') => `<cv-data-table id="demo"${attrs}>
<div class="cv-data-table-batchBar"><span class="cv-data-table-batchCount"></span></div>
<table><thead><tr>
<th><input type="checkbox" aria-label="Select all"></th>
<th scope="col" aria-sort="none" data-key="name"><button type="button"${btnAttrs}>Name</button></th>
<th scope="col" aria-sort="none" data-key="age"><button type="button">Age</button></th>
</tr></thead><tbody>${rows
  .map(
    ([id, n, a]) =>
      `<tr id="${id}"><td><input type="checkbox" value="${id}" aria-label="Select ${n}"></td><td>${n}</td><td>${a}</td></tr>`,
  )
  .join('')}</tbody></table></cv-data-table>`

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const root = () => document.getElementById('demo') as HTMLElement
const names = () => [...document.querySelectorAll('tbody tr')].map((r) => r.id)
const btn = (i: number) => document.querySelectorAll<HTMLElement>('th button')[i]!
const sortOf = (i: number) =>
  document.querySelectorAll('th[aria-sort]')[i]!.getAttribute('aria-sort')
const box = (id: string) => document.querySelector<HTMLInputElement>(`#${id} input`)!
const all = () => document.querySelector<HTMLInputElement>('thead input')!
const toggle = (cb: HTMLInputElement) => {
  cb.checked = !cb.checked
  cb.dispatchEvent(new Event('change', { bubbles: true }))
}

async function mount(attrs = '', btnAttrs = '') {
  document.body.innerHTML = html(attrs, btnAttrs)
  await tick()
}

// jsdom has no CSS.escape, which idiomorph uses when it moves keyed (id) rows.
beforeAll(() => {
  ;(globalThis as { CSS?: unknown }).CSS ??= { escape: (v: string) => v }
  define()
})

describe('cv-data-table sort', () => {
  it('cycles none, ascending, descending, none and fires cv-sort', async () => {
    await mount()
    const seen: unknown[] = []
    root().addEventListener('cv-sort', (e) => seen.push((e as CustomEvent).detail))
    for (let i = 0; i < 3; i++) {
      btn(0).click()
      await tick()
    }
    expect(seen).toEqual([
      { key: 'name', direction: 'asc' },
      { key: 'name', direction: 'desc' },
      { key: 'name', direction: 'none' },
    ])
    expect(sortOf(0)).toBe('none')
  })

  it('sorts rows client-side (text, then numeric) and restores the server order', async () => {
    await mount()
    btn(0).click()
    await tick()
    expect(names()).toEqual(['r2', 'r1', 'r3'])
    expect(sortOf(0)).toBe('ascending')
    expect(btn(0).dataset['state']).toBe('ascending')
    btn(1).click()
    await tick()
    expect(sortOf(0)).toBe('none')
    expect(names()).toEqual(['r2', 'r1', 'r3'])
    btn(1).click()
    await tick()
    expect(names()).toEqual(['r3', 'r1', 'r2'])
    btn(1).click()
    await tick()
    expect(names()).toEqual(['r1', 'r2', 'r3'])
  })

  it('leaves row order to the server with hx attributes or `remote`, still firing cv-sort', async () => {
    for (const [attrs, bt] of [
      ['', ' hx-get="/rows"'],
      [' remote', ''],
    ] as const) {
      await mount(attrs, bt)
      let n = 0
      root().addEventListener('cv-sort', () => n++)
      btn(0).click()
      await tick()
      expect(n).toBe(1)
      expect(names()).toEqual(['r1', 'r2', 'r3'])
      expect(sortOf(0)).toBe('ascending')
    }
  })

  it('keeps its sort state through an idiomorph morph', async () => {
    await mount()
    btn(0).click()
    await tick()
    Idiomorph.morph(root(), html(), { morphStyle: 'outerHTML' })
    await tick()
    expect(sortOf(0)).toBe('ascending')
  })

  it('adopts the server aria-sort before any interaction', async () => {
    document.body.innerHTML = html().replace(
      'aria-sort="none" data-key="age"',
      'aria-sort="descending" data-key="age"',
    )
    await tick()
    expect(sortOf(1)).toBe('descending')
  })
})

describe('cv-data-table selection', () => {
  it('selects rows, shows the count and fires cv-selection-change', async () => {
    await mount()
    const seen: unknown[] = []
    root().addEventListener('cv-selection-change', (e) => seen.push((e as CustomEvent).detail))
    toggle(box('r1'))
    toggle(box('r3'))
    await tick()
    expect(seen.at(-1)).toEqual({ selected: ['r1', 'r3'] })
    expect(document.querySelector('.cv-data-table-batchCount')!.textContent).toBe('2 selected')
    expect(document.getElementById('r1')!.dataset['state']).toBe('selected')
    expect(all().indeterminate).toBe(true)
    expect(all().checked).toBe(false)
  })

  it('select-all is tri-state and toggles every row', async () => {
    await mount()
    toggle(all())
    await tick()
    expect(rows.every(([id]) => box(id!).checked)).toBe(true)
    expect(all().checked).toBe(true)
    expect(all().indeterminate).toBe(false)
    toggle(box('r2'))
    await tick()
    expect(all().indeterminate).toBe(true)
    toggle(all())
    toggle(all())
    await tick()
    expect(box('r2').checked).toBe(false)
    expect(document.querySelector('.cv-data-table-batchCount')!.textContent).toBe('0 selected')
  })

  it('adopts server-checked rows and a custom count label', async () => {
    document.body.innerHTML = html(' count-label="{count} chosen"').replace(
      'value="r2"',
      'value="r2" checked',
    )
    await tick()
    expect(box('r2').checked).toBe(true)
    expect(document.querySelector('.cv-data-table-batchCount')!.textContent).toBe('1 chosen')
  })

  it('survives a morph that resets the checkboxes', async () => {
    await mount()
    toggle(box('r1'))
    await tick()
    Idiomorph.morph(root(), html(), { morphStyle: 'outerHTML' })
    await tick()
    expect(box('r1').checked).toBe(true)
    expect(all().indeterminate).toBe(true)
  })

  it('is axe clean', async () => {
    await mount()
    const r = await axe.run(document.body, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(r.violations.map((v) => v.id)).toEqual([])
  })
})
