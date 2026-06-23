import { registerGrammar } from '../engine/registry.ts'
import { createRuleGrammar } from './rules.ts'

/**
 * CSS: at-rules, selectors, property names, values, numbers/units, strings, and
 * `/* *\/` block comments (state carried across lines).
 */
export const css = createRuleGrammar({
  name: 'css',
  states: {
    default: [
      { match: /\/\*/, kind: 'comment', push: 'block' },
      { match: /@[\w-]+/, kind: 'keyword' },
      { match: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/, kind: 'string' },
      { match: /#[0-9a-fA-F]{3,8}\b/, kind: 'number' },
      { match: /-?\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms|deg|fr|ch|ex)?/, kind: 'number' },
      { match: /--[\w-]+/, kind: 'variable' },
      { match: /[.#][\w-]+/, kind: 'tag' },
      { match: /&|::?[\w-]+/, kind: 'tag' },
      // A property name is an identifier immediately before a colon.
      { match: /[\w-]+(?=\s*:)/, kind: 'property' },
      { match: /[\w-]+(?=\s*\()/, kind: 'function' },
      { match: /[{}();,:]/, kind: 'punctuation' },
    ],
    block: [
      { match: /\*\//, kind: 'comment', pop: true },
      { match: /[^*]+/, kind: 'comment' },
      { match: /\*/, kind: 'comment' },
    ],
  },
})

registerGrammar(css)
