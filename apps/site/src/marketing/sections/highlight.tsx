import type { ReactNode } from 'react'

export type CodeLang = 'css' | 'js'

interface Rule {
  type: string
  source: string
}

// Patterns are tried in order at each scan position; first non-empty match wins.
const RULES: Record<CodeLang, Rule[]> = {
  css: [
    { type: 'comment', source: '/\\*[\\s\\S]*?\\*/' },
    { type: 'string', source: '"[^"]*"|\'[^\']*\'' },
    { type: 'atrule', source: '@[\\w-]+' },
    { type: 'variable', source: '--[\\w-]+' },
    { type: 'fn', source: '[\\w-]+(?=\\()' },
    { type: 'number', source: '-?\\d*\\.?\\d+[a-z%]*' },
    { type: 'punct', source: '[{}();:,]' },
  ],
  js: [
    { type: 'comment', source: '//[^\\n]*' },
    { type: 'string', source: '\'[^\']*\'|"[^"]*"|`[^`]*`' },
    { type: 'keyword', source: '\\b(?:const|let|var|function|return|if|else|new)\\b' },
    { type: 'fn', source: '[\\w$]+(?=\\()' },
    { type: 'number', source: '-?\\d*\\.?\\d+' },
    { type: 'punct', source: '[{}()[\\];:,.]|=>' },
  ],
}

interface Token {
  type: string
  value: string
}

function tokenize(code: string, lang: CodeLang): Token[] {
  const rules = RULES[lang].map((r) => ({ type: r.type, re: new RegExp(`^(?:${r.source})`) }))
  const tokens: Token[] = []
  let rest = code
  let plain = ''
  const flushPlain = () => {
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
        flushPlain()
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
  flushPlain()
  return tokens
}

/** Lightweight, dependency-free syntax highlighting for the landing's code samples. */
export function CodeBlock({ code, lang }: { code: string; lang: CodeLang }): ReactNode {
  return (
    <pre className="tech-pre">
      <code>
        {tokenize(code, lang).map((tok, i) =>
          tok.type === 'text' ? (
            // eslint-disable-next-line react/no-array-index-key
            <span key={i}>{tok.value}</span>
          ) : (
            // eslint-disable-next-line react/no-array-index-key
            <span key={i} className={`tok-${tok.type}`}>
              {tok.value}
            </span>
          ),
        )}
      </code>
    </pre>
  )
}
