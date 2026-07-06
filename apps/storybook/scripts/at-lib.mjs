/**
 * Pure helpers for the assistive-technology sweep — no screen reader, no browser,
 * so they run and test anywhere (the guidepup driving lives in at-sweep.mjs).
 */

/**
 * Expected role/keyword each component's announcement should contain. A first-pass
 * heuristic: a match grades `pass`, a non-empty announcement without the keyword
 * grades `partial` (a human confirms the quirk), and silence grades `fail`. Humans
 * refine from the raw phrases the sweep logs.
 */
export const EXPECTED = {
  Button: ['button'],
  Checkbox: ['checkbox', 'check box'],
  Radio: ['radio'],
  Toggle: ['switch', 'toggle'],
  Slider: ['slider'],
  Tabs: ['tab'],
  Accordion: ['button', 'expand', 'collaps'],
  Modal: ['dialog'],
  Dropdown: ['menu'],
  Tooltip: ['tooltip', 'button'],
  Toast: ['alert', 'status', 'notification'],
  BarChart: ['img', 'image', 'graphics', 'application'],
}

/** Grade a single component from the phrases a screen reader spoke for it. */
export function gradeComponent(name, phrases) {
  const joined = phrases.join(' • ').toLowerCase().trim()
  if (!joined) return { status: 'fail', phrase: '' }
  const keys = EXPECTED[name] ?? []
  const matched = keys.some((k) => joined.includes(k))
  return { status: matched ? 'pass' : 'partial', phrase: phrases.filter(Boolean).join(' • ') }
}

/**
 * Merge one stack's graded results into a copy of the results file. Fills the
 * given `stackId` column for each component and stamps `generatedAt`.
 */
export function mergeStackResults(file, stackId, graded, generatedAt) {
  return {
    ...file,
    generatedAt,
    components: file.components.map((c) => {
      const g = graded[c.name]
      return g ? { ...c, results: { ...c.results, [stackId]: g.status } } : c
    }),
  }
}

/** Resolve each planned component to a concrete Storybook story id from index.json. */
export function resolveStories(index, components) {
  const stories = Object.values(index.entries).filter((e) => e.type === 'story')
  return components.map((c) => {
    const byId = stories.find((s) => s.id === c.story)
    return { name: c.name, id: (byId ?? { id: c.story }).id }
  })
}
