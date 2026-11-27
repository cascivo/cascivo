import { createSignal } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { Badge, Button, Card, Field, Input, Select } from './components.tsx'
import { createForm } from './form.ts'
import { createI18n } from './i18n.ts'
import { defineIsland } from './island.ts'
import { fromSignal } from './signals.ts'
import { mountIsland } from './testing.ts'
import { createTheme } from './theme.ts'

describe('components', () => {
  it('Button writes contract attributes and loading state', () => {
    const [loading, setLoading] = createSignal(false)
    const { el } = mountIsland(defineIsland(() => <Button loading={loading()}>Go</Button>))
    const b = el.querySelector('button')!
    expect(b.className).toBe('cv-button-button')
    expect(b.dataset.variant).toBe('primary')
    expect(b.dataset.state).toBe('idle')
    setLoading(true)
    expect(b.dataset.state).toBe('loading')
    expect(b.getAttribute('aria-busy')).toBe('true')
    expect(b.disabled).toBe(true)
  })

  it('Input wires error, aria-invalid and describedby', () => {
    const { el } = mountIsland(
      defineIsland(() => <Input name="email" label="Email" error="Required" />),
    )
    const i = el.querySelector('input')!
    expect(i.getAttribute('aria-invalid')).toBe('true')
    expect(i.getAttribute('aria-describedby')).toBe('email-error')
    expect(el.querySelector('[role=alert]')!.textContent).toBe('Required')
    expect(el.firstElementChild!.getAttribute('data-state')).toBe('error')
  })

  it('Field, Card, Badge, Select render', () => {
    const { el } = mountIsland(
      defineIsland(() => (
        <Card title="T" footer="F">
          <Badge variant="success">ok</Badge>
          <Field error="bad">
            <Select name="s" label="S">
              <option>a</option>
            </Select>
          </Field>
        </Card>
      )),
    )
    expect(el.querySelector('.cv-card-title')!.textContent).toBe('T')
    expect(el.querySelector('.cv-badge-badge')!.getAttribute('data-variant')).toBe('success')
    expect(el.querySelector('.cv-field-field')!.getAttribute('data-state')).toBe('invalid')
    expect(el.querySelector('select')!.className).toBe('cv-select-select')
  })
})

describe('createForm', () => {
  it('collects 422 errors, blocks double submit', async () => {
    let resolve!: (v: Record<string, string>) => void
    const submit = vi.fn(() => new Promise<Record<string, string>>((r) => (resolve = r)))
    let form!: ReturnType<typeof createForm>
    const { el } = mountIsland(
      defineIsland(() => {
        form = createForm(submit)
        return (
          <form onSubmit={form.onSubmit}>
            <Input name="email" label="E" value="a" error={form.errors().email} />
          </form>
        )
      }),
    )
    const f = el.querySelector('form')!
    f.dispatchEvent(new SubmitEvent('submit', { cancelable: true }))
    f.dispatchEvent(new SubmitEvent('submit', { cancelable: true }))
    expect(submit).toHaveBeenCalledTimes(1)
    expect(form.submitting()).toBe(true)
    resolve({ email: 'Invalid' })
    await vi.waitFor(() => expect(form.submitting()).toBe(false))
    expect(el.querySelector('[role=alert]')!.textContent).toBe('Invalid')
  })
})

describe('createI18n', () => {
  it('interpolates, falls back, reacts to locale', () => {
    const i = createI18n({ en: { hi: 'Hi {n}', only: 'x' }, de: { hi: 'Hallo {n}' } }, 'de-AT')
    expect(i.locale()).toBe('de')
    expect(i.t('hi', { n: 2 })).toBe('Hallo 2')
    expect(i.t('only')).toBe('x')
    expect(i.t('nope')).toBe('nope')
    i.setLocale('en')
    expect(i.t('hi', { n: 1 })).toBe('Hi 1')
  })
})

describe('createTheme', () => {
  it('sets data-theme and cycles', () => {
    document.documentElement.dataset.theme = 'light'
    const t = createTheme(['light', 'dark', 'brutalist'])
    t.toggle()
    expect(document.documentElement.dataset.theme).toBe('dark')
    t.setTheme('brutalist')
    t.toggle()
    expect(t.theme()).toBe('light')
    expect(localStorage.getItem('cv-theme')).toBe('light')
  })
})

describe('fromSignal', () => {
  it('tracks a preact-style signal and unsubscribes on dispose', () => {
    const subs = new Set<(v: number) => void>()
    const sig = {
      value: 1,
      subscribe(fn: (v: number) => void) {
        subs.add(fn)
        fn(this.value)
        return () => void subs.delete(fn)
      },
    }
    const m = mountIsland(
      defineIsland(() => {
        const v = fromSignal(sig)
        return <i>{v()}</i>
      }),
    )
    expect(m.el.textContent).toBe('1')
    subs.forEach((f) => f(5))
    expect(m.el.textContent).toBe('5')
    m.unmount()
    expect(subs.size).toBe(0)
  })
})
