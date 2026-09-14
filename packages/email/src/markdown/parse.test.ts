import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown, safeUrl, type Block } from './parse.ts'

const text = (value: string) => ({ kind: 'text', value }) as const

describe('safeUrl', () => {
  it('accepts the three schemes an email client acts on', () => {
    expect(safeUrl('https://x.test/a')).toBe('https://x.test/a')
    expect(safeUrl('http://x.test/a')).toBe('http://x.test/a')
    expect(safeUrl('mailto:a@x.test')).toBe('mailto:a@x.test')
  })

  it('rejects anything else, allowlist-style', () => {
    // A denylist loses to whatever normalises to the same scheme later; this only ever
    // says yes to a scheme it recognises.
    for (const bad of [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'data:text/html,<script>',
      'vbscript:msgbox',
      ' javascript:alert(1)',
      'java\tscript:alert(1)',
    ]) {
      expect(safeUrl(bad), bad).toBeUndefined()
    }
  })

  it('rejects a relative URL, which has no base document to resolve against', () => {
    expect(safeUrl('/pricing')).toBeUndefined()
    expect(safeUrl('pricing.html')).toBeUndefined()
  })
})

describe('parseInline', () => {
  it('reads strong, em and code', () => {
    expect(parseInline('**a** *b* `c`')).toEqual([
      { kind: 'strong', children: [text('a')] },
      text(' '),
      { kind: 'em', children: [text('b')] },
      text(' '),
      { kind: 'code', value: 'c' },
    ])
  })

  it('prefers the longer marker, so ** never parses as two *', () => {
    expect(parseInline('__a__')).toEqual([{ kind: 'strong', children: [text('a')] }])
  })

  it('leaves an underscore inside a word alone', () => {
    // `snake_case_name` is an identifier in prose about code, not emphasis.
    expect(parseInline('snake_case_name')).toEqual([text('snake_case_name')])
  })

  it('reads a link and an autolink', () => {
    expect(parseInline('[a](https://x.test)')).toEqual([
      { kind: 'link', href: 'https://x.test', children: [text('a')] },
    ])
    expect(parseInline('<https://x.test>')).toEqual([
      { kind: 'link', href: 'https://x.test', children: [text('https://x.test')] },
    ])
  })

  it('keeps the label but drops the anchor for an unusable href', () => {
    expect(parseInline('[click me](javascript:alert(1))')).toEqual([text('click me')])
  })

  it('keeps the alt text when an image src is unusable', () => {
    expect(parseInline('![a logo](data:image/png;base64,AAA)')).toEqual([text('a logo')])
  })

  it('keeps balanced parens inside a destination', () => {
    // `…/wiki/Ruby_(programming_language)` is an ordinary newsletter link; truncating it at
    // the first `)` would make safeUrl reject a URL that was fine.
    expect(
      parseInline('[Ruby](https://en.wikipedia.org/wiki/Ruby_(programming_language))'),
    ).toEqual([
      {
        kind: 'link',
        href: 'https://en.wikipedia.org/wiki/Ruby_(programming_language)',
        children: [text('Ruby')],
      },
    ])
  })

  it('drops a link title, which no email client shows', () => {
    expect(parseInline('[a](https://x.test "Tooltip")')).toEqual([
      { kind: 'link', href: 'https://x.test', children: [text('a')] },
    ])
  })

  it('honours a backslash escape', () => {
    expect(parseInline('\\*not em\\*')).toEqual([text('*not em*')])
  })

  it('treats an unclosed marker as literal text', () => {
    expect(parseInline('2 * 3 = 6')).toEqual([text('2 * 3 = 6')])
  })
})

describe('parseMarkdown', () => {
  const kinds = (blocks: Block[]) => blocks.map((b) => b.kind)

  it('reads the block set a newsletter uses', () => {
    const doc = parseMarkdown(
      ['# Title', '', 'Some prose.', '', '- one', '- two', '', '---', '', '> quoted'].join('\n'),
    )
    expect(kinds(doc)).toEqual(['heading', 'paragraph', 'list', 'hr', 'quote'])
  })

  it('numbers an ordered list from its marker, not its position', () => {
    const [list] = parseMarkdown('1. one\n2. two')
    expect(list).toMatchObject({ kind: 'list', ordered: true })
    expect(list?.kind === 'list' && list.items).toHaveLength(2)
  })

  it('joins a wrapped list item onto one line', () => {
    const [list] = parseMarkdown('- one\n  continued\n- two')
    expect(list?.kind === 'list' && list.items[0]).toEqual([text('one continued')])
  })

  it('keeps a fenced block verbatim, blank lines included', () => {
    const [code] = parseMarkdown('```js\nconst a = 1\n\nconst b = 2\n```')
    expect(code).toEqual({ kind: 'code', value: 'const a = 1\n\nconst b = 2' })
  })

  it('ends an unterminated fence at EOF rather than throwing', () => {
    // Prose fetched at send time must never be able to fail a send.
    expect(parseMarkdown('```\nunclosed')).toEqual([{ kind: 'code', value: 'unclosed' }])
  })

  it('nests blocks inside a quote', () => {
    const [quote] = parseMarkdown('> # Heading\n>\n> body')
    expect(quote?.kind === 'quote' && kinds(quote.children)).toEqual(['heading', 'paragraph'])
  })

  it('parses raw HTML as text, which is the whole conformance argument', () => {
    expect(parseMarkdown('<b>bold</b>')).toEqual([
      { kind: 'paragraph', children: [text('<b>bold</b>')] },
    ])
  })

  it('reads CRLF input the same as LF', () => {
    expect(parseMarkdown('# A\r\n\r\nB')).toEqual(parseMarkdown('# A\n\nB'))
  })

  it('returns nothing for empty or blank input', () => {
    expect(parseMarkdown('')).toEqual([])
    expect(parseMarkdown('   \n\n  ')).toEqual([])
  })
})
