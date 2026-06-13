import { describe, expect, it } from 'vitest'
import { selectComponent, type SelectResult } from './select.js'
import type { ContextComponent } from './context.js'

function makeComponent(
  name: string,
  description: string,
  whenToUse: string[],
  whenNotToUse: string[] = [],
  related: { name: string; relationship: string; reason: string }[] = [],
): ContextComponent {
  return {
    name,
    category: 'test',
    description,
    intent: { whenToUse, whenNotToUse, antiPatterns: [], related, a11yRationale: '' },
    contextUrl: `/context/${name.toLowerCase()}.md`,
  }
}

const FIXTURE_COMPONENTS: ContextComponent[] = [
  makeComponent(
    'Toast',
    'Transient notification surfaced via the useToast hook',
    [
      'Brief, transient feedback that should auto-dismiss without interrupting the task',
      'Confirming that a background action resulted in success or failure',
      'Non-blocking notifications that can stack and disappear on their own',
    ],
    ['A persistent, inline message tied to a specific region — use Alert'],
  ),
  makeComponent(
    'Alert',
    'Highlights a short, important message inline',
    [
      'Surfacing a persistent, contextual message inline within a view (warning, error, info, success)',
      'Communicating status that should stay visible until read or resolved',
    ],
    ['Transient confirmation that should auto-dismiss — use Toast'],
  ),
  makeComponent(
    'Select',
    'Native select menu styled to match the design system',
    [
      'Choosing exactly one value from a known, finite list inside a form',
      'A compact single-value picker when space is tight',
    ],
    ['Choosing multiple values — use MultiSelect'],
    [{ name: 'Combobox', relationship: 'alternative', reason: 'Filterable version' }],
  ),
  makeComponent(
    'Radio',
    'Single choice from a set, grouped with RadioGroup',
    [
      'Choosing exactly one option from a small, mutually exclusive set (roughly 2–6)',
      'All options should be visible at once',
    ],
    ['More than 6 options — use Select or Combobox'],
  ),
  makeComponent(
    'Combobox',
    'Filterable single-select with an animated custom listbox',
    [
      'Single-select from a long list where type-to-filter makes finding an option faster',
      'Form fields where users may not know the exact option name upfront',
    ],
    ['Selecting multiple values — use MultiSelect'],
  ),
]

describe('selectComponent', () => {
  it('returns empty array for empty need', () => {
    expect(selectComponent('', FIXTURE_COMPONENTS)).toEqual([])
    expect(selectComponent('   ', FIXTURE_COMPONENTS)).toEqual([])
  })

  it('"transient success notification" → Toast ranks first and above Alert', () => {
    const results = selectComponent('transient success notification', FIXTURE_COMPONENTS)
    const names = results.map((r) => r.name)
    expect(names[0]).toBe('Toast')
    // Alert is penalized because 'transient' appears in its whenNotToUse
    const alertResult = results.find((r) => r.name === 'Alert')
    const toastResult = results.find((r) => r.name === 'Toast')
    expect(toastResult).toBeDefined()
    if (alertResult) {
      expect(toastResult!.score).toBeGreaterThan(alertResult.score)
    }
  })

  it('"choose exactly one option from a list" → Select and Radio near top', () => {
    const results = selectComponent('choose exactly one option from a list', FIXTURE_COMPONENTS)
    const names = results.map((r) => r.name)
    // Both Select and Radio match 'one' and 'option'/'options' in their whenToUse
    expect(names).toContain('Select')
    expect(names).toContain('Radio')
  })

  it('returns at most 5 results', () => {
    const results = selectComponent('option list select', FIXTURE_COMPONENTS)
    expect(results.length).toBeLessThanOrEqual(5)
  })

  it('all returned results have score >= 0', () => {
    const results = selectComponent('transient success notification', FIXTURE_COMPONENTS)
    for (const r of results) {
      expect(r.score).toBeGreaterThanOrEqual(0)
    }
  })

  it('results are sorted by score DESC, then name ASC for ties', () => {
    const results = selectComponent('option', FIXTURE_COMPONENTS)
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1] as SelectResult
      const curr = results[i] as SelectResult
      if (prev.score === curr.score) {
        expect(prev.name.localeCompare(curr.name)).toBeLessThanOrEqual(0)
      } else {
        expect(prev.score).toBeGreaterThanOrEqual(curr.score)
      }
    }
  })

  it('why field explains the match', () => {
    const results = selectComponent('transient notification', FIXTURE_COMPONENTS)
    const toast = results.find((r) => r.name === 'Toast')
    expect(toast).toBeDefined()
    expect(toast?.why).toMatch(/transient|notification/i)
  })

  it('is deterministic — same input always produces same output', () => {
    const need = 'transient success notification auto-dismiss'
    const first = selectComponent(need, FIXTURE_COMPONENTS)
    const second = selectComponent(need, FIXTURE_COMPONENTS)
    expect(first).toEqual(second)
  })
})
