import { registerGrammar } from '../engine/registry.ts'
import { createRuleGrammar } from './rules.ts'

/**
 * Markdown: headings, strong/emphasis, inline code, fenced code blocks (state
 * carried across lines), links, and list markers.
 */
export const markdown = createRuleGrammar({
  name: 'markdown',
  states: {
    default: [
      { match: /^```.*/, kind: 'keyword', push: 'fence' },
      { match: /^#{1,6}\s.*/, kind: 'keyword' },
      { match: /^\s*(?:[-*+]|\d+\.)\s/, kind: 'operator' },
      { match: /^\s*>\s.*/, kind: 'comment' },
      { match: /`[^`]+`/, kind: 'string' },
      { match: /\*\*[^*]+\*\*|__[^_]+__/, kind: 'keyword' },
      { match: /\*[^*\s][^*]*\*|_[^_\s][^_]*_/, kind: 'type' },
      { match: /!?\[[^\]]*\]\([^)]*\)/, kind: 'function' },
    ],
    fence: [
      { match: /^```.*/, kind: 'keyword', pop: true },
      { match: /.+/, kind: 'string' },
    ],
  },
})

registerGrammar(markdown)
