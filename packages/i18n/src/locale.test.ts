import { describe, expect, it, vi } from 'vitest'
import { createLocale, currentLocale } from './locale'

describe('createLocale', () => {
  it('starts on the default locale', () => {
    const store = createLocale({ default: 'en', supported: ['en', 'de'] })
    expect(store.locale.value).toBe('en')
    expect(currentLocale()).toBe('en')
  })

  it('switches locale', async () => {
    const store = createLocale({ default: 'en', supported: ['en', 'de'] })
    await store.set('de')
    expect(store.locale.value).toBe('de')
  })

  it('rejects unsupported locales', async () => {
    const store = createLocale({ default: 'en', supported: ['en', 'de'] })
    await expect(store.set('fr' as never)).rejects.toThrow('Unsupported locale "fr"')
  })

  it('runs a registered catalog loader once, before switching', async () => {
    const store = createLocale({ default: 'en', supported: ['en', 'de'] })
    const load = vi.fn().mockResolvedValue(undefined)
    store.registerCatalog('de', load)
    await store.set('de')
    await store.set('en')
    await store.set('de')
    expect(load).toHaveBeenCalledTimes(1)
  })
})
