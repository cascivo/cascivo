import { registerGrammar } from '../engine/registry.ts'
import { createCLikeGrammar, JS_KEYWORDS } from './clike.ts'

/** TypeScript: JavaScript plus type-level keywords colored as `type`. */
const TS_TYPE_KEYWORDS = [
  'interface',
  'type',
  'enum',
  'implements',
  'namespace',
  'declare',
  'abstract',
  'readonly',
  'public',
  'private',
  'protected',
  'keyof',
  'infer',
  'satisfies',
  'is',
  'asserts',
  'override',
  'string',
  'number',
  'boolean',
  'any',
  'unknown',
  'never',
  'object',
]

export const typescript = createCLikeGrammar('typescript', JS_KEYWORDS, TS_TYPE_KEYWORDS)

registerGrammar(typescript)
