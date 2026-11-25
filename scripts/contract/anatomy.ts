/**
 * Validates a manifest's `contractTier` + `anatomy` against its CSS module and resolves the
 * anatomy into contract form (classes filled in). Pure: callers pass the CSS locals.
 */
import type {
  Anatomy,
  AnatomyDataValues,
  AnatomyPart,
  ComponentMeta,
  ContractTier,
} from '../../packages/core/src/types.ts'
import { contractClass } from './css.ts'

export const CONTRACT_TIERS: readonly ContractTier[] = ['static', 'native', 'behaviour']

type MetaFields = Pick<ComponentMeta, 'variants' | 'sizes' | 'states' | 'contractTier' | 'anatomy'>

const TAG = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const DATA = /^data-[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const ARIA = /^aria-[a-z]+$/
const TYPES = new Set(['string', 'number', 'boolean'])
// data attributes whose values must agree with a manifest list.
const META_LISTS = {
  'data-variant': 'variants',
  'data-size': 'sizes',
  'data-state': 'states',
} as const

/** The local class a part uses: explicit `local`, else the key (`root` → the unit). */
export function partLocal(unit: string, key: string, part: AnatomyPart): string {
  return part.local ?? (key === 'root' ? unit : key)
}

function entries(a: Anatomy): [string, AnatomyPart][] {
  return [['root', a.root], ...Object.entries(a.parts ?? {})]
}

/** Every problem with the manifest's contract fields; empty when valid. */
export function validateAnatomy(unit: string, meta: MetaFields, locals: string[]): string[] {
  const errors: string[] = []
  const err = (m: string) => errors.push(`${unit}: ${m}`)
  if (!meta.contractTier || !CONTRACT_TIERS.includes(meta.contractTier))
    err(`contractTier must be one of ${CONTRACT_TIERS.join(' | ')}`)
  const a = meta.anatomy
  if (!a) return errors
  if (a.parts && 'root' in a.parts) err('"root" is reserved; declare it as anatomy.root')

  const localSet = new Set(locals)
  const used = new Map<string, string>()
  for (const [key, part] of entries(a)) {
    const local = partLocal(unit, key, part)
    if (!localSet.has(local))
      err(
        key === 'root' && part.local === undefined
          ? `anatomy.root needs a local (no CSS-module class "${unit}")`
          : `part "${key}" local "${local}" is not a CSS-module class`,
      )
    const prev = used.get(local)
    if (prev) err(`parts "${prev}" and "${key}" share the local "${local}"`)
    used.set(local, key)
    for (const [mod, when] of Object.entries(part.modifiers ?? {})) {
      if (!localSet.has(mod)) err(`part "${key}" modifier "${mod}" is not a CSS-module class`)
      if (!when) err(`part "${key}" modifier "${mod}" needs the prop expression that adds it`)
      const p2 = used.get(mod)
      if (p2) err(`parts "${p2}" and "${key}" share the local "${mod}"`)
      used.set(mod, key)
    }

    const tags = Array.isArray(part.element) ? part.element : [part.element]
    if (tags.length === 0 || tags.some((t) => typeof t !== 'string' || !TAG.test(t)))
      err(`part "${key}" element must be a lowercase tag name or a non-empty array of them`)

    for (const [name, values] of Object.entries(part.data ?? {})) {
      if (!DATA.test(name)) err(`part "${key}": data attribute "${name}" must be data-<kebab>`)
      checkValues(key, name, values, err)
      // Only the root's variant/size/state mirror the manifest; inner parts of compound
      // components carry their own values (a data-table row's `data-state="selected"`).
      const list = key === 'root' ? META_LISTS[name as keyof typeof META_LISTS] : undefined
      const expected = list ? meta[list] : undefined
      if (expected?.length && Array.isArray(values) && !sameSet(values, expected))
        err(
          `part "${key}": ${name} [${values.join(', ')}] disagrees with meta.${list} [${expected.join(', ')}]`,
        )
    }
    for (const name of part.aria ?? [])
      if (!ARIA.test(name)) err(`part "${key}": aria attribute "${name}" must be aria-<name>`)
    if (part.emit && meta.contractTier === 'behaviour')
      err(`part "${key}": emit is only for 'static' / 'native' tiers`)
  }
  for (const l of locals)
    if (!used.has(l)) err(`CSS-module class "${l}" is not a part of the anatomy`)

  checkTree(a, err)
  return errors
}

function checkValues(key: string, name: string, v: AnatomyDataValues, err: (m: string) => void) {
  if (typeof v === 'string') {
    if (!TYPES.has(v)) err(`part "${key}": ${name} type must be string | number | boolean`)
  } else if (v.length === 0 || new Set(v).size !== v.length || v.some((x) => typeof x !== 'string'))
    err(`part "${key}": ${name} values must be unique strings`)
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && new Set([...a, ...b]).size === a.length

function checkTree(a: Anatomy, err: (m: string) => void) {
  const parts = a.parts ?? {}
  const reached = new Set<string>()
  const walk = (key: string, part: AnatomyPart, path: string[]) => {
    for (const c of part.children ?? []) {
      if (c === '$slot' || c === '$text') continue
      if (c.startsWith('@')) {
        if (!TAG.test(c.slice(1))) err(`part "${key}": "${c}" must be @<unit>`)
        continue
      }
      if (c === 'root') {
        err(`part "${key}": root cannot be a child`)
        continue
      }
      const child = parts[c]
      if (!child) {
        err(`part "${key}": unknown child "${c}"`)
        continue
      }
      if (path.includes(c)) {
        err(`part "${key}": cycle through "${c}"`)
        continue
      }
      reached.add(c)
      walk(c, child, [...path, c])
    }
  }
  walk('root', a.root, ['root'])
  for (const k of Object.keys(parts))
    if (!reached.has(k)) err(`part "${k}" is not reachable from root.children`)
}

/** A part in contract form: its resolved local and class. */
export type ResolvedPart = Omit<AnatomyPart, 'local' | 'modifiers'> & {
  local: string
  class: string
  /** Modifier local → its class and the prop expression that adds it. */
  modifiers?: Record<string, { class: string; when: string }>
}
export interface ResolvedAnatomy {
  root: ResolvedPart
  parts: Record<string, ResolvedPart>
}

export function resolveAnatomy(unit: string, a: Anatomy): ResolvedAnatomy {
  const resolve = (key: string, p: AnatomyPart): ResolvedPart => {
    const { modifiers, ...rest } = p
    const local = partLocal(unit, key, p)
    return {
      ...rest,
      local,
      class: contractClass(unit, local),
      ...(modifiers
        ? {
            modifiers: Object.fromEntries(
              Object.entries(modifiers).map(([m, when]) => [
                m,
                { class: contractClass(unit, m), when },
              ]),
            ),
          }
        : {}),
    }
  }
  return {
    root: resolve('root', a.root),
    parts: Object.fromEntries(Object.entries(a.parts ?? {}).map(([k, p]) => [k, resolve(k, p)])),
  }
}
