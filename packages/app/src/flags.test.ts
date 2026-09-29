import { afterEach, describe, expect, it, vi } from 'vitest'
import { createClient, createHandler, defineApi, endpoint } from './api'
import {
  applyThemeOverride,
  defineFlags,
  NO_THEME_OVERRIDE,
  objectFlag,
  parseThemeOverride,
  themeFlag,
} from './flags'
import type { FlagContext, FlagEvaluator } from './flags'

const flags = defineFlags({
  newCheckout: false,
  headline: 'Welcome',
  maxItems: 10,
  theme: themeFlag(),
})

/** A flag service holding fixed values; `undefined` means "not configured". */
function evaluator(values: Record<string, unknown>, seen: FlagContext[] = []): FlagEvaluator {
  const get = async <T>(key: string, fallback: T, context?: FlagContext): Promise<T> => {
    if (context) seen.push(context)
    const value = values[key]
    if (value instanceof Error) throw value
    // A real service returns whatever the dashboard holds: it is typed, not checked.
    return (value ?? fallback) as T
  }
  return {
    getBooleanValue: get,
    getStringValue: get,
    getNumberValue: get,
    getObjectValue: get,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('defineFlags', () => {
  it('starts every flag at its default', () => {
    expect(flags.defaults).toEqual({
      newCheckout: false,
      headline: 'Welcome',
      maxItems: 10,
      theme: NO_THEME_OVERRIDE,
    })
  })

  it('evaluates each flag with its own getter and passes the context through', async () => {
    const seen: FlagContext[] = []
    const values = await flags.evaluate(
      evaluator({ newCheckout: true, headline: 'Hi', theme: { theme: 'dark' } }, seen),
      { userId: 'u1' },
    )
    expect(values).toEqual({
      newCheckout: true,
      headline: 'Hi',
      maxItems: 10,
      theme: { theme: 'dark', tokens: {} },
    })
    expect(seen).toHaveLength(4)
    expect(seen.every((c) => c['userId'] === 'u1')).toBe(true)
  })

  it('keeps the default for a flag that fails to evaluate', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const values = await flags.evaluate(evaluator({ newCheckout: new Error('down'), maxItems: 3 }))
    expect(values.newCheckout).toBe(false)
    expect(values.maxItems).toBe(3)
    expect(warn).toHaveBeenCalledOnce()
  })

  it('keeps the default for a wrongly-typed or malformed value, on either side', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const bad = { newCheckout: 'yes', maxItems: '3', theme: { tokens: { color: 'red' } } }
    const evaluated = await flags.evaluate(evaluator(bad))
    const parsed = flags.parse(bad)
    for (const values of [evaluated, parsed]) {
      expect(values.newCheckout).toBe(false)
      expect(values.maxItems).toBe(10)
      expect(values.theme).toBe(NO_THEME_OVERRIDE)
    }
    expect(warn).toHaveBeenCalled()
  })

  it('parses a payload that is not an object as all defaults', () => {
    expect(flags.parse(null)).toEqual(flags.defaults)
    expect(flags.parse('nope')).toEqual(flags.defaults)
  })

  it('checks an object flag with its own parser', () => {
    const limits = defineFlags({
      limits: objectFlag({ rows: 50 }, (raw) => {
        if (
          typeof raw === 'object' &&
          raw !== null &&
          'rows' in raw &&
          typeof raw.rows === 'number'
        ) {
          return { rows: raw.rows }
        }
        throw new Error('limits: { rows: number }')
      }),
    })
    expect(limits.parse({ limits: { rows: 5 } }).limits).toEqual({ rows: 5 })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(limits.parse({ limits: { rows: 'all' } }).limits).toEqual({ rows: 50 })
  })

  it('serves evaluated flags through a typed endpoint', async () => {
    const api = defineApi({
      flags: endpoint({ method: 'GET', path: '/api/flags', output: flags.parse }),
    })
    const handle = createHandler(api, {
      flags: () => flags.evaluate(evaluator({ headline: 'From the Worker' })),
    })
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      handle(new Request(new URL(input, 'http://app.test'), init), undefined),
    )
    const values = await createClient(api).flags()
    expect(values.headline).toBe('From the Worker')
    expect(values.newCheckout).toBe(false)
  })
})

describe('parseThemeOverride', () => {
  it('accepts a theme name and --cascivo-* tokens', () => {
    expect(
      parseThemeOverride({
        theme: 'warm',
        tokens: { '--cascivo-color-accent': 'oklch(0.6 0.2 30)' },
      }),
    ).toEqual({ theme: 'warm', tokens: { '--cascivo-color-accent': 'oklch(0.6 0.2 30)' } })
    expect(parseThemeOverride({})).toEqual({ theme: null, tokens: {} })
  })

  it.each([
    ['a non-object', 'dark'],
    ['a theme that is not a name', { theme: 'dark" onload="x' }],
    ['a property outside --cascivo-*', { tokens: { color: 'red' } }],
    [
      'a value that closes the declaration',
      { tokens: { '--cascivo-color-accent': 'red; } body { display: none' } },
    ],
    ['a url() value', { tokens: { '--cascivo-radius-md': 'url(https://tracker.example/p)' } }],
    ['a non-string value', { tokens: { '--cascivo-radius-md': 4 } }],
  ])('rejects %s', (_, raw) => {
    expect(() => parseThemeOverride(raw)).toThrow()
  })
})

describe('applyThemeOverride', () => {
  it('applies a theme and tokens, and the returned function restores the element', () => {
    const el = document.createElement('div')
    el.setAttribute('data-theme', 'light')
    el.style.setProperty('--cascivo-radius-md', '4px')
    const undo = applyThemeOverride(el, {
      theme: 'dark',
      tokens: { '--cascivo-radius-md': '12px', '--cascivo-color-accent': 'red' },
    })
    expect(el.getAttribute('data-theme')).toBe('dark')
    expect(el.style.getPropertyValue('--cascivo-radius-md')).toBe('12px')
    undo()
    expect(el.getAttribute('data-theme')).toBe('light')
    expect(el.style.getPropertyValue('--cascivo-radius-md')).toBe('4px')
    expect(el.style.getPropertyValue('--cascivo-color-accent')).toBe('')
  })

  it('leaves the theme alone when the override has none', () => {
    const el = document.createElement('div')
    applyThemeOverride(el, NO_THEME_OVERRIDE)()
    expect(el.hasAttribute('data-theme')).toBe(false)
  })
})
