import * as fc from 'fast-check'
import { describe, it } from 'vitest'
import type { Grammar } from './types.ts'
import { plaintext } from '../grammars/plaintext.ts'
import { json } from '../grammars/json.ts'
import { javascript } from '../grammars/javascript.ts'
import { typescript } from '../grammars/typescript.ts'
import { css } from '../grammars/css.ts'
import { html } from '../grammars/html.ts'
import { markdown } from '../grammars/markdown.ts'
import { bash } from '../grammars/bash.ts'

const GRAMMARS: Grammar[] = [plaintext, json, javascript, typescript, css, html, markdown, bash]

/**
 * The Grammar contract (engine/types.ts) requires `tokenizeLine` to be total
 * and lossless: the token values must concatenate back to the input line. Fuzz
 * every grammar with arbitrary strings — including the chaotic, malformed, and
 * unicode input a log/editor surface actually receives — to prove neither
 * property is ever violated (a syntax-highlighter that silently drops or
 * duplicates characters corrupts what the user typed).
 */
describe('grammar tokenizeLine is total and lossless (property)', () => {
  for (const g of GRAMMARS) {
    it(`${g.name}: token values concatenate back to the line, never throws`, () => {
      fc.assert(
        fc.property(fc.string({ maxLength: 200 }), (raw) => {
          // tokenizeLine operates on a single line — strip newlines.
          const line = raw.replace(/[\r\n]/g, ' ')
          const { tokens } = g.tokenizeLine(line, g.initialState)
          return tokens.map((t) => t.value).join('') === line
        }),
      )
    })
  }
})
