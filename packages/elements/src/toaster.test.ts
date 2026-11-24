import { classes } from '@cascivo/css'
import axe from 'axe-core'
import { Idiomorph } from 'idiomorph'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { define } from './toaster.ts'

const toast = (msg: string, variant = 'default') =>
  `<div class="cv-toast-toast" role="status" data-variant="${variant}"><div class="cv-toast-body"><div class="cv-toast-title">${msg}</div></div><button type="button" class="cv-toast-close" aria-label="Dismiss">×</button></div>`
const html = (inner = '', attrs = '') =>
  `<main><button id="x" type="button">x</button><cv-toaster id="cv-toaster" class="cv-toast-viewport" aria-label="Notifications"${attrs}>${inner}</cv-toaster></main>`
const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const rows = () => [...document.querySelectorAll('.cv-toast-toast')]
const toaster = () =>
  document.getElementById('cv-toaster') as HTMLElement & { add: (t: object) => void }
beforeAll(define)
afterEach(() => vi.useRealTimers())

describe('cv-toaster', () => {
  it('uses the contract classes of @cascivo/css', () => {
    for (const k of ['toast', 'close', 'body', 'title', 'icon', 'description'] as const)
      expect(classes.toast[k]).toBe(`cv-toast-${k}`)
  })

  it('is a labelled region and auto-dismisses after duration', async () => {
    vi.useFakeTimers()
    document.body.innerHTML = html(toast('Saved'), ' duration="1000"')
    await vi.advanceTimersByTimeAsync(0)
    expect(toaster().getAttribute('role')).toBe('region')
    expect(rows()).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1001)
    expect(rows()).toHaveLength(0)
  })

  it('picks up OOB-appended toasts and keeps them with duration=0', async () => {
    vi.useFakeTimers()
    document.body.innerHTML = html('', ' duration="0"')
    await vi.advanceTimersByTimeAsync(0)
    toaster().insertAdjacentHTML('beforeend', toast('Hi'))
    await vi.advanceTimersByTimeAsync(60_000)
    expect(rows()).toHaveLength(1)
  })

  it('pauses on hover/focus and resumes', async () => {
    vi.useFakeTimers()
    document.body.innerHTML = html(toast('Saved'), ' duration="1000"')
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(600)
    toaster().dispatchEvent(new Event('pointerenter'))
    await vi.advanceTimersByTimeAsync(5000)
    expect(rows()).toHaveLength(1)
    toaster().dispatchEvent(new Event('pointerleave'))
    await vi.advanceTimersByTimeAsync(300)
    expect(rows()).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(200)
    expect(rows()).toHaveLength(0)
  })

  it('add() builds a toast from data as text, never HTML', async () => {
    document.body.innerHTML = html()
    await tick()
    toaster().add({ kind: 'danger', message: '<img src=x onerror=alert(1)>' })
    await tick()
    const row = rows()[0] as HTMLElement
    expect(row.getAttribute('role')).toBe('alert')
    expect(row.dataset['variant']).toBe('destructive')
    expect(row.querySelector('img')).toBeNull()
    expect(row.querySelector('.cv-toast-close')?.getAttribute('aria-label')).toBe(
      'Dismiss notification',
    )
  })

  it('close button dismisses and focus never falls to <body>', async () => {
    document.body.innerHTML = html(toast('a') + toast('b'), ' duration="0"')
    await tick()
    const closes = document.querySelectorAll<HTMLElement>('.cv-toast-close')
    closes[0]!.focus()
    closes[0]!.click()
    await tick()
    expect(rows()).toHaveLength(1)
    expect(document.activeElement).toBe(document.querySelector('.cv-toast-close'))
    ;(document.querySelector('.cv-toast-close') as HTMLElement).click()
    await tick()
    expect(document.activeElement).not.toBe(document.body)
  })

  it('survives an idiomorph morph (keeps live toasts running)', async () => {
    document.body.innerHTML = html(toast('a'), ' duration="0"')
    await tick()
    Idiomorph.morph(document.body, html(toast('a'), ' duration="0"'), { morphStyle: 'innerHTML' })
    await tick()
    expect(rows()).toHaveLength(1)
    expect(toaster().getAttribute('role')).toBe('region')
  })

  it('has no axe violations', async () => {
    document.body.innerHTML = html(toast('Saved') + toast('Oops', 'destructive'), ' duration="0"')
    await tick()
    const r = await axe.run(document.body, { rules: { region: { enabled: false } } })
    expect(r.violations.map((v) => v.id)).toEqual([])
  })
})
