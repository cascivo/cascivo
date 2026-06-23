import { registerGrammar } from '../engine/registry.ts'
import { createRuleGrammar } from './rules.ts'

/**
 * Markdown for a notes/wiki surface: ATX headings, horizontal rules, task &
 * ordered/unordered lists, blockquotes, inline + fenced code (state carried across
 * lines), strong/emphasis/strikethrough, and links/images. Line-based, so setext
 * headings and CommonMark tables/footnotes are intentionally out of scope; the
 * fence body is colored uniformly (embedded-language highlight is a future step).
 */
export const markdown = createRuleGrammar({
  name: 'markdown',
  states: {
    default: [
      // Fenced code — open (``` or ~~~) pushes the fence state.
      { match: /^```.*/, kind: 'keyword', push: 'fence' },
      { match: /^~~~.*/, kind: 'keyword', push: 'fenceTilde' },
      // Horizontal rule: 3+ of the same -, *, or _ alone on the line.
      { match: /^\s*([-*_])(?:[ \t]*\1){2,}[ \t]*$/, kind: 'comment' },
      // ATX heading.
      { match: /^#{1,6}\s.*/, kind: 'keyword' },
      // Task list checkbox (must precede the plain list marker).
      { match: /^\s*[-*+]\s+\[[ xX]\]/, kind: 'boolean' },
      // Unordered / ordered list marker.
      { match: /^\s*(?:[-*+]|\d+\.)\s/, kind: 'operator' },
      // Blockquote.
      { match: /^\s*>\s?.*/, kind: 'comment' },
      // Inline code.
      { match: /`[^`]+`/, kind: 'string' },
      // Strikethrough.
      { match: /~~[^~]+~~/, kind: 'comment' },
      // Strong then emphasis.
      { match: /\*\*[^*]+\*\*|__[^_]+__/, kind: 'keyword' },
      { match: /\*[^*\s][^*]*\*|_[^_\s][^_]*_/, kind: 'type' },
      // Link / image.
      { match: /!?\[[^\]]*\]\([^)]*\)/, kind: 'function' },
    ],
    fence: [
      { match: /^```.*/, kind: 'keyword', pop: true },
      { match: /.+/, kind: 'string' },
    ],
    fenceTilde: [
      { match: /^~~~.*/, kind: 'keyword', pop: true },
      { match: /.+/, kind: 'string' },
    ],
  },
})

registerGrammar(markdown)
