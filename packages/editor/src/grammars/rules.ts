import type { Grammar, Token, TokenKind } from '../engine/types.ts'

/**
 * One tokenizer rule. `match` is anchored at the current scan position (compiled
 * sticky internally). On a non-empty match the matched text becomes a token of
 * `kind`, the position advances, and the state transitions via `push`/`pop`.
 */
export interface Rule {
  match: RegExp
  kind: TokenKind
  /** Switch to this state after matching (for entering multi-line constructs). */
  push?: string
  /** Return to the `default` state after matching (for leaving them). */
  pop?: boolean
}

export interface RuleSpec {
  name: string
  /** Per-state ordered rule lists. Must include a `default` state. */
  states: Record<string, Rule[]>
}

interface CompiledRule {
  re: RegExp
  kind: TokenKind
  push?: string
  pop?: boolean
}

/**
 * Build a {@link Grammar} from ordered, state-keyed regex rules — a tiny
 * Monarch/Prism-style engine. At each position, the first rule in the current
 * state whose sticky regex matches wins; unmatched characters accumulate into
 * `plain` tokens, so the tokenizer is always lossless. State carries across
 * lines for block comments, template literals, and fenced code.
 */
export function createRuleGrammar(spec: RuleSpec): Grammar {
  const states: Record<string, CompiledRule[]> = {}
  for (const [stateName, rules] of Object.entries(spec.states)) {
    states[stateName] = rules.map((rule) => {
      const flags = `${rule.match.flags.replace(/[gy]/g, '')}y`
      const compiled: CompiledRule = { re: new RegExp(rule.match.source, flags), kind: rule.kind }
      if (rule.push !== undefined) compiled.push = rule.push
      if (rule.pop !== undefined) compiled.pop = rule.pop
      return compiled
    })
  }

  return {
    name: spec.name,
    initialState: 'default',
    tokenizeLine(line, state) {
      let current = states[state] ? state : 'default'
      const tokens: Token[] = []
      let plainStart = -1
      let i = 0

      const flushPlain = (end: number): void => {
        if (plainStart >= 0) {
          tokens.push({ kind: 'plain', value: line.slice(plainStart, end) })
          plainStart = -1
        }
      }

      while (i < line.length) {
        const rules = states[current] as CompiledRule[]
        let matched = false
        for (const rule of rules) {
          rule.re.lastIndex = i
          const m = rule.re.exec(line)
          if (m !== null && m.index === i && m[0].length > 0) {
            flushPlain(i)
            tokens.push({ kind: rule.kind, value: m[0] })
            i += m[0].length
            if (rule.pop) current = 'default'
            else if (rule.push && states[rule.push]) current = rule.push
            matched = true
            break
          }
        }
        if (!matched) {
          if (plainStart < 0) plainStart = i
          i++
        }
      }
      flushPlain(line.length)
      return { tokens, state: current }
    },
  }
}
