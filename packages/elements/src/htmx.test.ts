import { beforeAll, describe, expect, it } from 'vitest'
import { define as dialog } from './dialog.ts'
import { install } from './htmx.ts'
import { define as toaster } from './toaster.ts'

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
beforeAll(() => {
  dialog()
  toaster()
})
const fire = (el: Element, type: string, detail?: unknown) =>
  el.dispatchEvent(new CustomEvent(type, { bubbles: true, detail }))

describe('htmx glue', () => {
  it('install() is idempotent', () => {
    install()
    install()
    document.body.innerHTML = `<cv-toaster id="cv-toaster" duration="0"></cv-toaster>`
    fire(document.body, 'cv-toast', { value: [{ kind: 'success', message: 'once' }] })
    expect(document.querySelectorAll('.cv-toast-toast')).toHaveLength(1)
  })

  it('cv-toast accepts htmx array detail, a bare object and ignores junk', async () => {
    document.body.innerHTML = `<cv-toaster id="cv-toaster" duration="0"></cv-toaster>`
    await tick()
    fire(document.body, 'cv-toast', [{ message: 'a' }, { message: 'b' }])
    fire(document.body, 'cv-toast', { message: 'c' })
    fire(document.body, 'cv-toast', { value: 7 })
    expect(document.querySelectorAll('.cv-toast-toast')).toHaveLength(3)
  })

  it('cv-dialog-close closes the enclosing dialog, else every open one', async () => {
    document.body.innerHTML = `<cv-dialog id="a" open><dialog><button id="b">b</button></dialog></cv-dialog><cv-dialog id="c" open><dialog></dialog></cv-dialog><main></main>`
    await tick()
    fire(document.getElementById('b')!, 'cv-dialog-close')
    expect((document.getElementById('a') as any).open).toBe(false)
    expect((document.getElementById('c') as any).open).toBe(true)
    fire(document.body, 'cv-dialog-close')
    expect((document.getElementById('c') as any).open).toBe(false)
  })

  it('restores focus after a swap that dropped it', async () => {
    document.body.innerHTML = `<main><div id="t"><button id="f">f</button></div></main>`
    const f = () => document.getElementById('f') as HTMLElement
    f().focus()
    fire(document.body, 'htmx:beforeSwap')
    document.getElementById('t')!.innerHTML = `<button id="f">f</button>`
    expect(document.activeElement).toBe(document.body)
    fire(document.body, 'htmx:afterSettle', { target: document.getElementById('t') })
    expect(document.activeElement).toBe(f())
  })

  it('falls back to the first focusable in the target, then the target, then main', async () => {
    document.body.innerHTML = `<main><div id="t"></div></main>`
    fire(document.body, 'htmx:beforeSwap')
    document.getElementById('t')!.innerHTML = `<a href="#">x</a>`
    fire(document.body, 'htmx:afterSettle', { target: document.getElementById('t') })
    expect(document.activeElement?.localName).toBe('a')
    ;(document.activeElement as HTMLElement).blur()
    document.getElementById('t')!.innerHTML = `<p>text</p>`
    fire(document.body, 'htmx:afterSettle', { target: document.getElementById('t') })
    expect(document.activeElement?.id).toBe('t')
  })
})
