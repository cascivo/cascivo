type ClassMap = Readonly<Record<string, Readonly<Record<string, string>>>>

const IMPORT = /import\s*\{([^}]*)\}\s*from\s*(['"])@cascivo\/css\2/g

/**
 * Rewrite `c.card.card` (with `import { classes as c } from '@cascivo/css'`) to the literal
 * `"cv-card-card"`. The map is one object literal Rolldown cannot split, so every island that
 * read it shipped all ~950 class names (~6 KB gz). Only fully static chains of known keys are
 * rewritten; anything dynamic keeps the import and therefore the map (correct, just bigger).
 * Returns `undefined` when nothing changed.
 */
export function inlineClasses(code: string, map: ClassMap): string | undefined {
  let out = code
  let changed = false
  for (const m of code.matchAll(IMPORT)) {
    const spec = /(?:^|,)\s*classes(?:\s+as\s+([A-Za-z_$][\w$]*))?\s*(?:,|$)/.exec(m[1] ?? '')
    if (!spec) continue
    const local = spec[1] ?? 'classes'
    const chain = new RegExp(
      `(?<![\\w$.])${local.replace(/\$/g, '\\$')}\\.([A-Za-z_$][\\w$]*)\\.([A-Za-z_$][\\w$]*)(?![\\w$(])`,
      'g',
    )
    out = out.replace(chain, (whole, unit: string, part: string) => {
      const value = map[unit]?.[part]
      if (value === undefined) return whole
      changed = true
      return JSON.stringify(value)
    })
  }
  return changed ? out : undefined
}
