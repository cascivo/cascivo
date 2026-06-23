import { registerGrammar } from '../engine/registry.ts'
import { createRuleGrammar } from './rules.ts'

/**
 * HTML: tags, attribute names/values, `<!-- -->` comments (state carried across
 * lines), and text. Inside a tag, attributes and strings are colored until `>`.
 */
export const html = createRuleGrammar({
  name: 'html',
  states: {
    default: [
      { match: /<!--/, kind: 'comment', push: 'comment' },
      { match: /<!?\/?[A-Za-z][\w-]*/, kind: 'tag', push: 'tag' },
      { match: /&[a-zA-Z#0-9]+;/, kind: 'boolean' },
    ],
    comment: [
      { match: /-->/, kind: 'comment', pop: true },
      { match: /[^-]+/, kind: 'comment' },
      { match: /-/, kind: 'comment' },
    ],
    tag: [
      { match: /\/?>/, kind: 'tag', pop: true },
      { match: /"(?:[^"\\]|\\.)*"|'[^']*'/, kind: 'string' },
      { match: /[\w-]+(?=\s*=)/, kind: 'attr' },
      { match: /=/, kind: 'operator' },
      { match: /[\w-]+/, kind: 'attr' },
    ],
  },
})

registerGrammar(html)
