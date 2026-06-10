/** CLDR plural-form branches (subset actually selected by Intl.PluralRules). */
export interface PluralForms {
  zero?: string
  one?: string
  two?: string
  few?: string
  many?: string
  other: string
}

export type MessageValue = string | PluralForms

export interface Message<V extends MessageValue = MessageValue> {
  /** Stable catalog key, e.g. 'cascade.pagination.itemsPerPage'. */
  key: string
  /** Default-locale value — the zero-config fallback. */
  value: V
}

/** Extracts '{name}' placeholders from a template-literal string type. */
type ParamKeys<S extends string> = S extends `${string}{${infer P}}${infer R}`
  ? P | ParamKeys<R>
  : never

type BranchParams<P extends PluralForms> = ParamKeys<Extract<P[keyof P], string>>

export type MessageParams<V extends MessageValue> = V extends string
  ? ParamKeys<V>
  : V extends PluralForms
    ? BranchParams<V> | 'count'
    : string

/** No-placeholder messages need no params argument; others require a typed record. */
export type TArgs<V extends MessageValue> = [MessageParams<V>] extends [never]
  ? []
  : [params: { [K in MessageParams<V>]: string | number }]
