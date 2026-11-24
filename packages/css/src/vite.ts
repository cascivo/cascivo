/**
 * `generateScopedName` for Vite's CSS modules that gives cascivo component modules their
 * contract class names (`cv-<unit>-<local>`, the same names `@cascivo/css` ships), so React
 * markup and plain-HTML/htmx markup share one class vocabulary. Every other module keeps a
 * hashed name.
 *
 * ```ts
 * import { cascivoScopedName } from '@cascivo/css/vite'
 * export default defineConfig({ css: { modules: { generateScopedName: cascivoScopedName } } })
 * ```
 */
import { classes } from './classes.gen.ts'

export type ScopedName = (local: string, filename: string, css?: string) => string

export interface CascivoScopedNameOptions {
  /**
   * The contract unit of a CSS module, or `undefined` to hash it. Receives the path with `/`
   * separators and no query. Default: the module's directory name (`…/button/button.module.css`
   * → `button`), the layout `cascivo add` writes.
   */
  unit?: (filename: string) => string | undefined
  /**
   * `'contract'` (default): only locals that are in the contract get a contract name, so a
   * renamed local leaves the contract visibly. `'any'`: every local of a known unit follows the
   * pattern (cascivo's own build, where the contract is generated from these modules).
   */
  locals?: 'contract' | 'any'
}

/** Contract unit → its CSS-module locals. */
const UNITS: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  Object.values(classes).map((entry): [string, Set<string>] => {
    const unit = entry.alias.slice('cv-'.length)
    const prefix = `${entry.alias}-`
    const locals = Object.values(entry as Record<string, string>)
      .filter((c) => c.startsWith(prefix))
      .map((c) => c.slice(prefix.length))
    return [unit, new Set(locals)]
  }),
)

const normalize = (filename: string) => filename.split('?')[0]!.replace(/\\/g, '/')

const parentDir = (file: string) => file.split('/').at(-2)

/** Short, stable hash (djb2, base 36) for the non-contract fallback name. */
function hash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(36).padStart(5, '0').slice(-5)
}

export function createCascivoScopedName(options: CascivoScopedNameOptions = {}): ScopedName {
  const unitOf = options.unit ?? parentDir
  const anyLocal = options.locals === 'any'
  return (local, filename) => {
    const file = normalize(filename)
    const unit = unitOf(file)
    const locals = unit === undefined ? undefined : UNITS.get(unit)
    if (locals && (anyLocal || locals.has(local))) return `cv-${unit}-${local}`
    return `_${local}_${hash(`${file}:${local}`)}`
  }
}

/** The default: contract names for contract locals of `<unit>/<file>.module.css`, else hashed. */
export const cascivoScopedName: ScopedName = createCascivoScopedName()
