import { describe, expect, it, vi } from 'vitest'
import type { Message, MessageValue } from './types'

interface Registration {
  messages: Record<string, Message>
  locale: string
  dict: Record<string, MessageValue>
}

const registrations = vi.hoisted(() => [] as Registration[])

vi.mock('./messages', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./messages')>()
  return {
    ...actual,
    defineCatalog: (
      messages: Record<string, Message>,
      locale: string,
      dict: Record<string, MessageValue>,
    ) => {
      registrations.push({ messages, locale, dict })
      actual.defineCatalog(messages, locale, dict as never)
    },
  }
})

const { builtin } = await import('./builtin')
const files = import.meta.glob('./locales/*.ts', { eager: true })
const shipped = ['de', ...Object.keys(files).map((f) => f.slice('./locales/'.length, -3))]

function placeholders(value: MessageValue): Set<string> {
  const text = typeof value === 'string' ? value : Object.values(value).join(' ')
  return new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!))
}

describe('shipped locale catalogs', () => {
  it('ships at least ten languages besides English', () => {
    expect(shipped.length).toBeGreaterThanOrEqual(10)
  })

  for (const locale of shipped) {
    describe(locale, () => {
      const mine = registrations.filter((r) => r.locale === locale)

      it('registers every built-in namespace exactly once', () => {
        const namespaces = mine.map((r) => Object.values(r.messages)[0]!.key.split('.')[1])
        expect(namespaces.sort()).toEqual(Object.keys(builtin).sort())
      })

      it('keeps every placeholder and fills every plural category', () => {
        const categories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories
        const problems: string[] = []
        for (const { messages, dict } of mine) {
          for (const [name, message] of Object.entries(messages)) {
            const value = dict[name]
            if (value === undefined) {
              problems.push(`${message.key}: missing`)
              continue
            }
            // A plural branch may spell the number out ("un fichier"), so only a plural's
            // `other` branch must keep `{count}`; a plain string keeps every placeholder.
            const plural = typeof message.value !== 'string'
            const want = [...placeholders(message.value)].filter((p) => !plural || p !== 'count')
            const got = placeholders(value)
            for (const p of want) if (!got.has(p)) problems.push(`${message.key}: lost {${p}}`)
            for (const p of got) {
              if (p !== 'count' && !want.includes(p)) {
                problems.push(`${message.key}: unknown {${p}}`)
              }
            }
            if (plural && typeof value !== 'string' && placeholders(message.value).has('count')) {
              if (!placeholders(value.other).has('count')) {
                problems.push(`${message.key}: 'other' lost {count}`)
              }
            }
            if (typeof message.value !== 'string') {
              if (typeof value === 'string') {
                problems.push(`${message.key}: must be plural forms`)
                continue
              }
              for (const c of categories) {
                if (!(c in value)) problems.push(`${message.key}: no '${c}' branch`)
              }
            }
          }
        }
        expect(problems).toEqual([])
      })
    })
  }
})
