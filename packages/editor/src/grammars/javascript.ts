import { registerGrammar } from '../engine/registry.ts'
import { createCLikeGrammar, JS_KEYWORDS } from './clike.ts'

/** JavaScript: keywords, strings (incl. multi-line template literals), numbers,
 * line + block comments (state carry), function calls, identifiers, operators. */
export const javascript = createCLikeGrammar('javascript', JS_KEYWORDS)

registerGrammar(javascript)
