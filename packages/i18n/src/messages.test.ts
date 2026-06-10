import { describe, expect, it } from 'vitest'
import { createLocale } from './locale'
import { defineCatalog, defineMessages, t } from './messages'

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
})
