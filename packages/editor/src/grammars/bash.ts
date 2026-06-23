import { registerGrammar } from '../engine/registry.ts'
import { createRuleGrammar } from './rules.ts'

/** Bash: comments, strings, keywords, variables (`$VAR` / `${...}`), operators. */
export const bash = createRuleGrammar({
  name: 'bash',
  states: {
    default: [
      { match: /#.*/, kind: 'comment' },
      { match: /"(?:[^"\\]|\\.)*"/, kind: 'string' },
      { match: /'[^']*'/, kind: 'string' },
      {
        match:
          /\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|in|function|select|return|exit|break|continue|local|export|readonly|declare|echo|cd|source|set|unset)\b/,
        kind: 'keyword',
      },
      { match: /\$\{[^}]*\}|\$[A-Za-z_]\w*|\$[0-9@*#?$!]/, kind: 'variable' },
      { match: /-?\b\d+\b/, kind: 'number' },
      { match: /[A-Za-z_][\w-]*(?=\s*\(\s*\))/, kind: 'function' },
      { match: /[|&;<>()]+|&&|\|\||=/, kind: 'operator' },
    ],
  },
})

registerGrammar(bash)
