import { describe, expect, it } from 'vitest'
import { createLocale } from './locale'
import { defineCatalog, defineMessages, t, translateKey } from './messages'

const messages = defineMessages('test', {
  plain: 'Hello',
  greeting: 'Hello {name}',
  items: { one: '{count} item', other: '{count} items' },
})

describe('t()', () => {
  it('returns the default-locale value with zero config', () => {
    createLocale({ default: 'en', supported: ['en', 'de'] })
    expect(t(messages.plain)).toBe('Hello')
  })

  it('interpolates params', () => {
    expect(t(messages.greeting, { name: 'Ada' })).toBe('Hello Ada')
  })

  it('selects plural branches via Intl.PluralRules', () => {
    expect(t(messages.items, { count: 1 })).toBe('1 item')
    expect(t(messages.items, { count: 4 })).toBe('4 items')
  })

  it('resolves a registered catalog and falls back per-key', async () => {
    const store = createLocale({ default: 'en', supported: ['en', 'de'] })
    defineCatalog(messages, 'de', {
      plain: 'Hallo',
      greeting: 'Hallo {name}',
      items: { one: '{count} Eintrag', other: '{count} Einträge' },
    })
    await store.set('de')
    expect(t(messages.plain)).toBe('Hallo')
    expect(t(messages.items, { count: 2 })).toBe('2 Einträge')
    await store.set('en')
    expect(t(messages.plain)).toBe('Hello')
  })

  it('leaves unknown placeholders intact', () => {
    expect(t(messages.greeting, {} as { name: string })).toBe('Hello {name}')
  })

  it('rejects missing params at the type level', () => {
    // @ts-expect-error — 'name' param is required
    t(messages.greeting)
    // @ts-expect-error — plain takes no params
    t(messages.plain, { name: 'x' })
  })

  it('degrades to an empty string instead of throwing on a version-skewed missing message', () => {
    // Simulates an older @cascivo/i18n build lacking a key a newer component references
    // (e.g. builtin.dataTable.previousPage undefined at runtime) — see messages.ts t().
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(t(undefined as any)).toBe('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(t({} as any)).toBe('')
  })
})

describe('translateKey()', () => {
  it('resolves registered defaults by key', () => {
    createLocale({ default: 'en', supported: ['en', 'de'] })
    expect(translateKey('test.plain')).toBe('Hello')
  })

  it('interpolates params via key', () => {
    expect(translateKey('test.greeting', { name: 'Ada' })).toBe('Hello Ada')
  })

  it('resolves catalog overrides by locale', async () => {
    const store = createLocale({ default: 'en', supported: ['en', 'de'] })
    defineCatalog(messages, 'de', {
      plain: 'Hallo',
      greeting: 'Hallo {name}',
      items: { one: '{count} Eintrag', other: '{count} Einträge' },
    })
    await store.set('de')
    expect(translateKey('test.plain')).toBe('Hallo')
    await store.set('en')
  })

  it('falls back to the key for unknown keys', () => {
    expect(translateKey('nope.missing')).toBe('nope.missing')
  })
})
