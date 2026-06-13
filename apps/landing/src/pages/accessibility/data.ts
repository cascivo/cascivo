import registry from '../../../../../registry.json'
import bench from 'virtual:bench'

interface RegistryEntry {
  name: string
  category: string
  meta: {
    name: string
    accessibility?: { role: string; wcag: string; keyboard?: string[]; apgPattern?: string }
  }
}

export interface A11yRow {
  name: string
  category: string
  role: string
  wcag: string
  apgPattern: string | null
  keyboard: string[]
}

const entries = (registry as { components: RegistryEntry[] }).components

/** Total registry entries (components + charts + layouts + blocks + sections). */
export const REGISTRY_TOTAL = entries.length

/** One matrix row per entry that ships accessibility metadata. */
export const A11Y_ROWS: A11yRow[] = entries.flatMap((e) =>
  e.meta.accessibility
    ? [
        {
          name: e.meta.name,
          category: e.category,
          role: e.meta.accessibility.role,
          wcag: e.meta.accessibility.wcag,
          apgPattern: e.meta.accessibility.apgPattern ?? null,
          keyboard: e.meta.accessibility.keyboard ?? [],
        },
      ]
    : [],
)

export const A11Y_COVERED = A11Y_ROWS.length
export const KEYBOARD_DOCUMENTED = A11Y_ROWS.filter((r) => r.keyboard.length > 0).length
export const A11Y_CATEGORIES = [...new Set(A11Y_ROWS.map((r) => r.category))].sort()

export interface AxeSlice {
  violations: number
  rules: string[]
}

/** Defined only when all three libraries have axe results — single guard for all sections. */
export const AXE: { cascade: AxeSlice; shadcn: AxeSlice; carbon: AxeSlice } | undefined =
  bench.a11y?.cascade && bench.a11y.shadcn && bench.a11y.carbon
    ? { cascade: bench.a11y.cascade, shadcn: bench.a11y.shadcn, carbon: bench.a11y.carbon }
    : undefined
