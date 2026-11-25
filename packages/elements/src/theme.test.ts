import axe from 'axe-core'
import { Idiomorph } from 'idiomorph'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { define } from './theme.ts'

const THEMES = [
  'light', 'dark', 'warm', 'midnight', 'terminal', 'brutalist',
  'corporate', 'cyberpunk', 'flat', 'minimal', 'pastel', 'arcade',
] // prettier-ignore

const select = (attrs = '') =>
  `<cv-theme id="t"${attrs}><label>Theme <select>${THEMES.map(
    (t) => `<option value="${t}">${t}</option>`,
  ).join('')}</select></label></cv-theme>`
const buttons = (attrs = '') => `<cv-theme id="t"${attrs}><div role="group" aria-label="Theme">
<button type="button" data-cv-theme-value="light" aria-pressed="true">Light</button>
<button type="button" data-cv-theme-value="dark" aria-pressed="false">Dark</button></div></cv-theme>`

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const html = document.documentElement
async function mount(markup: string) {
  document.body.innerHTML = markup
  await tick()
}
const sel = () => document.querySelector('select') as HTMLSelectElement
const pick = async (v: string) => {
  sel().value = v
  sel().dispatchEvent(new Event('change', { bubbles: true }))
  await tick()
}

beforeAll(define)
beforeEach(() => {
  document.body.innerHTML = ''
  html.removeAttribute('data-theme')
  html.removeAttribute('data-density')
  localStorage.clear()
})

describe('cv-theme', () => {
  it('all twelve themes are selectable and set data-theme + the persisted envelope', async () => {
    await mount(select())
    const seen: unknown[] = []
    document
      .getElementById('t')!
      .addEventListener('cv-theme-change', (e) => seen.push((e as CustomEvent).detail.value))
    for (const t of THEMES) {
      await pick(t)
      expect(html.getAttribute('data-theme')).toBe(t)
      expect(localStorage.getItem('cascade-theme')).toBe(JSON.stringify({ v: 1, value: t }))
    }
    expect(seen).toEqual(THEMES.filter((t) => t !== 'light'))
  })

  it('restores the stored envelope and a bare string on connect, quietly', async () => {
    localStorage.setItem('cascade-theme', JSON.stringify({ v: 1, value: 'midnight' }))
    const seen: unknown[] = []
    document.addEventListener('cv-theme-change', (e) => seen.push(e), { once: true })
    await mount(select())
    expect(html.getAttribute('data-theme')).toBe('midnight')
    expect(sel().value).toBe('midnight')
    expect(seen).toEqual([])
    localStorage.setItem('cascade-theme', 'warm')
    await mount(select())
    expect(html.getAttribute('data-theme')).toBe('warm')
  })

  it('keeps what <html> already carries (the no-flash script) when nothing is stored', async () => {
    html.setAttribute('data-theme', 'pastel')
    await mount(select())
    expect(sel().value).toBe('pastel')
  })

  it('drives buttons with aria-pressed', async () => {
    await mount(buttons())
    const [light, dark] = [...document.querySelectorAll<HTMLElement>('button')]
    dark!.click()
    await tick()
    expect(html.getAttribute('data-theme')).toBe('dark')
    expect(dark!.getAttribute('aria-pressed')).toBe('true')
    expect(light!.getAttribute('aria-pressed')).toBe('false')
  })

  it('switches density through attribute / storage-key', async () => {
    await mount(
      select(' attribute="data-density" storage-key="cascade-density"').replace(
        /value="light"/,
        'value="compact"',
      ),
    )
    await pick('compact')
    expect(html.getAttribute('data-density')).toBe('compact')
    expect(html.hasAttribute('data-theme')).toBe(false)
    expect(localStorage.getItem('cascade-density')).toContain('compact')
  })

  it('still applies when localStorage throws', async () => {
    await mount(select())
    const orig = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new Error('blocked')
    }
    try {
      await pick('dark')
      expect(html.getAttribute('data-theme')).toBe('dark')
    } finally {
      Storage.prototype.setItem = orig
    }
  })

  it('survives an idiomorph morph back to the server markup', async () => {
    await mount(select())
    await pick('terminal')
    Idiomorph.morph(document.getElementById('t')!, select(), { morphStyle: 'outerHTML' })
    await tick()
    expect(sel().value).toBe('terminal')
    expect(html.getAttribute('data-theme')).toBe('terminal')
  })

  it('is axe clean', async () => {
    await mount(select())
    const r = await axe.run(document.body, { rules: { region: { enabled: false } } })
    expect(r.violations.map((v) => v.id)).toEqual([])
  })
})
