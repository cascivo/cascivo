import { describe, expect, it } from 'vitest'
import { buildGrammar, formatGrammar, parseEnum } from './grammar.js'
import { buildGenerationPrompt } from './prompt.js'
import { loadRegistry } from './registry.js'

const registry = loadRegistry()

describe('parseEnum()', () => {
  it('parses string-literal unions', () => {
    expect(parseEnum("'sm' | 'md' | 'lg'")).toEqual(['sm', 'md', 'lg'])
    expect(parseEnum('"a"|"b"')).toEqual(['a', 'b'])
  })

  it('returns undefined for non-enum types', () => {
    expect(parseEnum('string')).toBeUndefined()
    expect(parseEnum('boolean')).toBeUndefined()
    expect(parseEnum('(v: string) => void')).toBeUndefined()
    expect(parseEnum('string | number')).toBeUndefined()
  })
})

describe('buildGrammar() is bounded by the registry', () => {
  const grammar = buildGrammar(registry)
  const realNames = new Set(registry.components.map((c) => c.meta.name))
  // Every real (component, prop, type) triple — duplicate meta.names contribute all their props.
  const realProps = new Set(
    registry.components.flatMap((c) =>
      (c.meta.props ?? []).map((p) => `${c.meta.name}::${p.name}::${p.type}`),
    ),
  )

  it('references only real components, one per distinct name', () => {
    const distinctNames = new Set(registry.components.map((c) => c.meta.name)).size
    expect(grammar.components.length).toBe(distinctNames)
    for (const c of grammar.components) {
      expect(realNames.has(c.name)).toBe(true)
    }
  })

  it('lists only real props with their real types and enum values', () => {
    for (const c of grammar.components) {
      for (const prop of c.props) {
        expect(
          realProps.has(`${c.name}::${prop.name}::${prop.type}`),
          `${c.name}.${prop.name}: ${prop.type} must come from a real manifest`,
        ).toBe(true)
        // Enum values are self-consistent with the declared type — never invented.
        expect(prop.enum).toEqual(parseEnum(prop.type))
      }
    }
  })

  it('scopes to a subset (case-insensitive)', () => {
    const subset = buildGrammar(registry, ['badge', 'Button'])
    expect(subset.components.map((c) => c.name).sort()).toEqual(['Badge', 'Button'])
  })
})

describe('formatGrammar() / buildGenerationPrompt()', () => {
  it('formats a small subset deterministically', () => {
    const text = formatGrammar(buildGrammar(registry, ['Badge', 'Separator']))
    expect(text).toMatchInlineSnapshot(`
      "Badge(size: sm|md, variant: default|secondary|success|warning|destructive|outline)
      Separator(decorative: boolean, orientation: horizontal|vertical)"
    `)
  })

  it('embeds the bounded vocabulary and the JSON contract in the prompt', () => {
    const prompt = buildGenerationPrompt(registry, { components: ['Badge'] })
    expect(prompt).toContain('Badge(')
    expect(prompt).toContain('"$data.')
    expect(prompt).toContain('"$actions.')
    expect(prompt).toContain('Output ONLY the JSON ViewConfig')
    // Subset is respected — unrelated components are absent.
    expect(prompt).not.toContain('DataTable(')
  })
})
