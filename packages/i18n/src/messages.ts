import { signal } from '@cascade-ui/core'
import { currentLocale } from './locale'
import type { Message, MessageValue, PluralForms, TArgs } from './types'

// locale → message key → translated value
const catalogs = new Map<string, Map<string, MessageValue>>()
// Bumped on registration so signal-tracked t() output re-resolves.
const catalogVersion = signal(0)
// module-global defaults for key-based lookup (used by translateKey)
const defaults = new Map<string, MessageValue>()

export function defineMessages<const T extends Record<string, MessageValue>>(
  namespace: string,
  messages: T,
): { [K in keyof T]: Message<T[K]> } {
  return Object.fromEntries(
    Object.entries(messages).map(([name, value]) => {
      const key = `${namespace}.${name}`
      defaults.set(key, value)
      return [name, { key, value }]
    }),
  ) as { [K in keyof T]: Message<T[K]> }
}

export function defineCatalog<T extends Record<string, Message>>(
  messages: T,
  locale: string,
  dict: { [K in keyof T]: T[K]['value'] extends PluralForms ? PluralForms : string },
): void {
  let catalog = catalogs.get(locale)
  if (!catalog) {
    catalog = new Map()
    catalogs.set(locale, catalog)
  }
  for (const [name, message] of Object.entries(messages)) {
    catalog.set(message.key, dict[name as keyof T] as MessageValue)
  }
  catalogVersion.value++
}

const pluralRules = new Map<string, Intl.PluralRules>()

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

/** Key-string lookup for serialized references (JSON configs). Untyped by design. */
export function translateKey(key: string, params?: Record<string, string | number>): string {
  void catalogVersion.value // subscribe signal-tracked callers to catalog updates
  const locale = currentLocale()
  const value = catalogs.get(locale)?.get(key) ?? defaults.get(key)
  if (value === undefined) return key
  // Reuse t's resolution by constructing a transient Message; untyped by design
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (t as (...a: any[]) => string)({ key, value }, params)
}

export function t<V extends MessageValue>(message: Message<V>, ...args: TArgs<V>): string {
  void catalogVersion.value // subscribe signal-tracked callers to catalog updates
  const locale = currentLocale()
  const value = catalogs.get(locale)?.get(message.key) ?? message.value
  const params = args[0] as Record<string, string | number> | undefined
  if (typeof value === 'string') return interpolate(value, params)
  let rules = pluralRules.get(locale)
  if (!rules) {
    rules = new Intl.PluralRules(locale)
    pluralRules.set(locale, rules)
  }
  const branch = value[rules.select(Number(params?.['count'] ?? 0))] ?? value.other
  return interpolate(branch, params)
}
