// G1 helpers: what counts as a breaking change of `contract.json`, and which bump covers it.
type Part = { class?: string; data?: Record<string, string[]>; deprecated?: unknown }
type Unit = {
  alias?: string
  classes?: Record<string, string>
  anatomy?: { root: Part; parts?: Record<string, Part> }
}
export type ContractJson = { format?: number; units: Record<string, Unit> }

const partsOf = (u: Unit): Record<string, Part> =>
  u.anatomy ? { root: u.anatomy.root, ...u.anatomy.parts } : {}

/** Everything the next contract no longer offers: removing or renaming is breaking, adding is not. */
export function breakingChanges(base: ContractJson, next: ContractJson): string[] {
  const out: string[] = []
  if (base.format !== next.format) out.push(`format ${base.format} -> ${next.format}`)
  for (const [name, b] of Object.entries(base.units)) {
    const n = next.units[name]
    if (!n) {
      out.push(`unit removed: ${name}`)
      continue
    }
    if (b.alias && b.alias !== n.alias)
      out.push(`${name}: alias ${b.alias} -> ${n.alias ?? 'none'}`)
    for (const [local, cls] of Object.entries(b.classes ?? {})) {
      const now = n.classes?.[local]
      if (now === undefined) out.push(`${name}: class removed: ${local}`)
      else if (now !== cls) out.push(`${name}: class ${local} renamed ${cls} -> ${now}`)
    }
    const np = partsOf(n)
    for (const [part, bp] of Object.entries(partsOf(b))) {
      const p = np[part]
      if (!p) {
        out.push(`${name}: part removed: ${part}`)
        continue
      }
      for (const [attr, values] of Object.entries(bp.data ?? {})) {
        const now = p.data?.[attr]
        if (!now) out.push(`${name}.${part}: ${attr} removed`)
        else
          for (const v of values)
            if (!now.includes(v)) out.push(`${name}.${part}: ${attr}="${v}" removed`)
      }
    }
  }
  return out
}

/** Bump a changeset must declare for `@cascivo/css` to cover a breaking diff. */
export const requiredBump = (version: string): 'major' | 'minor' =>
  version.startsWith('0.') ? 'minor' : 'major'

const RANK = { patch: 0, minor: 1, major: 2 } as const
/** True if any changeset front matter bumps `@cascivo/css` by at least `need`. */
export function changesetCovers(changesets: string[], need: 'major' | 'minor'): boolean {
  return changesets.some((md) => {
    const m = /^---\n([\s\S]*?)\n---/.exec(md)
    const bump = m && /['"]@cascivo\/css['"]:\s*(major|minor|patch)/.exec(m[1] as string)?.[1]
    return bump ? RANK[bump as keyof typeof RANK] >= RANK[need] : false
  })
}
