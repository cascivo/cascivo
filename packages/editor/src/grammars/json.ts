import { registerGrammar } from '../engine/registry.ts'
import { createRuleGrammar } from './rules.ts'

/**
 * JSON: property keys vs string values, numbers, booleans/null, punctuation.
 * A string immediately followed by a colon is a property key; other strings are
 * values.
 */
export const json = createRuleGrammar({
  name: 'json',
  states: {
    default: [
      { match: /"(?:[^"\\]|\\.)*"(?=\s*:)/, kind: 'property' },
      { match: /"(?:[^"\\]|\\.)*"/, kind: 'string' },
      { match: /\b(?:true|false|null)\b/, kind: 'boolean' },
      { match: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, kind: 'number' },
      { match: /[{}[\],]/, kind: 'punctuation' },
      { match: /:/, kind: 'operator' },
    ],
  },
})

registerGrammar(json)
