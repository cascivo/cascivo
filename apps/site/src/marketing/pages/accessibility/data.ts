import registry from '../../../../../../registry.json'
import bench from 'virtual:bench'
import atResultsRaw from './at-results.json'

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

// ── Assistive-technology (screen-reader) results ──────────────────────────────
// Written by .github/workflows/a11y-at.yml (guidepup drives NVDA + VoiceOver in
// CI). Until the first run lands, generatedAt is null and every cell reads
// "pending" — the plan is public, the results are honestly marked as not-yet-run.

export type AtStatus = 'pass' | 'partial' | 'fail' | 'pending' | 'na'

export interface AtStack {
  id: string
  label: string
  platform: string
}

export interface AtComponent {
  name: string
  story: string
  results: Record<string, AtStatus>
}

interface AtResultsFile {
  generatedAt: string | null
  stacks: AtStack[]
  components: { name: string; story: string; results?: Record<string, string> }[]
}

function normalizeAtStatus(v: string | undefined): AtStatus {
  return v === 'pass' || v === 'partial' || v === 'fail' || v === 'na' ? v : 'pending'
}

const atFile = atResultsRaw as AtResultsFile

/** ISO date of the last automated run, or null if none has landed yet. */
export const AT_GENERATED_AT: string | null = atFile.generatedAt
export const AT_STACKS: AtStack[] = atFile.stacks
export const AT_COMPONENTS: AtComponent[] = atFile.components.map((c) => ({
  name: c.name,
  story: c.story,
  results: Object.fromEntries(
    atFile.stacks.map((s) => [s.id, normalizeAtStatus(c.results?.[s.id])]),
  ),
}))
/** True once an automated run has written real results. */
export const AT_HAS_RESULTS = AT_GENERATED_AT !== null
