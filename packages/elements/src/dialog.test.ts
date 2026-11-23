import axe from 'axe-core'
import { Idiomorph } from 'idiomorph'
import { beforeAll, describe, expect, it } from 'vitest'
import { define } from './dialog.ts'

const html = (attrs = '') => `<main><button id="go" type="button" data-cv-dialog-open="dlg">Open</button>
<cv-dialog id="dlg"${attrs}><dialog class="cv-modal-dialog" aria-labelledby="dlg-t" data-size="md">
<div class="cv-modal-panel"><div class="cv-modal-header"><h2 class="cv-modal-title" id="dlg-t">Title</h2>
<button type="button" class="cv-modal-close" data-cv-dialog-close aria-label="Close modal">×</button></div>
<div class="cv-modal-body"><button id="inner" type="button">Inner</button></div></div></dialog></cv-dialog></main>`

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const dlg = () => document.getElementById('dlg') as HTMLElement & { open: boolean }
const inner = () => document.querySelector('dialog') as HTMLDialogElement
const mount = async (attrs = '') => {
  document.body.innerHTML = html(attrs)
  await tick()
}
beforeAll(define)

describe('cv-dialog', () => {
  it('starts closed and opens from a data-cv-dialog-open control', async () => {
    await mount()
    expect(dlg().open).toBe(false)
    expect(inner().hasAttribute('open')).toBe(false)
    ;(document.getElementById('go') as HTMLElement).click()
    await tick()
    expect(dlg().open).toBe(true)
    expect(inner().hasAttribute('open')).toBe(true)
    expect(dlg().hasAttribute('open')).toBe(true)
  })

  it('opens from the server `open` attribute', async () => {
    await mount(' open')
    expect(dlg().open).toBe(true)
    expect(inner().getAttribute('data-state')).toBe('open')
  })

  it('closes from the close control, returns focus to the opener, fires events', async () => {
    await mount()
    const seen: string[] = []
    for (const t of ['cv-open', 'cv-close']) dlg().addEventListener(t, () => seen.push(t))
    const go = document.getElementById('go') as HTMLElement
    go.focus()
    go.click()
    await tick()
    ;(document.querySelector('[data-cv-dialog-close]') as HTMLElement).click()
    await tick()
    expect(dlg().open).toBe(false)
    expect(document.activeElement).toBe(go)
    expect(seen).toEqual(['cv-open', 'cv-close'])
  })

  it('returns focus to the element with the opener id when a swap replaced it', async () => {
    await mount()
    const go = document.getElementById('go') as HTMLElement
    go.focus()
    go.click()
    await tick()
    document.body.innerHTML = html(' open') // a full replacement: a new #go, same id
    await tick()
    dlg().close()
    await tick()
    expect(document.activeElement).toBe(document.getElementById('go'))
  })

  it('falls back to <main>, never <body>, when the opener is gone', async () => {
    await mount()
    ;(document.getElementById('go') as HTMLElement).focus()
    dlg().show()
    await tick()
    document.getElementById('go')?.remove()
    dlg().close()
    await tick()
    expect(document.activeElement).toBe(document.querySelector('main'))
  })

  it('a backdrop click closes unless static', async () => {
    await mount()
    dlg().show()
    await tick()
    inner().click()
    await tick()
    expect(dlg().open).toBe(false)
    await mount(' static')
    dlg().show()
    await tick()
    inner().click()
    await tick()
    expect(dlg().open).toBe(true)
  })

  it('follows a native close (Escape / form method=dialog)', async () => {
    await mount()
    dlg().show()
    await tick()
    inner().dispatchEvent(new Event('close'))
    await tick()
    expect(dlg().open).toBe(false)
  })

  it('keeps its open state through an idiomorph morph to the server markup', async () => {
    await mount()
    dlg().show()
    await tick()
    Idiomorph.morph(document.body, html(), { morphStyle: 'innerHTML' })
    await tick()
    expect(dlg().open).toBe(true)
    expect(inner().hasAttribute('open')).toBe(true)
  })

  it('has no axe violations open', async () => {
    await mount()
    dlg().show()
    await tick()
    const r = await axe.run(document.body, { rules: { region: { enabled: false } } })
    expect(r.violations.map((v) => v.id)).toEqual([])
  })
})
