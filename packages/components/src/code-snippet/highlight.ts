// Tiny, dependency-free syntax tokenizer for the CodeSnippet component.
// Supports the four languages a component library demos most: bash, css, js, ts.
// It is intentionally not a full parser — a single left-to-right scan, first
// matching rule wins, anything unmatched is emitted as plain text. Highlighting
// is presentational, so over-/under-matching only affects colour, never meaning.

export type CodeLang = 'bash' | 'css' | 'js' | 'ts'

export interface Token {
  /** A token class (`comment`, `string`, …) or `text` for unhighlighted runs. */
  type: string
  value: string
}

interface Rule {
  type: string
  re: RegExp
}

function compile(specs: ReadonlyArray<readonly [string, string]>): Rule[] {
  return specs.map(([type, source]) => ({ type, re: new RegExp(`^(?:${source})`) }))
}

const STRING = `"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'`
const TEMPLATE = '`(?:[^`\\\\]|\\\\.)*`'
const JS_KEYWORDS =
  'const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|super|import|export|from|default|async|await|yield|typeof|instanceof|in|of|void|delete|this|null|true|false|undefined'
const TS_KEYWORDS = `${JS_KEYWORDS}|interface|type|as|readonly|enum|implements|public|private|protected|abstract|namespace|declare|satisfies|keyof|infer|is|string|number|boolean|unknown|never|any`

const RULES: Record<CodeLang, Rule[]> = {
  bash: compile([
    ['comment', '#[^\\n]*'],
    ['string', STRING],
    ['prompt', '\\$(?= )'],
    [
      'keyword',
      '\\b(?:npx|npm|pnpm|yarn|bun|deno|node|git|cd|ls|cat|echo|export|sudo|mkdir|rm|cp|mv|curl|wget|chmod|source)\\b',
    ],
    ['variable', '--?[A-Za-z][\\w-]*'],
    ['number', '\\b\\d+(?:\\.\\d+)?\\b'],
  ]),
  css: compile([
    ['comment', '/\\*[\\s\\S]*?\\*/'],
    ['string', STRING],
    ['keyword', '@[\\w-]+'],
    ['variable', '--[\\w-]+'],
    ['fn', '[\\w-]+(?=\\()'],
    ['number', '#[0-9a-fA-F]{3,8}\\b|-?\\d*\\.?\\d+(?:[a-z%]+)?'],
    ['punct', '[{}();:,]'],
  ]),
  js: compile([
    ['comment', '//[^\\n]*|/\\*[\\s\\S]*?\\*/'],
    ['string', `${STRING}|${TEMPLATE}`],
    ['keyword', `\\b(?:${JS_KEYWORDS})\\b`],
    ['fn', '[A-Za-z_$][\\w$]*(?=\\()'],
    ['number', '-?\\d*\\.?\\d+'],
    ['punct', '[{}()\\[\\];:,.]|=>'],
  ]),
  ts: compile([
    ['comment', '//[^\\n]*|/\\*[\\s\\S]*?\\*/'],
    ['string', `${STRING}|${TEMPLATE}`],
    ['keyword', `\\b(?:${TS_KEYWORDS})\\b`],
    ['fn', '[A-Za-z_$][\\w$]*(?=\\()'],
    ['number', '-?\\d*\\.?\\d+'],
    ['punct', '[{}()\\[\\];:,.]|=>'],
  ]),
}

export function tokenize(code: string, lang: CodeLang): Token[] {
  const rules = RULES[lang]
  const tokens: Token[] = []
  let rest = code
  let plain = ''
  const flush = () => {
    if (plain) {
      tokens.push({ type: 'text', value: plain })
      plain = ''
    }
  }
  while (rest.length > 0) {
    let matched = false
    for (const { type, re } of rules) {
      const m = re.exec(rest)
      if (m && m[0].length > 0) {
        flush()
        tokens.push({ type, value: m[0] })
        rest = rest.slice(m[0].length)
        matched = true
        break
      }
    }
    if (!matched) {
      plain += rest[0]
      rest = rest.slice(1)
    }
  }
  flush()
  return tokens
}
