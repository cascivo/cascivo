import type { Grammar } from '../engine/types.ts'
import { createRuleGrammar, type Rule } from './rules.ts'

/** Keywords shared by JavaScript and TypeScript. */
export const JS_KEYWORDS = [
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'of',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'as',
  'from',
  'get',
  'set',
]

/** Word alternation that respects word boundaries (longest-safe via \b). */
function words(list: readonly string[]): RegExp {
  return new RegExp(`(?:${list.join('|')})\\b`)
}

/**
 * Build a C-like grammar (JavaScript / TypeScript). Multi-line state covers block
 * comments and template literals. `typeKeywords` are colored as `type`.
 */
export function createCLikeGrammar(
  name: string,
  keywords: readonly string[],
  typeKeywords: readonly string[] = [],
): Grammar {
  const defaultRules: Rule[] = [
    { match: /\/\/.*/, kind: 'comment' },
    { match: /\/\*/, kind: 'comment', push: 'block' },
    { match: /`/, kind: 'string', push: 'template' },
    { match: /'(?:[^'\\]|\\.)*'/, kind: 'string' },
    { match: /"(?:[^"\\]|\\.)*"/, kind: 'string' },
    {
      match: /0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|(?:\d[\d_]*\.?\d*|\.\d+)(?:[eE][+-]?\d+)?n?/,
      kind: 'number',
    },
    { match: /\b(?:true|false|null|undefined|NaN|Infinity)\b/, kind: 'boolean' },
  ]
  if (typeKeywords.length > 0) {
    defaultRules.push({ match: words(typeKeywords), kind: 'type' })
  }
  defaultRules.push(
    { match: words(keywords), kind: 'keyword' },
    // An identifier immediately before `(` is a function call/definition.
    { match: /[A-Za-z_$][\w$]*(?=\s*\()/, kind: 'function' },
    { match: /[A-Z][\w$]*/, kind: 'type' },
    { match: /[A-Za-z_$][\w$]*/, kind: 'variable' },
    { match: /[+\-*/%=<>!&|^~?]+/, kind: 'operator' },
    { match: /[{}()[\];,.:]/, kind: 'punctuation' },
  )

  return createRuleGrammar({
    name,
    states: {
      default: defaultRules,
      block: [
        { match: /\*\//, kind: 'comment', pop: true },
        { match: /[^*]+/, kind: 'comment' },
        { match: /\*/, kind: 'comment' },
      ],
      template: [
        { match: /\\./, kind: 'string' },
        { match: /`/, kind: 'string', pop: true },
        { match: /\$\{/, kind: 'punctuation' },
        { match: /[^`\\$]+/, kind: 'string' },
        { match: /\$/, kind: 'string' },
      ],
    },
  })
}
