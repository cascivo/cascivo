import { describe, expect, it } from 'vitest'
import { tokenizeDocument } from '../engine/tokenize.ts'
import type { Token, TokenKind } from '../engine/types.ts'
import { bash } from './bash.ts'
import { css } from './css.ts'
import { html } from './html.ts'
import { json } from './json.ts'
import { markdown } from './markdown.ts'
import { plaintext } from './plaintext.ts'
import { typescript } from './typescript.ts'
import type { Grammar } from '../engine/types.ts'

/** All grammars must be lossless on every line. */
function expectLossless(grammar: Grammar, text: string): void {
  const lines = text.split('\n')
  const out = tokenizeDocument(grammar, text)
  out.forEach((tokens, i) => {
    expect(tokens.map((t) => t.value).join('')).toBe(lines[i])
  })
}

/** Find the kind a grammar assigns to a given substring on the first line. */
function kindOf(tokens: Token[], value: string): TokenKind | undefined {
  return tokens.find((t) => t.value === value)?.kind
}

describe('plaintext', () => {
  it('emits one plain token per non-empty line', () => {
    const [line] = tokenizeDocument(plaintext, 'hello world')
    expect(line).toEqual([{ kind: 'plain', value: 'hello world' }])
  })
})

describe('json', () => {
  it('distinguishes property keys from string values', () => {
    const [line] = tokenizeDocument(json, '{ "name": "ada", "ok": true, "n": 42 }')
    expect(kindOf(line!, '"name"')).toBe('property')
    expect(kindOf(line!, '"ada"')).toBe('string')
    expect(kindOf(line!, 'true')).toBe('boolean')
    expect(kindOf(line!, '42')).toBe('number')
  })
  it('is lossless', () => expectLossless(json, '{\n  "a": [1, 2, null]\n}'))
})

describe('typescript', () => {
  it('colors keywords and type keywords', () => {
    const [line] = tokenizeDocument(typescript, 'export interface Foo { a: number }')
    expect(kindOf(line!, 'export')).toBe('keyword')
    expect(kindOf(line!, 'interface')).toBe('type')
    expect(kindOf(line!, 'number')).toBe('type')
  })
  it('carries a template literal across lines', () => {
    const out = tokenizeDocument(typescript, 'const s = `a\nb`')
    expect(out[1]!.every((t) => t.kind === 'string')).toBe(true)
  })
})

describe('css', () => {
  it('colors selectors, properties, and at-rules', () => {
    const [line] = tokenizeDocument(css, '.btn { color: red; }')
    expect(kindOf(line!, '.btn')).toBe('tag')
    expect(kindOf(line!, 'color')).toBe('property')
  })
  it('carries block comments across lines', () => {
    const out = tokenizeDocument(css, '/* a\nb */ .x {}')
    expect(out[0]!.every((t) => t.kind === 'comment')).toBe(true)
    expect(out[1]!.some((t) => t.kind === 'comment' && t.value.includes('*/'))).toBe(true)
  })
})

describe('html', () => {
  it('colors tags and attributes', () => {
    const [line] = tokenizeDocument(html, '<a href="x">hi</a>')
    expect(kindOf(line!, '<a')).toBe('tag')
    expect(kindOf(line!, 'href')).toBe('attr')
    expect(kindOf(line!, '"x"')).toBe('string')
  })
  it('carries comments across lines', () => {
    const out = tokenizeDocument(html, '<!-- a\nb -->')
    expect(out[0]!.every((t) => t.kind === 'comment')).toBe(true)
    expect(out[1]!.some((t) => t.kind === 'comment' && t.value.includes('-->'))).toBe(true)
  })
})

describe('markdown', () => {
  it('colors headings, code, and fenced blocks', () => {
    const out = tokenizeDocument(markdown, '# Title\n```\ncode\n```\n`inline`')
    expect(out[0]![0]!.kind).toBe('keyword')
    // Inside the fence, the code line is a string.
    expect(out[2]!.every((t) => t.kind === 'string')).toBe(true)
    expect(kindOf(out[4]!, '`inline`')).toBe('string')
  })
  it('is lossless', () => expectLossless(markdown, '# h\n- item\n**bold** _em_'))
})

describe('bash', () => {
  it('colors comments, keywords, and variables', () => {
    const [line] = tokenizeDocument(bash, 'if [ -n $VAR ]; then # note')
    expect(kindOf(line!, 'if')).toBe('keyword')
    expect(kindOf(line!, '$VAR')).toBe('variable')
    expect(kindOf(line!, '# note')).toBe('comment')
  })
})
